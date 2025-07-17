'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/db/profile-queries';

/**
 * Save the style preference selected by the user during onboarding without advancing to the next step
 */
export async function saveStylePreference(style: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Saving style preference:', style);
    
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
    
    // Update the user profile with the style preference but keep the current step
    await updateUserProfile(userId, {
      stylePreference: style,
      // Don't update lastCompletedStep here to avoid advancing to the next step
    });
    
    console.log('Style preference saved successfully');
    
    // Revalidate the path to ensure fresh data
    revalidatePath('/onboarding/style');
    
    return { success: true };
  } catch (error) {
    console.error('Error saving style preference:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get the user's style preference from their profile
 */
export async function getStylePreference(): Promise<{ style: string | null; error?: string }> {
  try {
    // Use the existing getUserProfile function from profile-actions.ts
    const { getUserProfile } = await import('@/app/actions/profile-actions');
    const result = await getUserProfile();
    
    if (!result.success || !result.profile) {
      throw new Error(result.error || 'Failed to get user profile');
    }
    
    return { style: result.profile.stylePreference || null };
  } catch (error) {
    console.error('Error getting style preference:', error);
    return { style: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
