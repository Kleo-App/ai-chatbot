'use server';

import { auth } from '@clerk/nextjs/server';
import { generatePostIdeas, type PostIdea } from '@/lib/ai/post-generator';
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/db/profile-queries';
import { storePostAnalyticsBackground, analyzePostStructure } from '@/lib/mem0Utils';

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
export async function savePreferredPost(postContent: string, availablePosts?: PostIdea[], topic?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }
    
    await updateUserProfile(userId, { preferredPost: postContent });
    
    // Store post analytics in background (non-blocking)
    if (postContent) {
      // Analyze post and store analytics in background
      analyzePostStructure(postContent).then(analysis => {
        // Extract the hook (first line/sentence)
        const lines = postContent.split('\n').filter(line => line.trim().length > 0);
        const selectedHook = lines[0] || postContent.substring(0, 100);
        
        storePostAnalyticsBackground(
          userId,
          {
            selectedHook,
            tone: analysis.tone,
            structure: analysis.structure,
            endingSentence: analysis.endingSentence,
            fullContent: postContent,
            wordCount: postContent.split(/\s+/).length,
            publishedToLinkedIn: false,
            keywordDensity: analysis.keywordDensity,
            topIndustry: analysis.topIndustry,
            industryFitScore: analysis.industryFitScore,
            detectedKeywords: analysis.detectedKeywords,
            ctaCount: analysis.ctaCount,
            ctaStrength: analysis.ctaStrength,
            ctaPlacement: analysis.ctaPlacement,
            detectedCTAs: analysis.detectedCTAs,
          },
          {
            topic: topic || 'post_selection',
            generatedOptions: availablePosts?.length || 0,
            selectionReason: 'user_selected_from_options',
          }
        );
      }).catch(error => {
        console.error('Failed to analyze post for analytics:', error);
        // Even if analysis fails, store basic analytics
        const lines = postContent.split('\n').filter(line => line.trim().length > 0);
        const selectedHook = lines[0] || postContent.substring(0, 100);
        
        storePostAnalyticsBackground(
          userId,
          {
            selectedHook,
            tone: 'unknown',
            structure: 'unknown',
            endingSentence: '',
            fullContent: postContent,
            wordCount: postContent.split(/\s+/).length,
            publishedToLinkedIn: false,
            keywordDensity: {},
            topIndustry: 'general',
            industryFitScore: 0,
            detectedKeywords: [],
            ctaCount: 0,
            ctaStrength: 0,
            ctaPlacement: 'none',
            detectedCTAs: [],
          },
          {
            topic: topic || 'post_selection',
            generatedOptions: availablePosts?.length || 0,
            selectionReason: 'user_selected_from_options',
          }
        );
      });
    }
    
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

/**
 * Store post analytics in the background (server-side)
 */
export async function storePostAnalytics(content: string, metadata?: { topic?: string; selectionReason?: string }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Analyze post and store analytics in background
    const analysis = await analyzePostStructure(content);
    
    // Extract the hook (first line/sentence)
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const selectedHook = lines[0] || content.substring(0, 100);
    
    await storePostAnalyticsBackground(
      userId,
      {
        selectedHook,
        tone: analysis.tone,
        structure: analysis.structure,
        endingSentence: analysis.endingSentence,
        fullContent: content,
        wordCount: content.split(/\s+/).length,
        publishedToLinkedIn: true,
        keywordDensity: analysis.keywordDensity,
        topIndustry: analysis.topIndustry,
        industryFitScore: analysis.industryFitScore,
        detectedKeywords: analysis.detectedKeywords,
        ctaCount: analysis.ctaCount,
        ctaStrength: analysis.ctaStrength,
        ctaPlacement: analysis.ctaPlacement,
        detectedCTAs: analysis.detectedCTAs,
      },
      metadata || {
        topic: 'linkedin_publish',
        selectionReason: 'user_published_post',
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Failed to store post analytics:', error);
    
    // Even if analysis fails, try to store basic analytics
    try {
      const { userId } = await auth();
      if (userId) {
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        const selectedHook = lines[0] || content.substring(0, 100);
        
        await storePostAnalyticsBackground(
          userId,
          {
            selectedHook,
            tone: 'unknown',
            structure: 'unknown',
            endingSentence: '',
            fullContent: content,
            wordCount: content.split(/\s+/).length,
            publishedToLinkedIn: true,
            keywordDensity: {},
            topIndustry: 'general',
            industryFitScore: 0,
            detectedKeywords: [],
            ctaCount: 0,
            ctaStrength: 0,
            ctaPlacement: 'none',
            detectedCTAs: [],
          },
          metadata || {
            topic: 'linkedin_publish',
            selectionReason: 'user_published_post',
          }
        );
      }
    } catch (fallbackError) {
      console.error('Failed to store even basic analytics:', fallbackError);
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

