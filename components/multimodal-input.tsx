'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { VisibilityType } from './visibility-selector';
import type { Attachment, ChatMessage } from '@/lib/types';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  isArtifactContext = false,
  artifactKind,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  className?: string;
  selectedVisibilityType: VisibilityType;
  isArtifactContext?: boolean;
  artifactKind?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  // Removed showQuickActions and showHooksPanel state since we're removing these features

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);

    sendMessage({
      role: 'user',
      parts: [
        ...attachments.map((attachment) => ({
          type: 'file' as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        {
          type: 'text',
          text: input,
        },
      ],
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();
    setInput('');
    // Removed showQuickActions and showHooksPanel reset

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploadQueue((currentUploadQueue) => [...currentUploadQueue, file.name]);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          {
            url,
            name: pathname,
            contentType: contentType,
          },
        ]);
      } else {
        console.error('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadQueue((currentUploadQueue) =>
        currentUploadQueue.filter((filename) => filename !== file.name),
      );
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => uploadFile(file));
  };

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  // Removed quick actions functionality

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AnimatePresence>
        {!isAtBottom && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-32 -translate-x-1/2 z-50"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

                {/* Quick Actions Panel */}
      {/* Removed Quick Actions Panel */}

      {/* Hooks Panel */}
      {/* Removed Hooks Panel */}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />



      <div className="relative bg-transparent border border-transparent rounded-2xl transition-all duration-150 ease-in-out">
        {/* Original input design for all contexts */}
        <div className="relative bg-white border border-blue-100 rounded-2xl shadow-xl focus-within:shadow-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-white focus-within:ring-black focus-within:border-transparent transition-all duration-200">
          {/* Image previews at the top of input */}
          {(attachments.length > 0 || uploadQueue.length > 0) && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex flex-row gap-2 overflow-x-auto overflow-y-visible" style={{ paddingTop: '4px', paddingRight: '4px' }}>
                {attachments.map((attachment, index) => (
                  <InlineImagePreview
                    key={attachment.url}
                    attachment={attachment}
                    onRemove={() => {
                      setAttachments(prev => prev.filter((_, i) => i !== index));
                    }}
                  />
                ))}
                {uploadQueue.map((filename) => (
                  <InlineImagePreview
                    key={filename}
                    attachment={{
                      url: '',
                      name: filename,
                      contentType: '',
                    }}
                    isUploading={true}
                    onRemove={() => {}}
                  />
                ))}
              </div>
            </div>
          )}

          <Textarea
            data-testid="multimodal-input"
            ref={textareaRef}
            placeholder="Ask Kleo"
            value={input}
            onChange={handleInput}
            className={cx(
              'rounded-2xl min-h-[110px] max-h-[calc(75dvh)] overflow-hidden resize-none !text-base bg-transparent border-none px-4 pb-12 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-transparent focus:shadow-none',
              (attachments.length > 0 || uploadQueue.length > 0) ? 'pt-2' : 'py-4',
              className,
            )}
            style={{ outline: 'none', boxShadow: 'none' }}
            rows={2}
            autoFocus
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();

                if (status !== 'ready') {
                  toast.error('Please wait for the model to finish its response!');
                } else {
                  submitForm();
                }
              }
            }}
          />

          {/* Attachment button - show for all contexts now */}
          <div className="absolute bottom-2 left-2">
            <AttachmentsButton fileInputRef={fileInputRef} status={status} />
          </div>

          {/* Quick action buttons inside the input for artifact context */}
          {/* Removed Quick action buttons */}

          {/* Send/Stop button */}
          <div className="absolute bottom-2 right-2">
            {status === 'submitted' ? (
              <StopButton stop={stop} setMessages={setMessages} />
            ) : (
              <SendButton
                input={input}
                submitForm={submitForm}
                uploadQueue={uploadQueue}
              />
            )}
          </div>
        </div>

        {/* Temporarily hidden - Regular suggested actions for non-artifact context */}
        {/*
        {!shouldShowQuickActions &&
          messages.length === 0 &&
          attachments.length === 0 &&
          uploadQueue.length === 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {[
                'Career update post',
                'Industry insights',
                'Professional tips',
                'Company announcement'
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full px-3 text-sm bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => {
                    window.history.replaceState({}, '', `/chat/${chatId}`);
                    sendMessage({
                      role: 'user',
                      parts: [{ type: 'text', text: `Write a ${suggestion.toLowerCase()}` }],
                    });
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        */}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-600 rounded-full p-2 size-8 border-none"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="bg-[#157DFF] text-white hover:bg-[#157DFF]/90 rounded-full p-1.5 size-8 border-none"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpRight size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});

function InlineImagePreview({
  attachment,
  isUploading = false,
  onRemove,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove: () => void;
}) {
  const { url, contentType } = attachment;
  const [isHovered, setIsHovered] = useState(false);

  // Only show for images
  if (!isUploading && (!contentType || !contentType.startsWith('image'))) {
    return null;
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
        {!isUploading && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Attachment preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            {isUploading && (
              <div className="animate-spin">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Close button on hover */}
      {(isHovered || isUploading) && !isUploading && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors z-50"
          style={{ zIndex: 50 }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  );
}
