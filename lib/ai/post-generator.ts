'use server';

import OpenAI from 'openai';
import { getLangfuseClient, createTrace, logError, getPrompt, processPromptTemplate } from './langfuse-client';
import { getOrCreateUserProfile } from '@/lib/db/profile-queries';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      topics: userProfile.selectedTopics,
      stylePreference: userProfile.stylePreference,
      preferredHook: userProfile.preferredHook
    });
    
    // Parse selected topics if available
    let topics: string[] = [];
    if (userProfile.selectedTopics) {
      try {
        topics = JSON.parse(userProfile.selectedTopics);
      } catch (error) {
        console.error('Error parsing selected topics:', error);
      }
    }
    
    // Get the user's preferred hook
    const preferredHook = userProfile.preferredHook || '';
    
    // Get the user's style preference
    const stylePreference = userProfile.stylePreference || 'kleo';
    
    // Prepare the prompt for OpenAI
    const prompt = `
      You are a professional LinkedIn content creator specializing in creating engaging, high-quality posts.
      
      Create THREE distinct LinkedIn posts for ${userProfile.fullName || 'a professional'} who works as ${userProfile.jobTitle || 'a professional'} at ${userProfile.company || 'their company'}.
      
      The posts should be about these topics: ${topics.length > 0 ? topics.join(', ') : 'professional growth, industry insights, and career development'}.
      
      Each post should use this hook as the opening line: "${preferredHook}"
      
      Style preference: ${stylePreference === 'jake' ? 'Write in Jake\'s style: conversational, direct, and practical with short paragraphs and bullet points for easy reading. Use a friendly but professional tone.' : 
      stylePreference === 'lara' ? 'Write in Lara\'s style: empathetic, story-driven, and reflective. Use personal anecdotes and emotional language to connect with readers.' : 
      'Write in a professional, engaging style with a mix of storytelling and practical advice.'}
      
      For each post:
      1. Start with the provided hook
      2. Follow with a compelling opening that expands on the hook
      3. Include a main body with valuable insights, personal experiences, or actionable advice
      4. End with a strong conclusion and call to action or thought-provoking question
      5. Use appropriate formatting for LinkedIn (short paragraphs, bullet points, emojis where appropriate)
      6. Each post should be between 200-300 words
      
      Format your response as a JSON array with three objects, each containing:
      - id: a number (1, 2, or 3)
      - title: a catchy title for the post
      - hook: the opening hook (use the provided hook)
      - body: the main content of the post
      - conclusion: the closing paragraph with call to action
      - wordCount: approximate word count
    `;
    
    console.log('Sending prompt to OpenAI');
    
    // Create Langfuse trace for tracking
    const trace = await createTrace('generate_post_ideas', userId, {
      fullName: userProfile.fullName,
      jobTitle: userProfile.jobTitle,
      company: userProfile.company,
      topics,
      stylePreference,
      preferredHook
    });
    
    // Skip Langfuse tracking if trace creation failed
    if (!trace) {
      console.warn('Skipping Langfuse tracking due to trace creation failure');
    }
    
    // Create Langfuse generation span
    const generation = trace?.generation({
      name: 'post_ideas_generation',
      model: 'gpt-4-turbo',
      modelParameters: {
        temperature: 0.7,
        max_tokens: 2000
      },
      input: prompt,
    });
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional LinkedIn content creator who specializes in creating engaging, high-quality posts.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    // Extract and parse the response
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      console.error('No content returned from OpenAI');
      generation?.end({ output: null });
      if (trace) {
        trace.event({
          name: 'no_content_returned',
          level: 'ERROR'
        });
      }
      throw new Error('Failed to generate post ideas');
    }
    
    // Record successful completion in Langfuse
    generation?.end({ output: content });
    
    console.log('Raw response from OpenAI:', content);
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;
    
    try {
      const postIdeas: PostIdea[] = JSON.parse(jsonString);
      console.log('Successfully parsed post ideas:', postIdeas);
      
      if (trace) {
        trace.event({
          name: 'post_ideas_generated',
          level: 'DEFAULT',
          metadata: { count: postIdeas.length }
        });
      }
      
      return postIdeas;
    } catch (parseError) {
      console.error('Error parsing OpenAI response as JSON:', parseError);
      
      if (trace) {
        trace.event({
          name: 'json_parse_error',
          level: 'ERROR',
          metadata: { error: parseError instanceof Error ? parseError.message : String(parseError) }
        });
      }
      
      // Fallback to default post ideas
      return getDefaultPostIdeas(preferredHook);
    }
  } catch (error) {
    console.error('Error generating post ideas:', error);
    
    // Log error to Langfuse
    logError('generate_post_ideas_error', userId, error instanceof Error ? error.message : String(error));
    
    // Return default post ideas on error
    return getDefaultPostIdeas();
  }
}

/**
 * Get default post ideas if AI generation fails
 */
function getDefaultPostIdeas(preferredHook: string = ''): PostIdea[] {
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
