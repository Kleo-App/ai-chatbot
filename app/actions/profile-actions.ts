'use server';

import { 
  getOrCreateUserProfile, 
  updateUserProfile, 
  updateUserProfileStep,
  completeUserProfileOnboarding,
  getUserProfileByUserId
} from '@/lib/db/profile-queries';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { OnboardingStep } from '@/hooks/use-onboarding';

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
 * Update profile information (Step 1: Welcome)
 */
export async function updateProfileInfo(data: {
  fullName?: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const profile = await updateUserProfile(userId, {
      ...data,
      lastCompletedStep: 'profile',
    });
    
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating profile info:', error);
    return { success: false, error: 'Failed to update profile info' };
  }
}

/**
 * Update LinkedIn services (Step 2: Profile)
 */
export async function updateLinkedInServices(linkedInServices: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const profile = await updateUserProfile(userId, {
      linkedInServices,
      lastCompletedStep: 'topics',
    });
    
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating LinkedIn services:', error);
    return { success: false, error: 'Failed to update LinkedIn services' };
  }
}

/**
 * Update selected topics (Step 3: Topics)
 */
export async function updateSelectedTopics(selectedTopics: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const profile = await updateUserProfile(userId, {
      selectedTopics,
      lastCompletedStep: 'content',
    });
    
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating selected topics:', error);
    return { success: false, error: 'Failed to update selected topics' };
  }
}

/**
 * Update content type (Step 4: Content)
 */
export async function updateContentType(contentType: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const profile = await updateUserProfile(userId, {
      contentType,
      lastCompletedStep: 'details',
    });
    
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating content type:', error);
    return { success: false, error: 'Failed to update content type' };
  }
}

/**
 * Update content details (Step 5: Details)
 */
export async function updateContentDetails(contentDetails: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const profile = await updateUserProfile(userId, {
      contentDetails,
      lastCompletedStep: 'style',
    });
    
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating content details:', error);
    return { success: false, error: 'Failed to update content details' };
  }
}

/**
 * Update style preference (Step 6: Style)
 */
export async function updateStylePreference(stylePreference: string) {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    const profile = await updateUserProfile(userId, {
      stylePreference,
      lastCompletedStep: 'hook',
    });
    
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating style preference:', error);
    return { success: false, error: 'Failed to update style preference' };
  }
}

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
      lastCompletedStep: 'review',
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
