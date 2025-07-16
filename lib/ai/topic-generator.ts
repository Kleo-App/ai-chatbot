'use server';

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TopicSuggestion {
  id: number;
  title: string;
  subtitle: string;
}

/**
 * Generate topic suggestions based on user profile data
 */
export async function generateTopicSuggestions(
  bio: string | null | undefined,
  linkedInServices: string | null | undefined
): Promise<TopicSuggestion[]> {
  try {
    // Create a prompt based on available user data
    let prompt = 'Generate 10 professional LinkedIn content topics';
    
    if (bio || linkedInServices) {
      prompt += ' based on the following information:\n\n';
      
      if (bio) {
        prompt += `User Bio: ${bio}\n\n`;
      }
      
      if (linkedInServices) {
        prompt += `LinkedIn Services/Products: ${linkedInServices}\n\n`;
      }
    }
    
    prompt += 'Each topic should be specific, engaging, and relevant to professional audiences. ' +
      'Format the response as a JSON array of objects with "title" properties only. ' +
      'Make topics specific and actionable. Each topic should be 5-10 words.';

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert LinkedIn content strategist who helps professionals create engaging content topics.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from AI');
    }

    // Parse the JSON response
    const parsedContent = JSON.parse(content);
    console.log('AI response:', parsedContent);
    
    // Handle different possible response formats
    let topicsArray: Array<{title: string}> = [];
    
    if (Array.isArray(parsedContent)) {
      // If the response is directly an array
      topicsArray = parsedContent;
    } else if (parsedContent.topics && Array.isArray(parsedContent.topics)) {
      // If the response has a topics property that is an array
      topicsArray = parsedContent.topics;
    } else if (typeof parsedContent === 'object') {
      // If the response is an object with properties that could be topics
      // Extract any array or convert object properties to an array
      const possibleArrays = Object.values(parsedContent).filter(val => Array.isArray(val));
      if (possibleArrays.length > 0) {
        topicsArray = possibleArrays[0];
      } else {
        // Last resort: try to extract properties that might be topic objects
        const topicObjects = Object.values(parsedContent).filter(val => 
          typeof val === 'object' && val !== null && 'title' in val
        );
        if (topicObjects.length > 0) {
          topicsArray = topicObjects as Array<{title: string}>;
        }
      }
    }
    
    // If we still don't have topics, create default ones
    if (topicsArray.length === 0) {
      console.warn('Could not extract topics from AI response, using defaults');
      return Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Topic suggestion ${i + 1}`,
        subtitle: 'Default suggestion'
      }));
    }
    
    // Map the topics to the expected format
    return topicsArray.map((topic: any, index: number) => ({
      id: index + 1,
      title: topic.title || `Topic ${index + 1}`,
      subtitle: 'AI-generated for you'
    }));
  } catch (error) {
    console.error('Error generating topic suggestions:', error);
    // Return empty array if there's an error
    return [];
  }
}
