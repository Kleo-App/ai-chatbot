'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/db/profile-queries';
import { UserProfile } from '@/lib/db/schema-profile';

/**
 * Save the content details entered by the user during onboarding
 */
export async function saveContentDetails(content: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Saving content details:', content.substring(0, 50) + '...');
    
    const { userId } = await auth();
    
    if (!userId) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('User authenticated, userId:', userId);
    
    // Get the user profile
    const userProfile = await getOrCreateUserProfile(userId);
    
    if (!userProfile) {
      console.error('User profile not found');
      throw new Error('User profile not found');
    }
    
    console.log('User profile found:', userProfile.id);
    console.log('Current contentDetails:', userProfile.contentDetails);
    
    // Update the user profile with the content details
    const updatedProfile = await updateUserProfile(userId, {
      contentDetails: content
    });
    
    console.log('Profile updated, new contentDetails:', updatedProfile.contentDetails);
    
    // Revalidate the path to ensure fresh data
    revalidatePath('/onboarding/details');
    revalidatePath('/onboarding/style');
    
    return { success: true };
  } catch (error) {
    console.error('Error saving content details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
