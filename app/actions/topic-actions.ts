'use server';

import { auth } from '@clerk/nextjs/server';
import { generateTopicSuggestions, type TopicSuggestion } from '@/lib/ai/topic-generator';
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/db/profile-queries';
import { updateSelectedTopics } from './profile-actions';

/**
 * Generate AI topic suggestions based on user profile data
 * and save them to the database
 */
export async function generateTopics(): Promise<{ 
  success: boolean; 
  topics?: TopicSuggestion[];
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get the user profile to access bio and LinkedIn services
    const userProfile = await getOrCreateUserProfile(userId);
    
    if (!userProfile) {
      return { success: false, error: 'User profile not found' };
    }
    
    // Check if we already have generated topics stored
    if (userProfile.generatedTopics) {
      try {
        const parsedTopics = JSON.parse(userProfile.generatedTopics);
        if (Array.isArray(parsedTopics) && parsedTopics.length > 0) {
          console.log('Using previously generated topics');
          return { success: true, topics: parsedTopics };
        }
      } catch (e) {
        console.warn('Failed to parse stored generated topics, will generate new ones');
      }
    }
    
    // Generate topic suggestions based on profile data
    const topics = await generateTopicSuggestions(
      userProfile.bio === null ? undefined : userProfile.bio // Convert null to undefined
    );
    
    let finalTopics: TopicSuggestion[];
    
    if (!topics || topics.length === 0) {
      // Fallback to default topics if AI generation fails
      finalTopics = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Topic suggestion ${i + 1}`,
        subtitle: 'Default suggestion'
      }));
    } else {
      finalTopics = topics;
    }
    
    // Save the generated topics to the user profile
    await saveGeneratedTopics(JSON.stringify(finalTopics));
    
    return { success: true, topics: finalTopics };
  } catch (error) {
    console.error('Error generating topics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate topics'
    };
  }
}

/**
 * Save selected topics to user profile
 */
export async function saveSelectedTopics(topicsJson: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const result = await updateSelectedTopics(topicsJson);
    
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to update topics' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving selected topics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save topics'
    };
  }
}

/**
 * Save generated topics to the user profile
 */
async function saveGeneratedTopics(topicsJson: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }
    
    await updateUserProfile(userId, {
      generatedTopics: topicsJson,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving generated topics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save generated topics'
    };
  }
}
