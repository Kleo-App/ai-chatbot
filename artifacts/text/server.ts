import { smoothStream, streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
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

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'text', document.title),
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      providerOptions: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content,
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

    return draftContent;
  },
});
