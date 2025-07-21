'use server';

import OpenAI from 'openai';
import { createTrace, logError, getPrompt, processPromptTemplate } from './langfuse-client';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate example content based on user profile data
 * @param fullName User's full name
 * @param jobTitle User's job title
 * @param company User's company
 * @param bio User's bio
 */
export async function generateExampleContent(
  fullName?: string,
  jobTitle?: string,
  company?: string,
  bio?: string
): Promise<string> {
  // Default content in case of failure
  const defaultContent = JSON.stringify({
    topics: [
      {
        title: "Sharing Industry Insights and Best Practices",
        description: "Leverage your professional experience to help others navigate common challenges. This topic aligns with your expertise and has potential to establish you as a thought leader in your field."
      }
    ]
  });
  
  try {
    
    // Check for network connectivity before proceeding
    try {
      const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com';
      await fetch(OPENAI_API_URL, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
    } catch (networkError) {
      console.warn('Network connectivity issue detected with OpenAI API:', networkError);
      return defaultContent;
    }

    // If no bio is provided, return default content
    if (!bio && !jobTitle) {
      return defaultContent;
    }

    // Create Langfuse trace for tracking
    const trace = await createTrace('generate_example_content', bio || 'anonymous', {
      fullName,
      jobTitle,
      company,
      bio
    });

    // Skip Langfuse tracking if trace creation failed
    if (!trace) {
      console.warn('Skipping Langfuse tracking due to trace creation failure');
    }

    // Create Langfuse generation span
    const generation = await trace?.generation({
      name: 'example_content_generation',
      model: 'gpt-4-turbo',
      modelParameters: {
        temperature: 0.7,
        max_tokens: 1000
      },
      input: { fullName, jobTitle, company, bio },
    });

    // Get the prompt from Langfuse
    const promptTemplate = await getPrompt('topic-generator');
    
    // Add JSON format instructions to the prompt
    const jsonFormatInstructions = `\n\nOutput exactly 1 topic in this JSON format—no extra text:\n{\n"topics": [\n{\n"title": "Engaging title that could be the post's hook",\n"description": "2-3 sentences on why this fits the user's expertise, appeals to their audience, and has viral potential"\n}\n]\n}`;
    
    // Process the prompt template with user variables
    const prompt = await processPromptTemplate(promptTemplate, {
      bio: bio || ''
    }) + jsonFormatInstructions;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist who helps professionals create engaging LinkedIn content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      generation?.end({ output: null });
      trace?.event({
        name: 'no_content_returned',
        level: 'ERROR'
      });
      return defaultContent;
    }
    
    // Ensure the response is valid JSON
    try {
      // Try to parse the content as JSON
      JSON.parse(content);
      // If successful, return the content as is
      generation?.end({ output: content });
      return content;
    } catch (jsonError) {
      // If not valid JSON, try to extract JSON from the text
      const jsonMatch = content.match(/\{[\s\S]*\}/g);
      if (jsonMatch) {
        try {
          // Try to parse the extracted JSON
          const extractedJson = jsonMatch[0];
          JSON.parse(extractedJson);
          generation?.end({ output: extractedJson });
          return extractedJson;
        } catch (extractError) {
          console.warn('Could not extract valid JSON from response');
        }
      }
      
      // If all parsing attempts fail, return default content
      trace?.event({
        name: 'invalid_json_format',
        level: 'WARNING'
      });
      return defaultContent;
    }
  } catch (error) {
    console.error('Error generating example content:', error);
    
    // Log error to Langfuse
    logError('generate_example_content_error', bio || 'anonymous', error instanceof Error ? error : String(error));
    
    // Return default content if there's an error
    return defaultContent;
  }
}
