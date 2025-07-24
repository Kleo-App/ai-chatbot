'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createTrace, logError, getPrompt, processPromptTemplate } from './langfuse-client';

export interface TopicSuggestion {
  id: number;
  title: string;
  subtitle: string;
}

/**
 * Generate topic suggestions based on user profile data
 */
export async function generateTopicSuggestions(
  bio?: string
): Promise<TopicSuggestion[]> {
  try {
    // Get the prompt template from Langfuse
    const promptTemplate = await getPrompt('topic-generator');
    
    // Process the prompt template with variables
    const prompt = await processPromptTemplate(promptTemplate, {
      bio
    });
    
    // Create Langfuse trace for tracking
    const trace = await createTrace('generate_topic_suggestions', bio || 'anonymous', {
      bio
    });
    
    // Skip Langfuse tracking if trace creation failed
    if (!trace) {
      console.warn('Skipping Langfuse tracking due to trace creation failure');
    }

    // Create Langfuse generation span
    const generation = await trace?.generation({
      name: 'topic_suggestions_generation',
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
      system: 'You are an expert content strategist who helps professionals identify relevant topics for their industry and expertise.',
      prompt: prompt,
      temperature: 0.7,
    });

    // Extract and parse the response
    const content = text;

    if (!content) {
      console.error('No content returned from Anthropic');
      throw new Error('No content returned from AI model');
    }

    // Update Langfuse generation with output
    await generation?.update({
      output: content,
    });

    console.log('Raw response from Anthropic:', content);

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
      await logError('parse_topic_suggestions_response', bio || 'anonymous', parseError as Error);
      
      throw new Error('Failed to parse AI response as valid JSON');
    }

    // Handle different possible response formats
    let topicSuggestions: TopicSuggestion[] = [];
    
    if (parsedResponse.topics && Array.isArray(parsedResponse.topics)) {
      topicSuggestions = parsedResponse.topics;
    } else if (parsedResponse.suggestions && Array.isArray(parsedResponse.suggestions)) {
      topicSuggestions = parsedResponse.suggestions;
    } else if (Array.isArray(parsedResponse)) {
      topicSuggestions = parsedResponse;
    }

    // Validate and clean the response
    const result: TopicSuggestion[] = topicSuggestions.map((topic: any, index: number) => ({
      id: topic.id || index + 1,
      title: topic.title || `Topic ${index + 1}`,
      subtitle: topic.subtitle || topic.description || ''
    }));

    console.log('Generated topic suggestions:', result);

    return result;

  } catch (error) {
    console.error('Error in generateTopicSuggestions:', error);
    
    // Log the error in Langfuse
    await logError('generate_topic_suggestions', bio || 'anonymous', error as Error);
    
    throw error;
  }
}
