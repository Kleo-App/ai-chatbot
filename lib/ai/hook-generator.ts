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
      selectedTopics,
      contentType,
      contentDetails,
      stylePreference
    } = userProfile;
    
    // Parse selected topics if available
    let topics: any[] = [];
    if (selectedTopics) {
      try {
        topics = JSON.parse(selectedTopics);
      } catch (e) {
        console.warn('Failed to parse selected topics');
      }
    }

    // Get the prompt template from Langfuse
    const promptTemplate = await getPrompt('hook-generator');
  
    // Prepare variables for the prompt template
    const selectedTopicsText = Array.isArray(selectedTopics) ? selectedTopics.map((topic: any) => topic.title).join('\n') : '';
    
    // Process the prompt template with variables
    const prompt = await processPromptTemplate(promptTemplate, {
      fullName: fullName || '',
      jobTitle: jobTitle || '',
      company: company || '',
      bio: bio || '',
      selectedTopics: selectedTopicsText,
      contentType: contentType ?? '',
      contentDetails: contentDetails ?? '',
      stylePreference: stylePreference ?? ''
    });
    
    console.log('Generating hook ideas with prompt:', prompt);
    
    // Create Langfuse trace for tracking
    const trace = await createTrace('generate_hook_ideas', userId, {
      fullName,
      jobTitle,
      company,
      bio,
      selectedTopics,
      contentType,
      contentDetails,
      stylePreference
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
      
      // Format the hooks with sources
      const hookIdeas: HookIdea[] = parsedResponse.hooks.map((hook: any, index: number) => {
        let source = 'From Kleo AI';
        
        if (index === 0) {
          source = stylePreference === 'kleo-generated' 
            ? 'From your writing style' 
            : stylePreference === 'jake'
              ? 'From Jake\'s style'
              : stylePreference === 'lara'
                ? 'From Lara\'s style'
                : 'From Kleo AI';
        } else if (index === 1 && topics.length > 0) {
          source = 'From your topic';
        }
        
        return {
          id: index + 1,
          source,
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
      source: "From your writing style",
      content: "Burnout nearly destroyed my team — until AI became our secret weapon."
    },
    {
      id: 2,
      source: "From your topic",
      content: "From Burnout to Brilliance: My Journey Coaching a Team from Skeptical to Supercharged with Automated AI Agents"
    },
    {
      id: 3,
      source: "From Kleo AI",
      content: "The moment I realized my team was burning out wasn't when they started missing deadlines—it was when they stopped complaining about them."
    }
  ];
}
