'use server';

import { Langfuse } from 'langfuse';
import { cache } from 'react';

/**
 * Singleton class for Langfuse client
 * Ensures only one instance of Langfuse client is created
 */
class LangfuseClientSingleton {
  private static instance: Langfuse | null = null;

  /**
   * Get the Langfuse client instance
   * Creates a new instance if one doesn't exist
   */
  public static getInstance(): Langfuse {
    if (!LangfuseClientSingleton.instance) {
      LangfuseClientSingleton.instance = new Langfuse({
        secretKey: process.env.LANGFUSE_SECRET_KEY,
        publicKey: process.env.LANGFUSE_PUBLIC_KEY,
        baseUrl: process.env.LANGFUSE_HOST || 'https://us.cloud.langfuse.com'
      });
    }

    return LangfuseClientSingleton.instance;
  }
}

/**
 * Get the Langfuse client instance
 * Convenience function to access the singleton
 */
export function getLangfuseClient(): Langfuse {
  return LangfuseClientSingleton.getInstance();
}

/**
 * Create a trace with error handling
 * @param name Trace name
 * @param userId User ID
 * @param metadata Optional metadata
 */
export function createTrace(name: string, userId: string, metadata?: Record<string, any>) {
  try {
    return getLangfuseClient().trace({
      name,
      userId,
      metadata
    });
  } catch (error) {
    console.error('Error creating Langfuse trace:', error);
    return null;
  }
}

/**
 * Log an error to Langfuse
 * @param name Error trace name
 * @param userId User ID
 * @param error Error object or message
 */
export function logError(name: string, userId: string, error: Error | string) {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const trace = getLangfuseClient().trace({
      name,
      userId,
      metadata: { error: errorMessage }
    });
    
    trace.event({
      name: 'error',
      level: 'ERROR',
      metadata: { error: errorMessage }
    });
  } catch (langfuseError) {
    console.error('Error logging to Langfuse:', langfuseError);
  }
}

/**
 * Cache of prompts to avoid repeated API calls
 */
const promptCache = new Map<string, string>();

/**
 * Get a prompt from Langfuse by name
 * Uses React cache to avoid repeated API calls in the same render cycle
 * @param promptName Name of the prompt in Langfuse
 */
export const getPrompt = cache(async (promptName: string): Promise<string> => {
  // Check cache first
  if (promptCache.has(promptName)) {
    return promptCache.get(promptName)!;
  }
  
  try {
    // Get prompt from Langfuse
    const prompt = await getLangfuseClient().getPrompt(promptName);
    
    if (!prompt || !prompt.prompt) {
      console.warn(`Prompt '${promptName}' not found in Langfuse, using fallback`);
      return getFallbackPrompt(promptName);
    }
    
    // Cache the prompt
    promptCache.set(promptName, prompt.prompt);
    return prompt.prompt;
  } catch (error) {
    console.error(`Error fetching prompt '${promptName}' from Langfuse:`, error);
    return getFallbackPrompt(promptName);
  }
});

/**
 * Get a fallback prompt when Langfuse is unavailable
 * @param promptName Name of the prompt
 */
function getFallbackPrompt(promptName: string): string {
  // Fallback prompts for each generator
  const fallbackPrompts: Record<string, string> = {
    'topic-generator': `You are an AI assistant helping a LinkedIn content creator generate topic ideas based on their profile and services.

Profile information:
{{bio}}

LinkedIn services:
{{linkedInServices}}

Generate a list of 10 specific topics that would be good for the user to post about on LinkedIn based on their profile and services. Focus on topics that would showcase their expertise and attract potential clients.

Return the topics as a JSON array with objects that have a 'title' property. For example:
[
  { "title": "Topic 1" },
  { "title": "Topic 2" },
  ...
]

Make topics specific and actionable. Each topic should be 5-10 words.`,
    
    'content-generator': `You are an AI assistant helping a LinkedIn content creator generate content ideas.

Profile information:
{{bio}}

LinkedIn services:
{{linkedInServices}}

Selected topics:
{{selectedTopics}}

Content type: {{contentType}}

Generate 5 specific content ideas for the selected content type that would be good for the user to post about on LinkedIn based on their profile, services, and selected topics.

Return the ideas as a JSON object with the following structure:
{
  "ideas": [
    {
      "category": "Category name",
      "title": "Content idea title",
      "description": "Brief description of the content idea"
    },
    ...
  ]
}

Make ideas specific, actionable, and tailored to the user's expertise.`,
    
    'hook-generator': `You are an AI assistant helping a LinkedIn content creator generate hook ideas for their posts.

Profile information:
Name: {{fullName}}
Job Title: {{jobTitle}}
Company: {{company}}
Bio: {{bio}}

LinkedIn services:
{{linkedInServices}}

Selected topics:
{{selectedTopics}}

Content type: {{contentType}}
Content details: {{contentDetails}}

Style preference: {{stylePreference}}

Generate 5 attention-grabbing hooks for LinkedIn posts based on the user's profile, content details, and style preference. The hooks should be designed to stop the scroll and engage the reader immediately.

Return the hooks as a JSON object with the following structure:
{
  "hooks": [
    {
      "source": "AI-generated",
      "text": "Hook text here"
    },
    ...
  ]
}

Each hook should be 1-2 sentences maximum and match the selected style preference.`,
    
    'post-generator': `You are an AI assistant helping a LinkedIn content creator generate complete post ideas.

Profile information:
Name: {{fullName}}
Job Title: {{jobTitle}}
Company: {{company}}

Selected topics: {{topics}}
Style preference: {{stylePreference}}
Selected hook: {{preferredHook}}

Generate 3 complete LinkedIn post ideas that start with the selected hook. Each post should be well-structured, engaging, and professional.

Return the posts as a JSON array with the following structure:
[
  {
    "title": "Brief title describing the post",
    "content": "Complete post content including the hook"
  },
  ...
]

Each post should be 150-300 words and maintain the selected style preference throughout.`
  };
  
  return fallbackPrompts[promptName] || `Prompt '${promptName}' not found`;
}

/**
 * Process a prompt template by replacing placeholders with actual values
 * @param promptTemplate Prompt template with placeholders in {{placeholder}} format
 * @param variables Object containing values for the placeholders
 */
export function processPromptTemplate(promptTemplate: string, variables: Record<string, any>): string {
  return promptTemplate.replace(/\{\{([^}]+)\}\}/g, (match, placeholder) => {
    const value = variables[placeholder];
    return value !== undefined ? String(value) : match;
  });
}
