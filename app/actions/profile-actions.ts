'use server';

import { 
  getOrCreateUserProfile, 
  updateUserProfile, 
  updateUserProfileStep,
  completeUserProfileOnboarding,
} from '@/lib/db/profile-queries';
import { auth, clerkClient } from '@clerk/nextjs/server';
import type { OnboardingStep } from '@/hooks/use-onboarding';

/**
 * Initialize user profile
 */
export async function initializeUserProfile() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.error('initializeUserProfile: No userId found');
      return { success: false, error: 'User not authenticated' };
    }
    
    console.log('initializeUserProfile: Creating or getting profile for userId:', userId);
    try {
      const profile = await getOrCreateUserProfile(userId);
      console.log('initializeUserProfile: Profile created or retrieved successfully');
      return { success: true, profile };
    } catch (error) {
      console.error('Error in getOrCreateUserProfile:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize user profile',
        details: error
      };
    }
  } catch (authError) {
    console.error('Auth error in initializeUserProfile:', authError);
    return { 
      success: false, 
      error: 'Authentication error', 
      details: authError instanceof Error ? authError.message : String(authError)
    };
  }
}

/**
 * Update profile information (all fields)
 */
export async function updateProfileInfo(profileData: {
  fullName?: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  // stylePreference removed in style step removal
}) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  console.log('Updating profile with data:', profileData);
  
  try {
    const profile = await updateUserProfile(userId, {
      ...profileData,
      lastCompletedStep: 'about',
    });
    
    console.log('Profile after update:', profile);
    
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating profile info:', error);
    return { success: false, error: 'Failed to update profile info' };
  }
}



// updateSelectedTopics function removed - topics step no longer exists

// Content-related functions removed in content step removal



/**
 * Update style preference (Step 6: Style)
 */
// Style preference function removed in style step removal

/**
 * Update preferred hook (Step 7: Hook)
 */
export async function updatePreferredHook(preferredHook: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const profile = await updateUserProfile(userId, {
      preferredHook,
      lastCompletedStep: 'hook',
    });
    
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating preferred hook:', error);
    return { success: false, error: 'Failed to update preferred hook' };
  }
}

/**
 * Complete onboarding (Step 8: Review)
 */
export async function completeOnboarding() {
  const { userId } = await auth();
  
  if (!userId) {
    console.error('[completeOnboarding] No user ID found');
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const profile = await completeUserProfileOnboarding(userId);
    
    // Update Clerk's publicMetadata to reflect onboarding completion
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          onboardingComplete: true
        }
      });
    } catch (metadataError) {
      console.error(`[completeOnboarding] Failed to update Clerk metadata for user ${userId}:`, metadataError);
      // Don't fail the entire operation if metadata update fails
    }
    
    return { success: true, profile };
  } catch (error) {
    console.error(`[completeOnboarding] Error completing onboarding for user ${userId}:`, error);
    return { success: false, error: 'Failed to complete onboarding' };
  }
}

/**
 * Get user profile
 */
export async function getUserProfile() {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const profile = await getOrCreateUserProfile(userId);
    return { success: true, profile };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: 'Failed to get user profile' };
  }
}

/**
 * Update onboarding step
 */
export async function updateOnboardingStep(step: OnboardingStep) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const profile = await updateUserProfileStep(userId, step);
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return { success: false, error: 'Failed to update onboarding step' };
  }
}
