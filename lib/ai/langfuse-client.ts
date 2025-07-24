'use server';

import { Langfuse } from 'langfuse';
import { cache } from 'react';

/**
 * Langfuse client singleton instance
 */
let langfuseInstance: Langfuse | null = null;

/**
 * Get the Langfuse client instance
 * Creates a new instance if one doesn't exist
 * Returns null if credentials are not configured (graceful degradation)
 */
export async function getLangfuseClient(): Promise<Langfuse | null> {
  if (!langfuseInstance) {
    // Check for required environment variables
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const baseUrl = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';

    if (!secretKey || !publicKey) {
      console.warn('Langfuse credentials not configured. Observability features will be disabled. Set LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY environment variables to enable Langfuse.');
      return null;
    }

    try {
      langfuseInstance = new Langfuse({
        secretKey,
        publicKey,
        baseUrl
      });
      
      console.log('Langfuse client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Langfuse client:', error);
      return null;
    }
  }

  return langfuseInstance;
}

/**
 * Create a trace with error handling
 * @param name Trace name
 * @param userId User ID
 * @param metadata Optional metadata
 */
export async function createTrace(name: string, userId: string, metadata?: Record<string, any>) {
  try {
    return (await getLangfuseClient())?.trace({
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
export async function logError(name: string, userId: string, error: Error | string) {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const client = await getLangfuseClient();
    const trace = client?.trace({
      name,
      userId,
      metadata: { error: errorMessage }
    });
    
    trace?.event({
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
    const cachedPrompt = promptCache.get(promptName);
    if (cachedPrompt) return cachedPrompt;
  }
  
  try {
    // Get prompt from Langfuse
    const client = await getLangfuseClient();
    if (!client) {
      console.warn(`Langfuse client not available, using fallback for prompt '${promptName}'`);
      return getFallbackPrompt(promptName);
    }
    
    const prompt = await client.getPrompt(promptName);
    
    if (!prompt || !prompt.prompt) {
      console.warn(`Prompt '${promptName}' not found in Langfuse, using fallback`);
      return getFallbackPrompt(promptName);
    }
    
    // Cache the prompt
    promptCache.set(promptName, prompt.prompt);
    return prompt.prompt;
  } catch (error) {
    // Check if it's a 401 unauthorized error
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = String(error.message);
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Invalid credentials')) {
        console.warn(`Langfuse authentication failed for prompt '${promptName}'. Check your credentials. Using fallback prompt.`);
        return getFallbackPrompt(promptName);
      }
    }
    
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
    'topic-generator': `You are an AI assistant helping a LinkedIn content creator generate topic ideas based on their profile.

Profile information:
{{bio}}

Generate a list of 10 specific topics that would be good for the user to post about on LinkedIn based on their profile. Focus on topics that would showcase their expertise and attract potential clients.

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

Post information:
{{selectedTopics}}

Generate 5 specific content ideas for the selected content type that would be good for the user to post about on LinkedIn based on their profile and selected topics.

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

Selected topics:
{{selectedTopics}}

Post information: {{selectedTopics}}

Writing style: Professional and engaging

Generate 4 attention-grabbing hooks for LinkedIn posts, one for each of these specific formats. Each hook should be short (1-2 sentences max) and designed to stop the scroll:

1. **Monetisable Expertise**: Focus on valuable insights, lessons learned, or expertise that demonstrates clear business value
2. **Strategic Arbitrage**: Highlight contrarian thinking, unique perspectives, or opportunities others might miss  
3. **Educational**: Share actionable tips, how-to insights, or knowledge that teaches something specific
4. **Highly Engaging**: Use storytelling, personal experiences, or provocative questions that spark conversation

Return the hooks as a JSON object with the following structure:
{
  "hooks": [
    {
      "type": "Monetisable Expertise",
      "text": "Hook text here"
    },
    {
      "type": "Strategic Arbitrage", 
      "text": "Hook text here"
    },
    {
      "type": "Educational",
      "text": "Hook text here"
    },
    {
      "type": "Highly Engaging",
      "text": "Hook text here"
    }
  ]
}

Each hook should be 1-2 sentences maximum and match the selected style preference.`,
    
    'post-generator': `You are an AI assistant helping a LinkedIn content creator generate complete post ideas.

Profile information:
Name: {{fullName}}
Job Title: {{jobTitle}}
Company: {{company}}

Selected topics: {{topics}}
Writing style: Professional and engaging
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
export async function processPromptTemplate(promptTemplate: string, variables: Record<string, any>): Promise<string> {
  return promptTemplate.replace(/\{\{([^}]+)\}\}/g, (match, placeholder) => {
    const value = variables[placeholder];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Track user feedback (thumbs up/down) in Langfuse
 * @param traceId The ID of the trace to associate the feedback with
 * @param userId User ID
 * @param score Score (1 for thumbs up, 0 for thumbs down)
 * @param comment Optional comment or additional context
 * @param metadata Optional metadata
 */
export async function trackFeedback(
  traceId: string,
  userId: string,
  score: 1 | 0,
  comment?: string,
  metadata?: Record<string, any>
) {
  try {
    const client = await getLangfuseClient();
    if (!client) {
      console.warn('Langfuse client not available, feedback tracking disabled');
      return false;
    }
    
    // Create a unique ID for the score to enable updating it later if needed
    const scoreId = `feedback_${traceId}_${userId}`;
    
    // Use the correct score method based on documentation
    await client.score({
      id: scoreId, // Use as idempotency key
      traceId: traceId,
      name: score === 1 ? 'thumbs_up' : 'thumbs_down',
      value: score,
      comment: comment || `User ${userId} gave ${score === 1 ? 'positive' : 'negative'} feedback`,
      metadata: {
        ...metadata,
        userId,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(`Feedback tracked for trace ${traceId}: ${score === 1 ? 'thumbs up' : 'thumbs down'}`);
    return true;
  } catch (error) {
    console.error('Error tracking feedback in Langfuse:', error);
    return false;
  }
}