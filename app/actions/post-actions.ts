'use server';

import { auth } from '@clerk/nextjs/server';
import { generatePostIdeas, type PostIdea } from '@/lib/ai/post-generator';
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/db/profile-queries';

/**
 * Get or generate LinkedIn post ideas for the current user
 */
export async function getOrGeneratePosts(): Promise<{ success: boolean; posts?: PostIdea[]; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check if user already has generated posts
    const userProfileData = await getOrCreateUserProfile(userId);
    
    if (userProfileData?.generatedPosts) {
      const storedPosts = JSON.parse(userProfileData.generatedPosts);
      return { success: true, posts: storedPosts };
    }
    
    // Generate new posts if none exist
    const posts = await generatePostIdeas(userId);
    
    if (posts && posts.length > 0) {
      // Save generated posts to database
      await updateUserProfile(userId, { generatedPosts: JSON.stringify(posts) });
      return { success: true, posts };
    }
    
    return { success: false, error: 'Failed to generate posts' };
  } catch (error) {
    console.error('Error in getOrGeneratePosts:', error);
    return { success: false, error: 'An error occurred while getting or generating posts' };
  }
}

/**
 * Save the user's preferred post
 */
export async function savePreferredPost(postContent: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }
    
    await updateUserProfile(userId, { preferredPost: postContent });
    
    return { success: true };
  } catch (error) {
    console.error('Error in savePreferredPost:', error);
    return { success: false, error: 'An error occurred while saving preferred post' };
  }
}

/**
 * Get the user's preferred post
 */
export async function getPreferredPost(): Promise<{ success: boolean; post?: string; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const userProfileData = await getOrCreateUserProfile(userId);
    
    return { 
      success: true, 
      post: userProfileData?.preferredPost || '' 
    };
  } catch (error) {
    console.error('Error in getPreferredPost:', error);
    return { success: false, error: 'An error occurred while getting preferred post' };
  }
}

/**
 * Delete a post/document by ID
 */
export async function deletePost(documentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Import the delete function
    const { deleteDocumentById } = await import('@/lib/db/queries');
    
    await deleteDocumentById({ id: documentId, userId });
    
    return { success: true };
  } catch (error) {
    console.error('Error in deletePost:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred while deleting the post' 
    };
  }
}


