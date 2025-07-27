import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { getLangfuseClient } from '@/lib/ai/langfuse-client';
import { getOrCreateUserProfile } from '@/lib/db/profile-queries';

async function getFetchedLinkedInPrompt(bio: string = '') {
  try {
    const langfuse = await getLangfuseClient();
    if (!langfuse) {
      console.warn('Langfuse not available, using fallback LinkedIn prompt');
      return { 
        compile: () => `Write a professional LinkedIn post about the given topic. Format it for social media with engaging language, clear structure, and include relevant hashtags. Keep it concise and professional but engaging. Use emojis sparingly. End with a call-to-action or question to encourage engagement.${bio ? `\n\nUser Bio: ${bio}` : ''}`,
        toJSON: () => `Write a professional LinkedIn post about the given topic. Format it for social media with engaging language, clear structure, and include relevant hashtags. Keep it concise and professional but engaging. Use emojis sparingly. End with a call-to-action or question to encourage engagement.${bio ? `\n\nUser Bio: ${bio}` : ''}`
      };
    }
    
    try {
      const prompt = await langfuse.getPrompt('linkedin_post_writer');
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      // Compile the prompt with the date and bio variables
      return {
        compile: () => prompt.compile({ date: today, bio: bio }),
        toJSON: () => prompt.compile({ date: today, bio: bio })
      };
    } catch (langfuseError) {
      // Handle Langfuse-specific errors (like 401)
      console.warn('Langfuse LinkedIn prompt fetch failed, using fallback:', langfuseError);
      return { 
        compile: () => `Write a professional LinkedIn post about the given topic. Format it for social media with engaging language, clear structure, and include relevant hashtags. Keep it concise and professional but engaging. Use emojis sparingly. End with a call-to-action or question to encourage engagement.${bio ? `\n\nUser Bio: ${bio}` : ''}`,
        toJSON: () => `Write a professional LinkedIn post about the given topic. Format it for social media with engaging language, clear structure, and include relevant hashtags. Keep it concise and professional but engaging. Use emojis sparingly. End with a call-to-action or question to encourage engagement.${bio ? `\n\nUser Bio: ${bio}` : ''}`
      };
    }
  } catch (error) {
    console.error('Failed to fetch LinkedIn prompt:', error);
    // Provide a fallback prompt if fetch fails
    return { 
      compile: () => `Write a professional LinkedIn post about the given topic. Format it for social media with engaging language, clear structure, and include relevant hashtags. Keep it concise and professional but engaging. Use emojis sparingly. End with a call-to-action or question to encourage engagement.${bio ? `\n\nUser Bio: ${bio}` : ''}`,
      toJSON: () => `Write a professional LinkedIn post about the given topic. Format it for social media with engaging language, clear structure, and include relevant hashtags. Keep it concise and professional but engaging. Use emojis sparingly. End with a call-to-action or question to encourage engagement.${bio ? `\n\nUser Bio: ${bio}` : ''}`
    };
  }
}

async function getFetchedUpdatePrompt(currentContent: string, bio: string = '') {
  try {
    const langfuse = await getLangfuseClient();
    if (!langfuse) {
      console.warn('Langfuse not available, using fallback update prompt');
      return { 
        compile: () => `Update the following LinkedIn post based on the user's request. Current content: ${currentContent}. Make the requested changes while maintaining the professional tone and social media format.${bio ? `\n\nUser Bio: ${bio}` : ''}`,
        toJSON: () => `Update the following LinkedIn post based on the user's request. Current content: ${currentContent}. Make the requested changes while maintaining the professional tone and social media format.${bio ? `\n\nUser Bio: ${bio}` : ''}`
      };
    }
    
    try {
      const prompt = await langfuse.getPrompt('update_linkedin_post');
      
      // Compile the prompt with the current content and bio variables
      const compiledPrompt = prompt.compile({ current_content: currentContent, bio: bio });
      return {
        compile: () => compiledPrompt,
        toJSON: () => compiledPrompt || `Update the following LinkedIn post based on the user's request. Current content: ${currentContent}. Make the requested changes while maintaining the professional tone and social media format.${bio ? `\n\nUser Bio: ${bio}` : ''}`
      };
    } catch (langfuseError) {
      // Handle Langfuse-specific errors (like 401)
      console.warn('Langfuse prompt fetch failed, using fallback:', langfuseError);
      return { 
        compile: () => `Update the following LinkedIn post based on the user's request. Current content: ${currentContent}. Make the requested changes while maintaining the professional tone and social media format.${bio ? `\n\nUser Bio: ${bio}` : ''}`,
        toJSON: () => `Update the following LinkedIn post based on the user's request. Current content: ${currentContent}. Make the requested changes while maintaining the professional tone and social media format.${bio ? `\n\nUser Bio: ${bio}` : ''}`
      };
    }
  } catch (error) {
    console.error('Failed to fetch update prompt:', error);
    // Provide a fallback prompt if fetch fails
    return { 
      compile: () => `Update the following LinkedIn post based on the user's request. Current content: ${currentContent}. Make the requested changes while maintaining the professional tone and social media format.${bio ? `\n\nUser Bio: ${bio}` : ''}`,
      toJSON: () => `Update the following LinkedIn post based on the user's request. Current content: ${currentContent}. Make the requested changes while maintaining the professional tone and social media format.${bio ? `\n\nUser Bio: ${bio}` : ''}`
    };
  }
}

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream, session }) => {
    let draftContent = '';

    // Get user bio for prompt personalization
    let userBio = '';
    if (session?.user?.id) {
      try {
        const userProfile = await getOrCreateUserProfile(session.user.id);
        userBio = userProfile?.bio || '';
      } catch (error) {
        console.warn('Failed to fetch user profile for bio:', error);
      }
    }

    // Get the LinkedIn post prompt from Langfuse
    const prompt = await getFetchedLinkedInPrompt(userBio);
    const systemPrompt = prompt?.toJSON() || '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: systemPrompt,
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: title,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text') {
        // Handle potential undefined text property for Anthropic models
        const textContent = 'text' in delta ? delta.text : '';
        
        if (textContent) {
          draftContent += textContent;

          dataStream.write({
            type: 'data-textDelta',
            data: textContent,
            transient: true,
          });
        }
      }
    }

    // Return JSON format with text and empty images array
    return JSON.stringify({
      text: draftContent,
      images: []
    });
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    let draftContent = '';

    // Get user bio for prompt personalization
    let userBio = '';
    if (session?.user?.id) {
      try {
        const userProfile = await getOrCreateUserProfile(session.user.id);
        userBio = userProfile?.bio || '';
      } catch (error) {
        console.warn('Failed to fetch user profile for bio:', error);
      }
    }

    // Parse current content to extract text and images
    const currentContent = document.content || '';
    let currentTextContent = '';
    let currentImages: string[] = [];
    
    try {
      const parsed = JSON.parse(currentContent);
      if (parsed && typeof parsed === 'object' && 'text' in parsed) {
        currentTextContent = parsed.text;
        currentImages = parsed.images || [];
      } else {
        currentTextContent = currentContent;
      }
    } catch {
      // Content is not JSON, treat as plain text
      currentTextContent = currentContent;
    }

    // Get the update prompt from Langfuse with current content and bio variables
    const prompt = await getFetchedUpdatePrompt(currentTextContent, userBio);
    const systemPrompt = prompt.toJSON() || `Update the following LinkedIn post based on the user's request. Current content: ${currentTextContent}. Make the requested changes while keeping everything else the same.`;

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: systemPrompt,
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      providerOptions: {
        anthropic: {
          cacheControl: { type: 'ephemeral' },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text') {
        // Handle potential undefined text property for Anthropic models
        const textContent = 'text' in delta ? delta.text : '';
        
        if (textContent) {
          draftContent += textContent;

          dataStream.write({
            type: 'data-textDelta',
            data: textContent,
            transient: true,
          });
        }
      }
    }

    // Return JSON format with updated text and preserved images
    return JSON.stringify({
      text: draftContent,
      images: currentImages
    });
  },
});
