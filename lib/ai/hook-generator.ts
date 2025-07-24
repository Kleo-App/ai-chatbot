'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createTrace, logError, getPrompt, processPromptTemplate } from './langfuse-client';
import { getOrCreateUserProfile } from '@/lib/db/profile-queries';

export interface HookIdea {
  id: number;
  source: string;
  content: string;
}

/**
 * Generate hook ideas based on user profile data and selected style
 * @param userId - The user ID to fetch profile data
 * @param overrideBio - Optional bio text to override the user profile bio
 * @param overrideTopics - Optional topics to override the user profile postDetails
 */
export async function generateHookIdeas(
  userId: string,
  overrideBio?: string,
  overrideTopics?: string
): Promise<HookIdea[]> {
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
    
    // Use override values if provided, otherwise use profile data
    const userBio = overrideBio || bio || '';
    const postInformation = overrideTopics || postDetails || '';

    // Get the prompt template from Langfuse
    const promptTemplate = await getPrompt('hook-generator');
  
    // Process the prompt template with variables
    const prompt = await processPromptTemplate(promptTemplate, {
      fullName: fullName || '',
      jobTitle: jobTitle || '',
      company: company || '',
<<<<<<< HEAD
      bio: userBio, // Using the override bio if provided
      selectedTopics: postInformation // Using override topics if provided
=======
      bio: bio || '',
      postInformation: postInformation
>>>>>>> 847633d (model fixes)
    });

    console.log('Generating hook ideas with prompt:', prompt);

    // Create Langfuse trace for tracking
    const trace = await createTrace('generate_hook_ideas', userId, {
      fullName,
      jobTitle,
      company,
      bio,
      postInformation
    });

    // Skip Langfuse tracking if trace creation failed
    if (!trace) {
      console.warn('Skipping Langfuse tracking due to trace creation failure');
    }

    // Create Langfuse generation span
    const generation = await trace?.generation({
      name: 'hook_ideas_generation',
      model: 'claude-4-sonnet-20250514',
      modelParameters: {
        temperature: 0.7,
        max_tokens: 1000
      },
      input: prompt,
    });
    
    console.log('Sending prompt to Anthropic');

    // Call Anthropic API using AI SDK
    const { text } = await generateText({
      model: anthropic('claude-4-sonnet-20250514'),
      system: 'You are an expert LinkedIn content strategist who helps professionals create engaging hooks for their posts. Always respond with valid JSON format containing an array of hook ideas.',
      prompt: prompt,
      temperature: 0.7,
    });

    // Extract and parse the response
    const content = text;

    if (!content) {
      console.error('No content returned from Anthropic');
      throw new Error('No content returned from AI model');
    }

<<<<<<< HEAD
    console.log('AI response received:', content);
    console.log('AI response type:', typeof content);
=======
    console.log('Raw response from Anthropic:', content);
>>>>>>> 847633d (model fixes)
    
    // Update Langfuse generation with output
    await generation?.update({
      output: content,
    });

    // Parse the JSON response
    let parsedResponse;
    try {
      // Clean up the response - remove any markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Error parsing Anthropic response as JSON:', parseError);
      console.log('Raw content that failed to parse:', content);
      
      // Log the error in Langfuse
      await logError('parse_hook_ideas_response', userId, parseError as Error);
      
      throw new Error('Failed to parse AI response as valid JSON');
    }
      
    if (!parsedResponse.hooks || !Array.isArray(parsedResponse.hooks)) {
      console.error('Invalid response structure:', parsedResponse);
      throw new Error('Invalid response structure from AI model');
    }

    // Validate and clean the response
    const hookIdeas: HookIdea[] = parsedResponse.hooks.map((hook: any, index: number) => ({
      id: hook.id || index + 1,
      source: hook.source || hook.category || 'Generated',
      content: hook.content || hook.text || hook.hook || ''
    }));

    console.log('Generated hook ideas:', hookIdeas);

    return hookIdeas;

  } catch (error) {
    console.error('Error in generateHookIdeas:', error);
    
    // Log the error in Langfuse
    await logError('generate_hook_ideas', userId, error as Error);
    
    throw error;
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
