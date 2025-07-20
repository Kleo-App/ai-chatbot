'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/db/profile-queries';
import { generateHookIdeas, type HookIdea } from '@/lib/ai/hook-generator';

/**
 * Get or generate hook ideas based on user profile data
 */
export async function getOrGenerateHooks(): Promise<{ success: boolean; hooks?: HookIdea[]; error?: string }> {
  try {
    console.log('Getting or generating hooks...');
    
    const { userId } = await auth();
    
    if (!userId) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    // First, check if hooks are already stored in the database
    const userProfile = await getOrCreateUserProfile(userId);
    
    if (userProfile?.generatedHooks) {
      try {
        // Parse the stored hooks
        const storedHooks = JSON.parse(userProfile.generatedHooks);
        console.log('Retrieved stored hooks from database:', storedHooks);
        return { success: true, hooks: storedHooks };
      } catch (parseError) {
        console.error('Error parsing stored hooks:', parseError);
        // Continue to generate new hooks if parsing fails
      }
    }
    
    // If no hooks in database or parsing failed, generate new ones
    console.log('No hooks found in database, generating new ones...');
    const hooks = await generateHookIdeas(userId);
    
    // Save the generated hooks to the database
    if (hooks && hooks.length > 0) {
      await updateUserProfile(userId, {
        generatedHooks: JSON.stringify(hooks)
      });
      console.log('Saved generated hooks to database');
    }
    
    console.log('Generated hooks:', hooks);
    
    return { success: true, hooks };
  } catch (error) {
    console.error('Error getting or generating hooks:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Save the preferred hook selected by the user during onboarding
 */
export async function savePreferredHook(hookContent: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Saving preferred hook:', hookContent);
    
    const { userId } = await auth();
    
    if (!userId) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    // Update the user profile with the preferred hook
    await updateUserProfile(userId, {
      preferredHook: hookContent
    });
    
    console.log('Hook saved successfully');
    
    // Revalidate the path to ensure fresh data
    revalidatePath('/onboarding/hook');
    
    return { success: true };
  } catch (error) {
    console.error('Error saving preferred hook:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get the user's preferred hook from their profile
 */
export async function getPreferredHook(): Promise<{ hook: string | null; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    // Get the user profile
    const userProfile = await getOrCreateUserProfile(userId);
    
    if (!userProfile) {
      console.error('User profile not found');
      throw new Error('User profile not found');
    }
    
    return { hook: userProfile.preferredHook || null };
  } catch (error) {
    console.error('Error getting preferred hook:', error);
    return { hook: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
