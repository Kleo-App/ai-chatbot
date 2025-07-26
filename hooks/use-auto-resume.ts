'use client';

import { useEffect, useRef } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from '@/components/data-stream-provider';

export interface UseAutoResumeParams {
  autoResume: boolean;
  initialMessages: ChatMessage[];
  resumeStream: UseChatHelpers<ChatMessage>['resumeStream'];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
}

export function useAutoResume({
  autoResume,
  initialMessages,
  resumeStream,
  setMessages,
  sendMessage,
}: UseAutoResumeParams) {
  const { dataStream, setDataStream } = useDataStream();

  // Use a ref to track processed message content to prevent duplicate messages
  const processedMessageContent = useRef<Set<string>>(new Set());
  
  // Use a ref to track the last time a message was sent to prevent rapid duplicate sends
  const lastMessageTime = useRef<number>(0);

  useEffect(() => {
    if (!autoResume) return;

    const mostRecentMessage = initialMessages.at(-1);

    if (mostRecentMessage?.role === 'user') {
      resumeStream();
    }

    // we intentionally run this once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dataStream) return;
    if (dataStream.length === 0) return;

    // Process only the most recent data part
    const dataPart = dataStream[dataStream.length - 1];

    // Skip if not an append message
    if (dataPart.type !== 'data-appendMessage') return;

    // Get the message content
    const messageContent = dataPart.data as string;
    
    // Skip if we've already processed this exact message content
    if (processedMessageContent.current.has(messageContent)) {
      console.log('[use-auto-resume] Skipping already processed message content:', messageContent);
      return;
    }
    
    // Implement a cooldown to prevent rapid duplicate sends (at least 2 seconds between sends)
    const now = Date.now();
    if (now - lastMessageTime.current < 2000) {
      console.log('[use-auto-resume] Skipping message due to cooldown period');
      return;
    }
    
    console.log('[use-auto-resume] Processing new append message:', messageContent);
    
    // Mark this message content as processed and update last message time
    processedMessageContent.current.add(messageContent);
    lastMessageTime.current = now;

    console.log('[use-auto-resume] Sending message to AI:', messageContent);
    
    // Use sendMessage to properly send the message to the AI
    // This will both update the UI and send the message to the AI
    sendMessage({
      role: 'user',
      parts: [
        {
          type: 'text',
          text: messageContent
        }
      ]
    });
    
    // Clear the processed message from dataStream to prevent reprocessing
    setDataStream(prevStream => prevStream.filter((_, i) => i !== dataStream.length - 1));
    
    console.log('[use-auto-resume] Message sent to AI, waiting for response');
  }, [dataStream, setMessages, sendMessage, setDataStream]); // Updated dependencies
}
