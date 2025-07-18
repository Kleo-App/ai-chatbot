'use server';

import { getOrCreateUser } from '@/lib/db/queries';
import { getOrCreateUserProfile } from '@/lib/db/profile-queries';

export async function checkAndCreateUser(userId: string, email: string, firstName?: string, lastName?: string) {
  try {
    // Get or create the user
    const user = await getOrCreateUser({
      id: userId,
      email: email,
      firstName,
      lastName,
    });
    
    // Also get or create the user profile
    const userProfile = await getOrCreateUserProfile(userId);
    
    return { success: true, user, userProfile };
  } catch (error) {
    console.error('Error checking/creating user:', error);
    return { success: false, error: 'Failed to check or create user' };
  }
}
