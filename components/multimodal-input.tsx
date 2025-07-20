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

import { ArrowUpIcon, PaperclipIcon, StopIcon, BoltIcon, SizeDynamicIcon, FormatIcon, HooksIcon, CloseIcon } from './icons';
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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showHooksPanel, setShowHooksPanel] = useState(false);

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
    setShowQuickActions(false);
    setShowHooksPanel(false);

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

  // Show quick actions when in artifact context and artifact is text
  const shouldShowQuickActions = isArtifactContext && artifactKind === 'text';

  const quickActions = [
    {
      id: 'variation',
      label: 'Create a variation of this post',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.24 2h-3.894c-1.764 0-3.162 0-4.255.148c-1.126.152-2.037.472-2.755 1.193c-.719.721-1.038 1.636-1.189 2.766C3 7.205 3 8.608 3 10.379v5.838c0 1.508.92 2.8 2.227 3.342c-.067-.91-.067-2.185-.067-3.247v-5.01c0-1.281 0-2.386.118-3.27c.127-.948.413-1.856 1.147-2.593s1.639-1.024 2.583-1.152c.88-.118 1.98-.118 3.257-.118h3.07c1.276 0 2.374 0 3.255.118A3.6 3.6 0 0 0 15.24 2"></path><path d="M6.6 11.397c0-2.726 0-4.089.844-4.936c.843-.847 2.2-.847 4.916-.847h2.88c2.715 0 4.073 0 4.917.847S21 8.671 21 11.397v4.82c0 2.726 0 4.089-.843 4.936c-.844.847-2.202.847-4.917.847h-2.88c-2.715 0-4.073 0-4.916-.847c-.844-.847-.844-2.21-.844-4.936z"></path></svg>
    },
    {
      id: 'shorter',
      label: 'Make the post shorter',
      icon: <SizeDynamicIcon size={14} type="decrease" />
    },
    {
      id: 'longer',
      label: 'Make the post longer',
      icon: <SizeDynamicIcon size={14} type="increase" />
    },
    {
      id: 'ask',
      label: 'Ask anything',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22"></path></svg>
    }
  ];

  const sampleHooks = [
    {
      id: 1,
      text: "Every big idea starts as a test.",
      category: "Mindset & Motivation",
      isSelected: true
    },
    {
      id: 2,
      text: "I test everything at work before I trust it.",
      category: "Mindset & Motivation",
      isSelected: false
    },
    {
      id: 3,
      text: "If you never test, you never grow.",
      category: "Mindset & Motivation",
      isSelected: false
    },
    {
      id: 4,
      text: "The best AI results come from constant testing.",
      category: "Mindset & Motivation",
      isSelected: false
    },
    {
      id: 5,
      text: "My rule: test first, worry later.",
      category: "Mindset & Motivation",
      isSelected: false
    },
    {
      id: 6,
      text: "Want to use AI better? Start with a simple test today.",
      category: "Mindset & Motivation",
      isSelected: false
    }
  ];

  const handleQuickAction = (actionId: string) => {
    let actionText = '';
    switch (actionId) {
      case 'variation':
        actionText = 'Create a variation of this post';
        break;
      case 'shorter':
        actionText = 'Make the post shorter';
        break;
      case 'longer':
        actionText = 'Make the post longer';
        break;
      case 'ask':
        actionText = 'Ask anything';
        break;
    }
    
    if (actionText) {
      setInput(actionText);
      setShowQuickActions(false);
    }
  };

  const handleQuickButton = (buttonType: string) => {
    let actionText = '';
    switch (buttonType) {
      case 'length':
        actionText = 'Adjust the length of this post';
        break;
      case 'format':
        actionText = 'Improve the formatting of this post';
        break;
      case 'hook':
        setShowHooksPanel(true);
        return;
    }
    
    if (actionText) {
      setInput(actionText);
      if (width && width > 768) {
        textareaRef.current?.focus();
      }
    }
  };

  const handleHookSelect = (hookText: string) => {
    setInput(`Use this hook: "${hookText}"`);
    setShowHooksPanel(false);
    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AnimatePresence>
        {!isAtBottom && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
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
      {shouldShowQuickActions && showQuickActions && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 230 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative mb-4"
          >
            <div className="relative flex h-full w-full flex-col flex-nowrap items-center justify-between px-2">
              <div className="bg-transparent border-divider relative flex h-full w-full flex-col overflow-hidden rounded-3xl border p-4 backdrop-blur-sm">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-muted-foreground rounded-full bg-transparent hover:bg-default/40"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setShowQuickActions(false);
                    }}
                  >
                    <CloseIcon size={18} />
                  </Button>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <BoltIcon size={18} />
                  <h3 className="text-foreground text-sm font-semibold">Quick Actions</h3>
                </div>
                <div className="mt-5 -ml-2 flex-1 overflow-hidden">
                  <div className="overflow-y-auto h-full w-full">
                    <div className="w-full relative flex flex-col gap-1 overflow-clip p-0">
                      <ul className="w-full flex flex-col gap-0.5 outline-hidden">
                        {quickActions.map((action) => (
                          <li key={action.id}>
                            <Button
                              type="button"
                              variant="ghost"
                              className="flex group items-center justify-between w-full h-full box-border cursor-pointer bg-transparent hover:bg-default/40 p-2 rounded-lg gap-2 text-foreground"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                handleQuickAction(action.id);
                              }}
                            >
                              <div className="text-primary">{action.icon}</div>
                              <span className="flex-1 font-normal truncate text-sm text-left">{action.label}</span>
                              <svg className="text-muted-foreground mr-2 opacity-0 group-hover:opacity-100" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21.25 4a.75.75 0 0 1 .75.75v6.5A3.75 3.75 0 0 1 18.25 15H4.587l3.72 3.72a.75.75 0 0 1 .072.976l-.072.084a.75.75 0 0 1-.977.073l-.084-.073l-5-5a.75.75 0 0 1-.073-.976l.073-.084l5-5a.75.75 0 0 1 1.133.976l-.072.084l-3.72 3.72h13.665a2.25 2.25 0 0 0 2.244-2.096l.006-.154v-6.5a.75.75 0 0 1 .75-.75"/>
                              </svg>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Hooks Panel */}
      {showHooksPanel && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 400 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="relative mb-4"
          >
            <div className="relative flex h-full w-full flex-col flex-nowrap items-center justify-between px-2">
              <div className="bg-transparent border-divider relative flex h-full w-full flex-col overflow-hidden rounded-3xl border p-4 backdrop-blur-sm">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 text-muted-foreground rounded-full bg-transparent hover:bg-default/40"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setShowHooksPanel(false);
                    }}
                  >
                    <CloseIcon size={18} />
                  </Button>
                </div>
                
                {/* Header */}
                <div className="flex flex-row items-center gap-2">
                  <HooksIcon size={18} />
                  <h3 className="text-foreground text-sm font-semibold">Post Hooks</h3>
                </div>
                
                {/* Description */}
                <p className="text-muted-foreground mt-3 text-center text-sm">
                  Select a hook to start your post with, or create your own.
                </p>
                
                {/* Custom Hook Input */}
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom hook..."
                    className="flex-1 h-9 px-3 text-sm bg-transparent border border-default-200 rounded-lg focus:border-primary focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-4 bg-primary text-primary-foreground hover:opacity-hover"
                    disabled
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add
                  </Button>
                </div>
                
                {/* Filter */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-foreground/70 text-sm font-medium">Filter:</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="h-5 cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
                      PERSONAL
                    </span>
                  </div>
                </div>
                
                {/* Hooks List */}
                <div className="mt-3 flex-1 overflow-hidden">
                  <div className="overflow-y-auto h-[200px] w-full">
                    <div className="grid grid-cols-1 gap-3">
                      {sampleHooks.map((hook) => (
                        <Button
                          key={hook.id}
                          type="button"
                          variant="ghost"
                          className={`flex flex-col relative overflow-hidden h-auto text-foreground box-border outline-hidden rounded-lg cursor-pointer transition-colors border p-3 shadow-none w-full text-left ${
                            hook.isSelected 
                              ? 'border-primary bg-primary/10 hover:bg-primary/20' 
                              : 'bg-transparent border-divider hover:bg-content2'
                          }`}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleHookSelect(hook.text);
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20">
                              Personal
                            </div>
                            <div className="flex items-center gap-2 rounded-full px-2 py-0.5 text-purple-400 bg-purple-500/10 border border-purple-500/20">
                              <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                              <span className="text-[10px] font-medium tracking-wider">{hook.category}</span>
                            </div>
                          </div>
                          <p className="text-foreground mt-2 text-start text-sm">{hook.text}</p>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div className="relative bg-transparent border border-transparent rounded-2xl transition-all duration-150 ease-in-out">
        {/* Original input design for all contexts */}
        <div className="relative bg-white border border-blue-100 rounded-2xl shadow-xl">
          <Textarea
            data-testid="multimodal-input"
            ref={textareaRef}
            placeholder={shouldShowQuickActions ? "Describe what you want to change..." : "Send a message..."}
            value={input}
            onChange={handleInput}
            className={cx(
              'min-h-[56px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-transparent border-none px-4 py-4 pb-12 focus:ring-0 focus:ring-offset-0',
              className,
            )}
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

          {/* Attachment button - only show when not in artifact context */}
          {!shouldShowQuickActions && (
            <div className="absolute bottom-2 left-2">
              <AttachmentsButton fileInputRef={fileInputRef} status={status} />
            </div>
          )}

          {/* Quick action buttons inside the input for artifact context */}
          {shouldShowQuickActions && (
            <div className="absolute bottom-2 left-2 flex flex-row items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="bg-transparent hover:bg-default/40 min-w-8 w-8 h-8 p-2 text-primary"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setShowQuickActions(!showQuickActions);
                }}
              >
                <BoltIcon size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-w-16 h-8 text-tiny gap-2 rounded-medium bg-transparent text-default-foreground hover:bg-default/40 p-2"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleQuickButton('length');
                }}
              >
                <SizeDynamicIcon size={18} />
                <span className="text-sm">Length</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-w-16 h-8 text-tiny gap-2 rounded-medium bg-transparent text-default-foreground hover:bg-default/40 p-2"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleQuickButton('format');
                }}
              >
                <FormatIcon size={16} />
                <span className="text-sm">Format</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-w-16 h-8 text-tiny gap-2 rounded-medium bg-transparent text-default-foreground hover:bg-default/40 p-2"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleQuickButton('hook');
                }}
              >
                <HooksIcon size={16} />
                <span className="text-sm">Hook</span>
              </Button>
            </div>
          )}

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

        {/* Regular suggested actions for non-artifact context */}
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
