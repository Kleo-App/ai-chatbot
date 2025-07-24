import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, currentUser } from '@clerk/nextjs/server';
import type { RequestHints, } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  getOrCreateUser,
  updateChatTitleById,
  updateChatPinnedById,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { linkedInHookSelector } from '@/lib/ai/tools/linkedin-hook-selector';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { UserType } from '@/lib/types';
import { getLangfuseClient } from '@/lib/ai/langfuse-client';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

async function getFetchedPrompt() {
  try {
    const langfuse = await getLangfuseClient();
    if (!langfuse) {
      console.warn('Langfuse not available, using fallback system prompt');
      return {
        compile: () => 'You are Lara, an AI assistant designed to help with various tasks. Be helpful, concise, and professional in your responses.',
        toJSON: () => 'You are Lara, an AI assistant designed to help with various tasks. Be helpful, concise, and professional in your responses.'
      };
    }
    
    const prompt = await langfuse.getPrompt('lara_system_prompt');
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Compile the prompt with the date variable
    return {
      compile: () => prompt.compile({ date: today }),
      toJSON: () => prompt.compile({ date: today })
    };
  } catch (error) {
    console.error('Failed to fetch system prompt:', error);
    // Provide a fallback prompt if fetch fails
    return {
      compile: () => 'You are Lara, an AI assistant designed to help with various tasks. Be helpful, concise, and professional in your responses.',
      toJSON: () => 'You are Lara, an AI assistant designed to help with various tasks. Be helpful, concise, and professional in your responses.'
    };
  }
}

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
      documentContext,
    } = requestBody;

    const { userId } = await auth();

    if (!userId) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Get the current user from Clerk to access email
    const user = await currentUser();
    if (!user || !user.emailAddresses?.[0]?.emailAddress) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    // Ensure user exists in local database
    await getOrCreateUser({
      id: userId,
      email: user.emailAddresses[0].emailAddress,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    });

    // Create a session-like object for compatibility with existing tools
    const session = {
      user: {
        id: userId,
        type: 'regular' as UserType,
      },
    };

    const userType: UserType = 'regular';

    const messageCount = await getMessageCountByUserId({
      id: userId,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: userId,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== userId) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        // Get the prompt first
        const prompt = await getFetchedPrompt();
        
        // Add document context to system prompt if editing an existing document
        let systemPrompt = prompt?.toJSON() || '';
        if (documentContext) {
          systemPrompt += `\n\nIMPORTANT: You are currently helping the user edit an existing ${documentContext.kind} artifact titled "${documentContext.title}". The artifact is already open and contains the following content:

${documentContext.content}

When the user asks to make changes, you MUST use the updateDocument tool with the ID "${documentContext.id}" to modify this existing artifact rather than creating a new one. Keep the content the same unless the user asks for specific changes.`;
        }
        
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt || undefined,
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                  'linkedInHookSelector',
                ],
          experimental_transform: smoothStream({ chunking: 'word',  }),
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            linkedInHookSelector: linkedInHookSelector({
              session,
              dataStream,
            }),
          },
          experimental_telemetry: {
            isEnabled: true,
            metadata: {
              langfusePrompt: prompt?.toJSON() || 'fallback',
            },
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const { userId } = await auth();

  if (!userId) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== userId) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const { userId } = await auth();

  if (!userId) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const body: { title?: string; pinned?: boolean } = await request.json();

  const chat = await getChatById({ id });

  if (!chat || chat.userId !== userId) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  // Handle title update
  if (body.title !== undefined) {
    if (!body.title || body.title.trim().length === 0) {
      return new ChatSDKError('bad_request:api', 'Title is required').toResponse();
    }
    await updateChatTitleById({ chatId: id, title: body.title.trim() });
  }

  // Handle pinned status update
  if (body.pinned !== undefined) {
    await updateChatPinnedById({ chatId: id, pinned: body.pinned });
  }

  return Response.json({ success: true }, { status: 200 });
}
