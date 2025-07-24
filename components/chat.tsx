'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote, Document } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector, useArtifact } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
interface Session {
  user: {
    id: string;
    type: 'regular';
  };
}
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
  initialDocument,
  initialPinned = false,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
  initialDocument?: Document | null;
  initialPinned?: boolean;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  const [input, setInput] = useState<string>('');
  const [isPinned, setIsPinned] = useState<boolean>(initialPinned);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: initialChatModel,
            selectedVisibilityType: visibilityType,
            ...(initialDocument && {
              documentContext: {
                id: initialDocument.id,
                title: initialDocument.title,
                content: initialDocument.content || '',
                kind: initialDocument.kind,
              },
            }),
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');
  const linkedinConnected = searchParams.get('linkedin_connected');
  const error = searchParams.get('error');
  const hasProcessedQueryRef = useRef(false);
  const hasProcessedLinkedInRef = useRef(false);

  useEffect(() => {
    if (query && !hasProcessedQueryRef.current) {
      hasProcessedQueryRef.current = true;
      
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [query, sendMessage]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const handlePin = (pinned: boolean) => {
    setIsPinned(pinned);
    // Optionally revalidate sidebar history to show updated pin status
    mutate(unstable_serialize(getChatHistoryPaginationKey));
  };
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setArtifact } = useArtifact();

  // Handle LinkedIn connection success/error messages
  useEffect(() => {
    if ((linkedinConnected === 'true' || error) && !hasProcessedLinkedInRef.current) {
      hasProcessedLinkedInRef.current = true;
      
      // Restore artifact state if it was saved before OAuth redirect (for both success and error cases)
      const savedArtifactState = localStorage.getItem('linkedin-oauth-artifact-state');
      if (savedArtifactState) {
        try {
          const artifactState = JSON.parse(savedArtifactState);
          setArtifact(artifactState);
          localStorage.removeItem('linkedin-oauth-artifact-state');
        } catch (error) {
          console.error('Failed to restore artifact state:', error);
        }
      }
      
      if (linkedinConnected === 'true') {
        toast({
          type: 'success',
          description: 'LinkedIn connected successfully!',
        });
      } else if (error === 'linkedin_connection_failed') {
        toast({
          type: 'error',
          description: 'Failed to connect LinkedIn. Please try again.',
        });
      } else if (error === 'linkedin_auth_failed') {
        toast({
          type: 'error',
          description: 'LinkedIn authentication failed. Please try again.',
        });
      }

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('linkedin_connected');
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [linkedinConnected, error, setArtifact]);

  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  // Auto-open document artifact if initialDocument is provided
  useEffect(() => {
    if (initialDocument) {
      setArtifact({
        documentId: initialDocument.id,
        kind: initialDocument.kind as 'text' | 'image',
        content: initialDocument.content || '',
        title: initialDocument.title,
        isVisible: true,
        status: 'idle',
        boundingBox: {
          top: 0,
          left: 0,
          width: 0,
          height: 0,
        },
      });
    }
  }, [initialDocument, setArtifact]);

  const formElement = !isReadonly ? (
    <MultimodalInput
      chatId={id}
      input={input}
      setInput={setInput}
      status={status}
      stop={stop}
      attachments={attachments}
      setAttachments={setAttachments}
      messages={messages}
      setMessages={setMessages}
      sendMessage={sendMessage}
      selectedVisibilityType={visibilityType}
    />
  ) : null;

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-white relative @container/nav">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
          hasMessages={messages.length > 0}
          isPinned={isPinned}
          onPin={handlePin}
        />

                <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
          formElement={messages.length === 0 ? formElement : undefined}
        />

        {messages.length > 0 && (
          <div className="sticky bottom-0 z-10 bg-white">
            <form className="flex mx-auto px-4 gap-2 w-full md:max-w-3xl pb-4">
              {formElement}
            </form>
          </div>
        )}
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
        openedFromPosts={!!initialDocument}
      />
    </>
  );
}
