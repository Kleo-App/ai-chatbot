'use server';

import { auth } from '@clerk/nextjs/server';
import { generateContentIdeas, ContentIdea } from '@/lib/ai/content-generator';
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/db/profile-queries';
import { UserProfile } from '@/lib/db/schema-profile';

// Type for dynamic content properties
type UserProfileWithDynamicProps = UserProfile & Record<string, string | null>;

/**
 * Generate content ideas based on user profile data and selected content type
 */
export async function generateContent(contentType: string): Promise<{ 
  success: boolean; 
  contentIdeas?: ContentIdea[];
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get the user profile to access bio, LinkedIn services, and selected topics
    const userProfile = await getOrCreateUserProfile(userId);
    
    if (!userProfile) {
      return { success: false, error: 'User profile not found' };
    }
    
    // Check if we already have generated content ideas for this content type
    const storedContentKey = `generatedContent_${contentType.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Use type assertion to access dynamic properties
    const userProfileWithDynamicProps = userProfile as UserProfileWithDynamicProps;
    
    if (userProfileWithDynamicProps[storedContentKey]) {
      try {
        const parsedContent = JSON.parse(userProfileWithDynamicProps[storedContentKey] || '[]');
        if (Array.isArray(parsedContent) && parsedContent.length > 0) {
          console.log(`Using previously generated content ideas for ${contentType}`);
          return { success: true, contentIdeas: parsedContent };
        }
      } catch (e) {
        console.warn('Failed to parse stored content ideas, will generate new ones');
      }
    }
    
    // Generate content ideas based on user profile data
    // We'll pass the raw selectedTopics string to the content generator
    // which will handle parsing internally
    const contentIdeas = await generateContentIdeas(
      userProfile.bio || '',
      userProfile.linkedInServices || '',
      userProfile.selectedTopics,
      contentType
    );
    
    if (!contentIdeas || contentIdeas.length === 0) {
      return { 
        success: false, 
        error: 'Failed to generate content ideas' 
      };
    }
    
    // Store the generated content ideas in the user profile
    // Create a properly typed update object
    const updateData: Record<string, string> = {
      [storedContentKey]: JSON.stringify(contentIdeas),
    };
    
    await updateUserProfile(userId, updateData);
    
    return { success: true, contentIdeas };
  } catch (error) {
    console.error('Error generating content ideas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate content ideas'
    };
  }
}

/**
 * Save selected content idea to the user profile
 */
export async function saveSelectedContent(contentJson: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }
    
    await updateUserProfile(userId, {
      contentDetails: contentJson,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving selected content:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save content'
    };
  }
}
