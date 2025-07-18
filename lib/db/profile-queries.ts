import 'server-only';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { userProfile, type UserProfile } from './schema-profile';
import { ChatSDKError } from '../errors';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

/**
 * Create a new user profile
 */
export async function createUserProfile(userId: string): Promise<UserProfile> {
  try {
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
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get or create user profile',
    );
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
    
    return completedProfile;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to complete user profile onboarding',
    );
  }
}
