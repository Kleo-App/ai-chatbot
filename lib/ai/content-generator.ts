'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createTrace, logError, getPrompt, processPromptTemplate } from './langfuse-client';

export interface ContentIdea {
  category: string;
  title: string;
  description: string;
  tag: string;
}

/**
 * Generate content ideas based on user profile data and post information
 */
export async function generateContentIdeas(
  bio: string | null | undefined,
  postDetails: string | null | undefined,
  contentType: string
): Promise<ContentIdea[]> {
  try {
    // Use post details for content generation
    const postInformation = postDetails || '';

    // Get the prompt template from Langfuse
    const promptTemplate = await getPrompt('content-generator');
    
    // Additional instructions based on content type
    let additionalInstructions = 'Focus on creating diverse content ideas that showcase professional expertise while being engaging and valuable to the audience.';
    additionalInstructions += `\n\nFor each idea, provide a catchy title, a compelling description (2-3 sentences), and a short tag that categorizes the content type (e.g., GUIDE, CASE STUDY, OPINION, etc.).\n\nReturn your response in this JSON format: {"ideas": [{"category": "${contentType}", "title": "Example Title", "description": "Example description text", "tag": "EXAMPLE TAG"}]}`;
    
    // Process the prompt template with variables
    const prompt = await processPromptTemplate(promptTemplate, {
      bio: bio || '',
      selectedTopics: postInformation, // Using postDetails as topic information
      contentType: contentType,
      additionalInstructions: additionalInstructions
    });

    console.log('Generating content ideas with prompt:', prompt);

    // Create Langfuse trace for tracking
    const trace = await createTrace('generate_content_ideas', contentType, {
      bio,
      postDetails,
      contentType,
      additionalInstructions
    });

    // Skip Langfuse tracking if trace creation failed
    if (!trace) {
      console.warn('Skipping Langfuse tracking due to trace creation failure');
    }

    // Create Langfuse generation span
    const generation = await trace?.generation({
      name: 'content_ideas_generation',
      model: 'claude-4-sonnet-20250514',
      modelParameters: {
        temperature: 0.7,
        max_tokens: 1500
      },
      input: prompt,
    });

    console.log('Sending prompt to Anthropic');

    // Call Anthropic API using AI SDK
    const { text } = await generateText({
      model: anthropic('claude-4-sonnet-20250514'),
      system: 'You are a professional content strategist who specializes in creating engaging content ideas for business professionals.',
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
      await logError('parse_content_ideas_response', contentType, parseError as Error);
      
      throw new Error('Failed to parse AI response as valid JSON');
    }

    if (!parsedResponse.ideas || !Array.isArray(parsedResponse.ideas)) {
      console.error('Invalid response structure:', parsedResponse);
      throw new Error('Invalid response structure from AI model');
    }

    // Validate and clean the response
    const contentIdeas: ContentIdea[] = parsedResponse.ideas.map((idea: any, index: number) => ({
      category: idea.category || contentType,
      title: idea.title || `Content Idea ${index + 1}`,
      description: idea.description || '',
      tag: idea.tag || 'CONTENT'
    }));

    console.log('Generated content ideas:', contentIdeas);

    return contentIdeas;

  } catch (error) {
    console.error('Error in generateContentIdeas:', error);
    
    // Log the error in Langfuse
    await logError('generate_content_ideas', contentType, error as Error);
    
    throw error;
  }
}

/**
 * Get default content ideas for a specific content type
 */
function getDefaultContentIdeas(contentType: string): ContentIdea[] {
  switch(contentType.toLowerCase()) {
    case 'monetisable expertise':
    case 'monetizable expertise':
      return [
        {
          category: contentType,
          title: "5 Ways to Monetize Your Industry Expertise Without Trading Time for Money",
          description: "Practical strategies to package your knowledge into scalable products and services. Learn how to create passive income streams from your professional expertise.",
          tag: "MONETIZATION GUIDE"
        },
        {
          category: contentType,
          title: "The Value Ladder: How I Turned My Knowledge Into a 6-Figure Consulting Business",
          description: "Step-by-step breakdown of building service offerings at different price points. Includes client acquisition strategies and scaling tips for knowledge entrepreneurs.",
          tag: "CASE STUDY"
        },
        {
          category: contentType,
          title: "Expertise Positioning: 3 Frameworks to Command Premium Rates in Your Industry",
          description: "Tactical approaches to position yourself as the go-to authority in your niche. Includes communication templates and client qualification processes to attract high-value opportunities.",
          tag: "STRATEGY"
        }
      ];
    
    case 'strategic arbitrage':
      return [
        {
          category: contentType,
          title: "The Contrarian Advantage: Why Going Against Industry Consensus Built My Business",
          description: "How identifying gaps between perception and reality created unique market opportunities. Analysis of three market inefficiencies I leveraged to gain competitive advantage.",
          tag: "PERSPECTIVE"
        },
        {
          category: contentType,
          title: "Cross-Industry Innovation: Applying Fintech Solutions to Transform Healthcare Operations",
          description: "Case study on borrowing strategies from adjacent industries to solve persistent problems. Includes framework for identifying transferable innovations and implementation roadmap.",
          tag: "INNOVATION"
        },
        {
          category: contentType,
          title: "The Skill Stack Method: Combining Average Abilities to Create Extraordinary Value",
          description: "How unique combinations of common skills create rare and valuable expertise. Practical exercise to map your unique skill intersections and identify untapped market opportunities.",
          tag: "CAREER STRATEGY"
        }
      ];
      
    case 'educational':
      return [
        {
          category: contentType,
          title: "The Ultimate Guide to Data-Driven Decision Making: Beyond the Buzzwords",
          description: "Comprehensive breakdown of implementing data analysis in everyday business decisions. Includes practical frameworks, common pitfalls, and starter templates anyone can use.",
          tag: "GUIDE"
        },
        {
          category: contentType,
          title: "5 Counterintuitive Leadership Principles I Learned Building Remote Teams",
          description: "Evidence-based approaches that challenge conventional management wisdom. Each principle includes real-world examples and implementation strategies for immediate application.",
          tag: "LEADERSHIP"
        },
        {
          category: contentType,
          title: "Demystifying AI Implementation: A Non-Technical Leader's Roadmap",
          description: "Plain-language explanation of AI integration for business transformation. Covers evaluation criteria, implementation phases, and ROI measurement without requiring technical expertise.",
          tag: "EXPLAINER"
        }
      ];
      
    case 'engaging':
    case 'highly engaging':
      return [
        {
          category: contentType,
          title: "The Career Advice I'd Give My 25-Year-Old Self (That Would Have Saved Me Years of Struggle)",
          description: "Honest reflections on professional missteps and the wisdom gained from them. Includes vulnerable stories and counterintuitive insights that challenge conventional career wisdom.",
          tag: "REFLECTION"
        },
        {
          category: contentType,
          title: "Unpopular Opinion: Most Networking Events Are a Complete Waste of Time. Here's What to Do Instead.",
          description: "Provocative take on why traditional networking fails and alternative approaches that actually work. Based on personal experiences and results that generated 10x better connections.",
          tag: "HOT TAKE"
        },
        {
          category: contentType,
          title: "The Question That Transformed My Business: What Would You Do If You Weren't Afraid?",
          description: "Personal story of overcoming professional fear and the framework it inspired. Includes interactive prompt for readers to identify and challenge their own limiting beliefs.",
          tag: "INSPIRATION"
        }
      ];
      
    default:
      return [
        {
          category: "Custom",
          title: "The Ultimate Guide to Personal Branding: Building Your Digital Presence in 2025",
          description: "Step-by-step strategies for creating authentic personal brand, from social media optimization to content planning with actionable frameworks.",
          tag: "GUIDE"
        },
        {
          category: "Custom",
          title: "From Side Hustle to Success: How I Built a 6-Figure Business While Working Full-Time",
          description: "Personal journey of balancing entrepreneurship with career, including time management tips, mindset shifts, and practical growth strategies.",
          tag: "SUCCESS STORY"
        },
        {
          category: "Custom",
          title: "AI Tools That Actually Save Time: My Top 10 Productivity Game-Changers for Creators",
          description: "Honest review of AI tools that streamline content creation, automate workflows, and boost productivity without breaking the bank.",
          tag: "TECH REVIEW"
        }
      ];
  }
}
