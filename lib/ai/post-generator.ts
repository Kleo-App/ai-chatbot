'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createTrace, logError, } from './langfuse-client';
import { getOrCreateUserProfile } from '@/lib/db/profile-queries';

export interface PostIdea {
  id: number;
  title: string;
  hook: string;
  body: string;
  conclusion: string;
  wordCount: number;
}

/**
 * Generate LinkedIn post ideas based on user profile data and style preference
 */
export async function generatePostIdeas(userId: string): Promise<PostIdea[]> {
  try {
    console.log('Generating LinkedIn post ideas for user:', userId);
    
    // Get user profile data
    const userProfile = await getOrCreateUserProfile(userId);
    
    if (!userProfile) {
      console.error('User profile not found');
      throw new Error('User profile not found');
    }
    
    console.log('User profile retrieved:', {
      fullName: userProfile.fullName,
      jobTitle: userProfile.jobTitle,
      company: userProfile.company,
      postDetails: userProfile.postDetails,
      preferredHook: userProfile.preferredHook
    });
    
    // Use post details for content generation
    const postInformation = userProfile.postDetails || '';
    
    // Get the user's preferred hook
    const preferredHook = userProfile.preferredHook || '';
    
    // Style preference removed - using default professional style
    
    // Prepare the prompt for Anthropic
    let prompt = `Generate 6 professional LinkedIn post ideas based on the following information:

Professional Context:
- Name: ${userProfile.fullName || 'Professional'}
- Job Title: ${userProfile.jobTitle || 'Professional'}
- Company: ${userProfile.company || 'Company'}
- Post Topics/Information: ${postInformation}`;

    if (preferredHook) {
      prompt += `\n- Preferred Hook Style: ${preferredHook}`;
    }

    prompt += `

Instructions:
1. Create diverse, engaging post ideas that showcase professional expertise
2. Each post should be unique and valuable to the professional community
3. Include different types of content: insights, experiences, advice, industry observations
4. Make sure each post has a compelling hook that grabs attention
5. Keep posts authentic and professional

For each post idea, provide:
- title: A compelling title/headline
- hook: An engaging opening line that captures attention (2-3 sentences max)
- body: Main content with valuable insights or story (4-6 sentences)
- conclusion: Strong closing with call-to-action or thought-provoking question (1-2 sentences)
- wordCount: Estimated word count

Return your response in this exact JSON format:
{"ideas": [{"id": 1, "title": "Example Title", "hook": "Hook text", "body": "Body text", "conclusion": "Conclusion text", "wordCount": 150}]}`;

    // Create Langfuse trace for tracking
    const trace = await createTrace('generate_post_ideas', userId, {
      userProfile,
      postInformation,
      preferredHook
    });

    // Skip Langfuse tracking if trace creation failed
    if (!trace) {
      console.warn('Skipping Langfuse tracking due to trace creation failure');
    }

    // Create Langfuse generation span
    const generation = await trace?.generation({
      name: 'post_ideas_generation',
      model: 'claude-4-sonnet-20250514',
      modelParameters: {
        temperature: 0.7,
        max_tokens: 2000
      },
      input: prompt,
    });
    
    console.log('Sending prompt to Anthropic');
    console.log('Full prompt:', prompt);

    try {
      // Call Anthropic API using AI SDK
      const { text } = await generateText({
        model: anthropic('claude-4-sonnet-20250514'),
        system: 'You are a professional LinkedIn content creator who specializes in creating engaging, high-quality posts.',
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
         await logError('parse_post_ideas_response', userId, parseError as Error);
        
        throw new Error('Failed to parse AI response as valid JSON');
      }

      if (!parsedResponse.ideas || !Array.isArray(parsedResponse.ideas)) {
        console.error('Invalid response structure:', parsedResponse);
        throw new Error('Invalid response structure from AI model');
      }

      // Validate and clean the response
      const postIdeas: PostIdea[] = parsedResponse.ideas.map((idea: any, index: number) => ({
        id: idea.id || index + 1,
        title: idea.title || `Post Idea ${index + 1}`,
        hook: idea.hook || '',
        body: idea.body || '',
        conclusion: idea.conclusion || '',
        wordCount: idea.wordCount || 100
      }));

      console.log('Generated post ideas:', postIdeas);

      return postIdeas;

    } catch (apiError) {
      console.error('Error calling Anthropic API:', apiError);
      
             // Log the error in Langfuse
       await logError('anthropic_api_error', userId, apiError as Error);
      
      throw new Error('Failed to generate post ideas from AI model');
    }

  } catch (error) {
    console.error('Error in generatePostIdeas:', error);
    
         // Log the error in Langfuse
     await logError('generate_post_ideas', userId, error as Error);
    
    throw error;
  }
}

/**
 * Get default post ideas if AI generation fails
 */
function getDefaultPostIdeas(preferredHook = ''): PostIdea[] {
  const hook = preferredHook || 'I used to think automation meant replacing humans.';
  
  return [
    {
      id: 1,
      title: 'From Burnout to Brilliance: My Journey with AI',
      hook: hook,
      body: 'Six months ago, my team was drowning:\n\n• Endless data queries\n• Manual reporting nightmares\n• Constant firefighting\n\nWe were working longer hours but falling further behind. Something had to change.\n\nWe started small—automating just one report that took 3 hours weekly. The results shocked us. Not only did we save time, but the accuracy improved by 40%.',
      conclusion: 'The lesson? Automation isn\'t about replacing humans—it\'s about elevating us to do more meaningful work. What manual task is stealing your team\'s creative energy today?',
      wordCount: 272
    },
    {
      id: 2,
      title: 'The Hidden Cost of Manual Work',
      hook: hook,
      body: 'My team was drowning in:\n\n• Endless support tickets\n• Repetitive data entry\n• Constant context switching\n\nBurnout wasn\'t just approaching—it had moved in and unpacked its bags.\n\nThe turning point came when our best analyst handed in her resignation letter. Her reason? "I didn\'t get my master\'s degree to copy-paste data all day."',
      conclusion: 'We implemented three key automations that week. Six months later, not only did we retain our talent, but team satisfaction scores rose 67%. What\'s the real cost of keeping those manual processes in your workflow?',
      wordCount: 253
    },
    {
      id: 3,
      title: 'The Breaking Point That Changed Everything',
      hook: hook,
      body: 'My team was drowning in manual tasks.\nBurning midnight oil.\nChasing endless tickets.\nLiving in constant firefighting mode.\n\nSound familiar?\n\nThe breaking point came during a leadership meeting when I realized we spent 70% of our time on tasks that added zero strategic value.\n\nThat day, we made a commitment: automate the repetitive, elevate the human.',
      conclusion: 'Three months later, we\'ve reduced manual work by 62% and increased strategic output by 40%. Our team now focuses on innovation instead of administration. What would your team achieve with 10 extra hours each week?',
      wordCount: 268
    }
  ];
}
