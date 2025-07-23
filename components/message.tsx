'use client';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import { LinkedInHookSelector } from './linkedin-hook-selector';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

// Type narrowing is handled by TypeScript's control flow analysis
// The AI SDK provides proper discriminated unions for tool calls

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === 'file',
  );

  useDataStream();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4',
            {
              'w-full': mode === 'edit' || message.role === 'assistant',
              'max-w-2xl w-fit ml-auto': message.role === 'user' && mode !== 'edit',
            },
          )}
        >
          <div
            className="flex flex-col gap-4 w-full"
          >
            {attachmentsFromMessage.length > 0 && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {attachmentsFromMessage.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={{
                      name: attachment.filename ?? 'file',
                      contentType: attachment.mediaType,
                      url: attachment.url,
                    }}
                  />
                ))}
              </div>
            )}

            {message.parts.map((part, idx) => {
              const key = `${message.id}-${idx}`;
              const { type } = part;

              // Skip rendering text parts if this message contains a linkedInHookSelector tool call
              // This prevents duplicate content (text + cards)
              if (type === 'text' && message.parts.some(p => p.type === 'tool-linkedInHookSelector')) {
                return null;
              }

              if (type === 'reasoning' && part.text?.trim().length > 0) {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.text}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl text-left':
                            message.role === 'user',
                          'text-left': message.role === 'assistant',
                        })}
                      >
                        <Markdown>{sanitizeText(part.text)}</Markdown>
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        regenerate={regenerate}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-getWeather') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  return (
                    <div key={toolCallId} className="skeleton">
                      <Weather />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;
                  return (
                    <div key={toolCallId}>
                      <Weather weatherAtLocation={output} />
                    </div>
                  );
                }
              }

              if (type === 'tool-createDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentPreview isReadonly={isReadonly} args={input} />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentPreview
                        isReadonly={isReadonly}
                        result={output}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-updateDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;

                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="update"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="update"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-requestSuggestions') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="request-suggestions"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="request-suggestions"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }
              
              if (type === 'tool-linkedInHookSelector') {
                const { toolCallId, state } = part;
                console.log('[message.tsx] Processing linkedInHookSelector tool call, state:', state);

                if (state === 'input-available') {
                  // Check if we have data in the input
                  const input = part.input;
                  console.log('[message.tsx] Input-available state with input:', JSON.stringify(input));
                  
                  // Try to access hooks from various possible locations
                  // This is a workaround until we know the exact structure
                  const possibleHooksData = (input as any)?.hooks || (input as any)?.data?.hooks;
                  
                  // Check if we have hooks data to render
                  if (possibleHooksData && Array.isArray(possibleHooksData) && possibleHooksData.length > 0) {
                    console.log('[message.tsx] Rendering LinkedInHookSelector with hooks from input-available state');
                    
                    // Process hooks for the UI component
                    const hooks = possibleHooksData.map((hook: any, index: number) => ({
                      id: hook.id || index + 1,
                      source: hook.source || 'General',
                      content: hook.content || hook.text || ''
                    }));
                    
                    return (
                      <div key={toolCallId}>
                        <LinkedInHookSelector 
                          hooks={hooks}
                          onHookSelect={(selectedHook) => {
                            console.log('[message.tsx] Hook selected from input-available state:', selectedHook);
                            const hookMessage = `I've selected this hook: "${selectedHook.content}". Please use this hook to write a LinkedIn post.`;
                            
                            const dataStreamEvent = new CustomEvent('append-message', {
                              detail: { message: hookMessage }
                            });
                            document.dispatchEvent(dataStreamEvent);
                          }}
                        />
                      </div>
                    );
                  }
                  console.log("[message.tsx] Fallback to skeleton if no hooks data")
                  // Fallback to skeleton if no hooks data
                  return (
                    <div key={toolCallId} className="skeleton">
                      <div className="w-full max-w-3xl my-4 p-4 border border-gray-200 rounded-md animate-pulse">
                        <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                        <div className="grid grid-cols-2 gap-4">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;
                  console.log('[message.tsx] Output-available state with output:', typeof output, output);

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  // Get hooks from the output with proper type checking
                  console.log('[message.tsx] Tool output received:', JSON.stringify(output));
                  
                  // Check if output is directly a hooks array or has a hooks property
                  let rawHooks;
                  if (Array.isArray(output)) {
                    console.log('[message.tsx] Output is an array');
                    rawHooks = output;
                  } else {
                    const outputObj = output as any;
                    console.log('[message.tsx] Output keys:', Object.keys(outputObj));
                    
                    // Check all possible locations for hooks data
                    if (outputObj.hooks && Array.isArray(outputObj.hooks)) {
                      console.log('[message.tsx] Found hooks in output.hooks');
                      rawHooks = outputObj.hooks;
                    } else if (outputObj.data && outputObj.data.hooks && Array.isArray(outputObj.data.hooks)) {
                      console.log('[message.tsx] Found hooks in output.data.hooks');
                      rawHooks = outputObj.data.hooks;
                    } else {
                      console.log('[message.tsx] No hooks array found in expected locations');
                    }
                    
                    // If there's a message in the output, log it
                    if (outputObj.message) {
                      console.log('[message.tsx] Output message:', outputObj.message);
                    }
                  }
                  
                  // Process hooks for the UI component
                  console.log('[message.tsx] Raw hooks before processing:', JSON.stringify(rawHooks));
                  
                  if (!rawHooks || !Array.isArray(rawHooks) || rawHooks.length === 0) {
                    console.error('[message.tsx] Invalid hooks data received:', rawHooks);
                    return (
                      <div key={toolCallId} className="text-red-500 p-2 border rounded">
                        Error: No valid hooks data found
                      </div>
                    );
                  }
                  
                  const hooks = rawHooks.map((hook: any, index: number) => {
                    console.log('[message.tsx] Processing hook:', JSON.stringify(hook));
                    
                    const processedHook = {
                      id: hook.id || index + 1, // Use existing ID or create a new one
                      source: hook.source || 'General',
                      content: hook.content || hook.text || '' // Handle both content and text fields
                    };
                    
                    console.log('[message.tsx] Processed hook:', JSON.stringify(processedHook));
                    return processedHook;
                  });
                  
                  console.log('[message.tsx] Processed hooks for UI:', JSON.stringify(hooks));
                  console.log('[message.tsx] Number of hooks after processing:', hooks.length);
                  
                  if (hooks.length === 0) {
                    console.error('[message.tsx] No hooks available to display!');
                    return (
                      <div key={toolCallId} className="text-red-500 p-2 border rounded">
                        Error: Failed to process hooks data
                      </div>
                    );
                  }

                  console.log('[message.tsx] About to render LinkedInHookSelector with hooks:', JSON.stringify(hooks));
                  
                  // Force a re-render by adding a timestamp to the key
                  return (
                    <div key={`${toolCallId}-${Date.now()}`}>
                      <LinkedInHookSelector 
                        hooks={hooks}
                        onHookSelect={(selectedHook) => {
                          console.log('[message.tsx] Hook selected:', selectedHook);
                          // When a hook is selected, we'll append a message to the chat
                          // This will trigger the AI to continue with the selected hook
                          const hookMessage = `I've selected this hook: "${selectedHook.content}". Please use this hook to write a LinkedIn post.`;
                          
                          // Use the dataStream to append the message
                          // This is handled by the useDataStream hook
                          const dataStreamEvent = new CustomEvent('append-message', {
                            detail: { message: hookMessage }
                          });
                          console.log('[message.tsx] Dispatching append-message event');
                          window.dispatchEvent(dataStreamEvent);
                        }}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
                
                // Return a loading state if we're not in input-available or output-available state
                return (
                  <div key={toolCallId} className="skeleton">
                    <div className="w-full max-w-3xl my-4 p-4 border border-gray-200 rounded-md animate-pulse">
                      <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                      <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return false;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div className="flex gap-4 w-full">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
