'use server';

import OpenAI from 'openai';
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
      linkedInServices,
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

    // Create a prompt based on available user data and style preference
    let prompt = `Generate 3 engaging hooks for a LinkedIn post. Each hook should be attention-grabbing, professional, and designed to make readers want to continue reading the full post.`;
    
    // Add user context to the prompt
    prompt += '\n\nBased on the following information:\n\n';
    
    if (fullName) {
      prompt += `User Name: ${fullName}\n\n`;
    }
    
    if (jobTitle) {
      prompt += `Job Title: ${jobTitle}\n\n`;
    }
    
    if (company) {
      prompt += `Company: ${company}\n\n`;
    }
    
    if (bio) {
      prompt += `User Bio: ${bio}\n\n`;
    }
    
    if (linkedInServices) {
      prompt += `LinkedIn Services/Products: ${linkedInServices}\n\n`;
    }
    
    if (topics.length > 0) {
      prompt += `Selected Topics: ${topics.map(t => t.title).join(', ')}\n\n`;
    }
    
    if (contentType) {
      prompt += `Content Type: ${contentType}\n\n`;
    }
    
    if (contentDetails) {
      prompt += `Content Details: ${contentDetails}\n\n`;
    }
    
    // Add style-specific instructions based on the selected style preference
    if (stylePreference) {
      switch(stylePreference) {
        case 'kleo-generated':
          prompt += 'Style: Generate hooks in a professional, balanced style that matches the user\'s profile and topic selections.\n\n';
          break;
        case 'jake':
          prompt += 'Style: Generate hooks in the style of Jake, a tech influencer. The hooks should be bold, slightly provocative, and use tech industry language. They should feel modern, forward-thinking, and have a confident tone that tech professionals would relate to.\n\n';
          break;
        case 'lara':
          prompt += 'Style: Generate hooks in the style of Lara Acosta, a marketing expert. The hooks should be creative, emotionally engaging, and use storytelling techniques. They should have a polished, persuasive quality with marketing-oriented language and a focus on value proposition.\n\n';
          break;
        default:
          prompt += 'Style: Generate hooks in a professional, balanced style that matches the user\'s profile and topic selections.\n\n';
      }
    }
    
    prompt += 'Each hook should be 1-2 sentences long, attention-grabbing, and designed to make the reader want to continue reading the full post. Make each hook distinct in approach and tone.\n\n';
    
    prompt += 'Return your response in this JSON format: {"hooks": [{"content": "Hook text here"}]}';

    console.log('Generating hook ideas with prompt:', prompt);

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
      throw new Error('No content returned from AI');
    }

    console.log('AI response received:', content.substring(0, 100) + '...');

    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(content);
      
      if (!parsedResponse.hooks || !Array.isArray(parsedResponse.hooks)) {
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
          content: hook.content
        };
      });
      
      return hookIdeas;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error generating hook ideas:', error);
    
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
