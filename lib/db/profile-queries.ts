import 'server-only';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { userProfile, type UserProfile } from './schema-profile';
import { ChatSDKError } from '../errors';
import { clerkClient } from '@clerk/nextjs/server';
import { getOrCreateUser } from './queries';
import { addOrUpdateMemory } from '../mem0Utils';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Create a new user profile
 */
export async function createUserProfile(userId: string): Promise<UserProfile> {
  try {
    // First, ensure the user exists in the main user table
    // Get user info from Clerk to create the user record if needed
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    await getOrCreateUser({
      id: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
    });
    
    // Now create the user profile
    const [newProfile] = await db
      .insert(userProfile)
      .values({
        userId,
        lastCompletedStep: 'welcome',
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return newProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create user profile',
    );
  }
}

/**
 * Get the user profile by user ID
 */
export async function getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
  try {
    const profiles = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, userId));
    
    return profiles.length > 0 ? profiles[0] : null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user profile',
    );
  }
}

/**
 * Get or create a user profile
 */
export async function getOrCreateUserProfile(userId: string): Promise<UserProfile> {
  try {
    const existingProfile = await getUserProfileByUserId(userId);
    if (existingProfile) {
      return existingProfile;
    }
    
    return await createUserProfile(userId);
  } catch (error) {
    console.error('Error in getOrCreateUserProfile:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get or create user profile',
    );
  }
}

/**
 * Get user profile without creating one if it doesn't exist
 */
export async function getUserProfileOnly(userId: string): Promise<UserProfile | null> {
  try {
    return await getUserProfileByUserId(userId);
  } catch (error) {
    console.error(`[getUserProfileOnly] Error fetching profile for user ${userId}:`, error);
    return null;
  }
}

/**
 * Update the user profile
 */
export async function updateUserProfile(
  userId: string, 
  data: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt'>>
): Promise<UserProfile> {
  try {
    const [updatedProfile] = await db
      .update(userProfile)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userProfile.userId, userId))
      .returning();
    
    // Store profile data in Mem0 for personalization
    try {
      const personalizationContent = `Job Title: ${updatedProfile.jobTitle || 'Not specified'}, Company: ${updatedProfile.company || 'Not specified'}, Bio: ${updatedProfile.bio || 'Not specified'}`;
      
      await addOrUpdateMemory(
        userId,
        'personalization',
        personalizationContent,
        { source: 'onboarding' }
      );
    } catch (mem0Error) {
      // Log but don't fail the profile update if Mem0 storage fails
      console.error('Failed to store profile data in Mem0:', mem0Error);
    }
    
    return updatedProfile;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update user profile',
    );
  }
}

/**
 * Update the onboarding step
 */
export async function updateUserProfileStep(
  userId: string, 
  step: string
): Promise<UserProfile> {
  try {
    const [updatedProfile] = await db
      .update(userProfile)
      .set({
        lastCompletedStep: step,
        updatedAt: new Date(),
      })
      .where(eq(userProfile.userId, userId))
      .returning();
    
    return updatedProfile;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update user profile step',
    );
  }
}

/**
 * Extract goals and niche from user bio
 * @param bio User's biography text
 * @returns Extracted goals and niche information
 */
async function extractGoalsFromBio(bio: string | null): Promise<string> {
  if (!bio) return 'No goals specified';
  
  // Simple extraction logic - look for keywords related to goals and niches
  const goalKeywords = ['goal', 'aim', 'objective', 'target', 'aspire', 'want to', 'looking to'];
  const nicheKeywords = ['industry', 'niche', 'sector', 'field', 'specialize', 'focus'];
  
  // Extract sentences containing goal-related keywords
  const sentences = bio.split(/[.!?]\s+/);
  const goalSentences = sentences.filter(sentence => 
    goalKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
  );
  
  // Extract sentences containing niche-related keywords
  const nicheSentences = sentences.filter(sentence => 
    nicheKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
  );
  
  // Combine the extracted information
  let extractedInfo = '';
  
  if (goalSentences.length > 0) {
    extractedInfo += 'Goals: ' + goalSentences.join('. ') + '. ';
  }
  
  if (nicheSentences.length > 0) {
    extractedInfo += 'Niche: ' + nicheSentences.join('. ') + '.';
  }
  
  // If no specific goals or niche found, use the entire bio
  if (extractedInfo.trim() === '') {
    extractedInfo = 'General profile: ' + bio;
  }
  
  return extractedInfo;
}

/**
 * Complete the user profile onboarding
 */
export async function completeUserProfileOnboarding(userId: string): Promise<UserProfile> {
  try {
    const [completedProfile] = await db
      .update(userProfile)
      .set({
        onboardingCompleted: true,
        lastCompletedStep: 'complete',
        updatedAt: new Date(),
      })
      .where(eq(userProfile.userId, userId))
      .returning();
    
    // Store profile data in Mem0 for personalization
    try {
      // First, store the complete profile information
      const personalizationContent = `Job Title: ${completedProfile.jobTitle || 'Not specified'}, Company: ${completedProfile.company || 'Not specified'}, Bio: ${completedProfile.bio || 'Not specified'}`;
      
      await addOrUpdateMemory(
        userId,
        'personalization',
        personalizationContent,
        { source: 'onboarding_complete' }
      );
      
      // Then, extract goals/niche from bio and store separately
      if (completedProfile.bio) {
        const goalsContent = await extractGoalsFromBio(completedProfile.bio);
        
        await addOrUpdateMemory(
          userId,
          'user_goals',
          goalsContent,
          { source: 'bio_extraction' }
        );
      }
    } catch (mem0Error) {
      // Log but don't fail the profile completion if Mem0 storage fails
      console.error('Failed to store profile data in Mem0:', mem0Error);
    }
    
    return completedProfile;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to complete user profile onboarding',
    );
  }
}
