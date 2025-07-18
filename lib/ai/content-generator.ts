'use server';

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentIdea {
  category: string;
  title: string;
  description: string;
  tag: string;
}

/**
 * Generate content ideas based on user profile data and selected topics
 */
export async function generateContentIdeas(
  bio: string | null | undefined,
  linkedInServices: string | null | undefined,
  selectedTopics: string | null | undefined,
  contentType: string
): Promise<ContentIdea[]> {
  try {
    // Parse selected topics if available
    let topics: any[] = [];
    if (selectedTopics) {
      try {
        topics = JSON.parse(selectedTopics);
      } catch (e) {
        console.warn('Failed to parse selected topics');
      }
    }

    // Create a prompt based on available user data and content type
    let prompt = `Generate 3 professional LinkedIn content ideas for the "${contentType}" category. Return the response as a JSON object.`;
    
    if (bio || linkedInServices || topics.length > 0) {
      prompt += ' Based on the following information:\n\n';

      if (bio) {
        prompt += `User Bio: ${bio}\n\n`;
      }
      
      if (linkedInServices) {
        prompt += `LinkedIn Services/Products: ${linkedInServices}\n\n`;
      }
      
      if (topics.length > 0) {
        prompt += `Selected Topics: ${topics.map(t => t.title).join(', ')}\n\n`;
      }
    }
    
    // Add specific instructions based on content type
    switch(contentType.toLowerCase()) {
      case 'monetisable expertise':
      case 'monetizable expertise':
        prompt += 'Focus on showcasing the user\'s professional expertise in a way that demonstrates value and could lead to business opportunities. Include actionable insights that readers would be willing to pay for.';
        break;
      case 'strategic arbitrage':
        prompt += 'Focus on identifying gaps in the market or unique perspectives that position the user as a thought leader. Highlight contrarian viewpoints or innovative approaches.';
        break;
      case 'educational':
        prompt += 'Focus on teaching concepts, explaining processes, or sharing knowledge that helps the audience learn something valuable. Include step-by-step explanations or clear takeaways.';
        break;
      case 'engaging':
      case 'highly engaging':
        prompt += 'Focus on creating content that sparks conversation, asks thought-provoking questions, or shares relatable stories that will generate high engagement and comments.';
        break;
      default:
        prompt += 'Create diverse content ideas that showcase professional expertise while being engaging and valuable to the audience.';
    }
    
    prompt += '\n\nFor each idea, provide a catchy title, a compelling description (2-3 sentences), and a short tag that categorizes the content type (e.g., GUIDE, CASE STUDY, OPINION, etc.).\n\nReturn your response in this JSON format: {"ideas": [{"category": "' + contentType + '", "title": "Example Title", "description": "Example description text", "tag": "EXAMPLE TAG"}]}';

    console.log('Generating content ideas with prompt:', prompt);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert LinkedIn content strategist who helps professionals create engaging content ideas tailored to their expertise and goals. Always respond with valid JSON format containing an array of content ideas.'
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
    const parsedContent = JSON.parse(content);
    
    // Handle different possible response formats
    let contentIdeas: ContentIdea[] = [];
    
    if (parsedContent.ideas && Array.isArray(parsedContent.ideas)) {
      contentIdeas = parsedContent.ideas;
    } else if (Array.isArray(parsedContent)) {
      contentIdeas = parsedContent;
    } else if (typeof parsedContent === 'object') {
      // Try to extract content ideas from the object
      const possibleArrays = Object.values(parsedContent).filter(val => 
        Array.isArray(val) && val.length > 0 && 
        typeof val[0] === 'object' && 'title' in val[0]
      );
      
      if (possibleArrays.length > 0) {
        contentIdeas = possibleArrays[0] as ContentIdea[];
      }
    }
    
    // If we couldn't extract content ideas, return default ones
    if (contentIdeas.length === 0) {
      console.warn('Could not extract content ideas from AI response, using defaults');
      return getDefaultContentIdeas(contentType);
    }
    
    // Ensure all required fields are present
    return contentIdeas.map(idea => ({
      category: contentType,
      title: idea.title || `Content idea for ${contentType}`,
      description: idea.description || 'A compelling content idea tailored to your expertise and audience.',
      tag: idea.tag || 'CONTENT'
    }));
  } catch (error) {
    console.error('Error generating content ideas:', error);
    // Return default content ideas if there's an error
    return getDefaultContentIdeas(contentType);
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
