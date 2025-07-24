import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { Langfuse } from 'langfuse';

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_HOST || 'https://us.cloud.langfuse.com'
});

async function getFetchedLinkedInPrompt() {
  try {
    const prompt = await langfuse.getPrompt('linkedin_post_writer');
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Compile the prompt with the date variable
    return {
      compile: () => prompt.compile({ date: today }),
      toJSON: () => prompt.compile({ date: today })
    };
  } catch (error) {
    console.error('Failed to fetch LinkedIn prompt:', error);
    // Provide a fallback prompt if fetch fails
    return { 
      compile: () => 'Write a professional LinkedIn post about the given topic. Format it for social media with engaging language, clear structure, and include relevant hashtags. Keep it concise and professional but engaging. Use emojis sparingly. End with a call-to-action or question to encourage engagement.',
      toJSON: () => 'Write a professional LinkedIn post about the given topic. Format it for social media with engaging language, clear structure, and include relevant hashtags. Keep it concise and professional but engaging. Use emojis sparingly. End with a call-to-action or question to encourage engagement.'
    };
  }
}

async function getFetchedUpdatePrompt(currentContent: string) {
  try {
    const prompt = await langfuse.getPrompt('update_linkedin_post');
    
    // Compile the prompt with the current content variable
    const compiledPrompt = prompt.compile({ current_content: currentContent });
    return {
      compile: () => compiledPrompt,
      toJSON: () => compiledPrompt || `Update the following LinkedIn post based on the user's request. Current content: ${currentContent}. Make the requested changes while maintaining the professional tone and social media format.`
    };
  } catch (error) {
    console.error('Failed to fetch update prompt:', error);
    // Provide a fallback prompt if fetch fails
    return { 
      compile: () => `Update the following LinkedIn post based on the user's request. Current content: ${currentContent}. Make the requested changes while maintaining the professional tone and social media format.`,
      toJSON: () => `Update the following LinkedIn post based on the user's request. Current content: ${currentContent}. Make the requested changes while maintaining the professional tone and social media format.`
    };
  }
}

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    // Get the LinkedIn post prompt from Langfuse
    const prompt = await getFetchedLinkedInPrompt();
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
        const { text } = delta;

        draftContent += text;

        dataStream.write({
          type: 'data-textDelta',
          data: text,
          transient: true,
        });
      }
    }

    // Return JSON format with text and empty images array
    return JSON.stringify({
      text: draftContent,
      images: []
    });
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

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

    // Get the update prompt from Langfuse with current content as variable
    const prompt = await getFetchedUpdatePrompt(currentTextContent);
    const systemPrompt = prompt.toJSON() || `Update the following LinkedIn post based on the user's request. Current content: ${currentTextContent}. Make the requested changes while maintaining the professional tone and social media format.`;

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: systemPrompt,
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      providerOptions: {
        openai: {
          prediction: {
            type: 'content',
            content: currentTextContent,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text') {
        const { text } = delta;

        draftContent += text;

        dataStream.write({
          type: 'data-textDelta',
          data: text,
          transient: true,
        });
      }
    }

    // Return JSON format with updated text and preserved images
    return JSON.stringify({
      text: draftContent,
      images: currentImages
    });
  },
});
