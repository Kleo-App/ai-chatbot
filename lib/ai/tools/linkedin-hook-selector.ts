import { z } from 'zod';
import { tool, type UIMessageStreamWriter } from 'ai';
import { generateHookIdeas, type HookIdea } from '@/lib/ai/hook-generator';
import type { ChatMessage, UserType } from '@/lib/types';

interface LinkedInHookSelectorProps {
  session: {
    user: {
      id: string;
      type: UserType;
    };
  };
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

// Define a simple schema that includes all fields as required
const inputSchema = z.object({
  bio: z.string().describe('User bio information to personalize the hooks'),
  selectedTopics: z.string().describe('Topics the user is interested in, as a JSON string or comma-separated list'),
  additionalInstructions: z.string().describe('Any additional instructions for hook generation')
});

export function linkedInHookSelector({ session, dataStream }: LinkedInHookSelectorProps) {
  // Force this tool to be used in the LinkedIn post creation workflow
  console.log('[linkedInHookSelector] Tool initialized');
  
  return tool({
    description:
      'Generate LinkedIn post hook options for the user to select from. ALWAYS use this tool FIRST when creating a LinkedIn post, BEFORE using createDocument.',
    inputSchema,
    execute: async ({ bio, selectedTopics, additionalInstructions }) => {
      try {
        const userId = session.user.id;
        
        if (!userId) {
          return {
            error: 'User not authenticated',
          };
        }
        
        // We'll use the bio parameter if provided, otherwise we'll rely on the user profile
        // from the database that the generateHookIdeas function will fetch

        // Signal that we're starting the hook selection process
        dataStream.write({
          type: 'data-clear',
          data: null,
          transient: true,
        });

        // Generate hooks using the hook generator with the provided bio and topics
        console.log('[linkedInHookSelector] Calling generateHookIdeas');
        const hooks = await generateHookIdeas(
          userId,
          bio, // Pass the bio parameter to the hook generator
          selectedTopics // Pass the selectedTopics parameter to the hook generator
        );
        console.log('[linkedInHookSelector] Generated hooks:', JSON.stringify(hooks));

        if (!hooks || hooks.length === 0) {
          return {
            error: 'Failed to generate hooks',
          };
        }

        // Send hooks to the UI for selection
        console.log('[linkedInHookSelector] Writing to dataStream: data-linkedin-hooks');
        dataStream.write({
          type: 'data-linkedin-hooks',
          data: hooks,
          transient: true,
        });

        // Signal completion
        console.log('[linkedInHookSelector] Writing to dataStream: data-finish');
        dataStream.write({ 
          type: 'data-finish', 
          data: null, 
          transient: true 
        });

        const result = {
          message: 'LinkedIn hooks have been generated for selection.',
          hooks: hooks.map((hook, index) => ({
            id: index + 1,
            source: hook.source,
            text: hook.content,  // Include text field for compatibility with AI response format
            content: hook.content // Include content field for UI component
          }))
        };
        console.log('[linkedInHookSelector] Returning result:', JSON.stringify(result));
        return result;
      } catch (error) {
        console.error('Error in linkedInHookSelector tool:', error);
        return {
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
  });
}
