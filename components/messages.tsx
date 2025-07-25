import { PreviewMessage, ThinkingMessage } from './message';
import { memo, } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage, Attachment } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import Image from 'next/image';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Array<Vote> | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  formElement?: React.ReactNode;
  attachments?: Array<Attachment>;
  setAttachments?: React.Dispatch<React.SetStateAction<Array<Attachment>>>;
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  formElement,
  attachments = [],
  setAttachments,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  useDataStream();
  
  return (
    <div
      ref={messagesContainerRef}
      className={`flex flex-col min-w-0 gap-6 flex-1 pt-4 relative bg-white ${
        messages.length === 0 ? 'items-center justify-center -mt-16 md:-mt-16' : 'overflow-y-scroll pb-4 px-4'
      }`}
    >
      {messages.length === 0 && formElement && (
        <div className="w-full max-w-3xl mx-auto px-4 flex flex-col items-center">
          {/* Logo above chat input */}
          <div className="mb-8">
            <Image
              src="/images/kleo.svg"
              alt="Kleo"
              width={107}
              height={32}
              className="h-8 w-auto mx-auto"
            />
          </div>
          <div className="w-full">
            {formElement}
          </div>
        </div>
      )}

      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === 'streaming' && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
          requiresScrollPadding={
            hasSentMessage && index === messages.length - 1
          }
        />
      ))}

      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  if (!equal(prevProps.attachments, nextProps.attachments)) return false;

  return false;
});
