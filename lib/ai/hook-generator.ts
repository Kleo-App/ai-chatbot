'use server';

import OpenAI from 'openai';
import { createTrace, logError, getPrompt, processPromptTemplate } from './langfuse-client';
import { getOrCreateUserProfile } from '@/lib/db/profile-queries';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface HookIdea {
  id: number;
  source: string;
  content: string;
}

/**
 * Generate hook ideas based on user profile data and selected style
 */
export async function generateHookIdeas(userId: string): Promise<HookIdea[]> {
  try {
    // Get user profile data
    const userProfile = await getOrCreateUserProfile(userId);
    
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    // Extract relevant profile information
    const {
      fullName,
      jobTitle,
      company,
      bio,
      postDetails
    } = userProfile;
    
    // Use post details for hook generation
    const postInformation = postDetails || '';

    // Get the prompt template from Langfuse
    const promptTemplate = await getPrompt('hook-generator');
  
    // Process the prompt template with variables
    const prompt = await processPromptTemplate(promptTemplate, {
      fullName: fullName || '',
      jobTitle: jobTitle || '',
      company: company || '',
      bio: bio || '',
      selectedTopics: postInformation // Using postDetails for topic information
    });
    
    console.log('Generating hook ideas with prompt:', prompt);
    
    // Create Langfuse trace for tracking
    const trace = await createTrace('generate_hook_ideas', userId, {
      fullName,
      jobTitle,
      company,
      bio,
      postDetails
    });
    
    // Skip Langfuse tracking if trace creation failed
    if (!trace) {
      console.warn('Skipping Langfuse tracking due to trace creation failure');
    }

    // Create Langfuse generation span
    const generation = trace?.generation({
      name: 'hook_ideas_generation',
      model: 'gpt-4-turbo',
      modelParameters: {
        temperature: 0.7,
        max_tokens: 1000
      },
      input: prompt,
    });
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert LinkedIn content strategist who helps professionals create engaging hooks for their posts. Always respond with valid JSON format containing an array of hook ideas.'
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
      generation?.end({ output: null });
      throw new Error('No content returned from AI');
    }

    console.log('AI response received:', `${content.substring(0, 100)}...`);
    
    // Record successful completion in Langfuse
    generation?.end({ output: content });

    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(content);
      
      if (!parsedResponse.hooks || !Array.isArray(parsedResponse.hooks)) {
        trace?.event({
          name: 'invalid_response_format',
          level: 'ERROR',
          metadata: { content }
        });
        throw new Error('Invalid response format from AI');
      }
      
      // Format the hooks with their types
      const hookIdeas: HookIdea[] = parsedResponse.hooks.map((hook: any, index: number) => {
        return {
          id: index + 1,
          source: hook.type, // Using the type from AI response as the source label
          content: hook.text
        };
      });
      
      trace?.event({
        name: 'hooks_generated',
        level: 'DEFAULT',
        metadata: { count: hookIdeas.length }
      });
      
      return hookIdeas;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      trace?.event({
        name: 'parse_error',
        level: 'ERROR',
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error generating hook ideas:', error);
    
    // Log error to Langfuse
    logError('generate_hook_ideas_error', userId, error instanceof Error ? error : String(error));
    
    // Return default hooks if there's an error
    return getDefaultHookIdeas();
  }
}

/**
 * Get default hook ideas if AI generation fails
 */
function getDefaultHookIdeas(): HookIdea[] {
  return [
    {
      id: 1,
      source: "Monetisable Expertise",
      content: "I turned my biggest career failure into a $50k consulting framework."
    },
    {
      id: 2,
      source: "Strategic Arbitrage", 
      content: "While everyone's chasing AI, I'm building the human skills that will be irreplaceable."
    },
    {
      id: 3,
      source: "Educational",
      content: "Here's the 3-step framework that helped me 10x my productivity in 30 days:"
    },
    {
      id: 4,
      source: "Highly Engaging",
      content: "My biggest mistake cost me 6 months and $100k. Here's what I learned:"
    }
  ];
}
