'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useRef, useCallback } from 'react';
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
import { FileIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

interface Session {
  user: {
    id: string;
    type: 'regular';
  };
}

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
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFiles, setDraggedFiles] = useState<File[]>([]);
  const dragCounterRef = useRef(0);

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
  
  // Drag event handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Increment drag counter to track nested elements
    dragCounterRef.current++;
    
    setIsDragging(true);
    
    // Get files from the drag event if available
    if (e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setDraggedFiles(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // Update dragged files if changed
    if (e.dataTransfer.files.length > 0 && draggedFiles.length !== e.dataTransfer.files.length) {
      const files = Array.from(e.dataTransfer.files);
      setDraggedFiles(files);
    }
  }, [draggedFiles.length]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Decrement drag counter
    dragCounterRef.current--;
    
    // Only hide overlay when counter reaches 0 (all drag events have left)
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
      setDraggedFiles([]);
    }
  }, []);

  // Add window-level event listener to detect when drag leaves the window
  useEffect(() => {
    const handleDragLeaveWindow = (e: DragEvent) => {
      // If the relatedTarget is null, the drag has left the window
      if (!e.relatedTarget) {
        dragCounterRef.current = 0;
        setIsDragging(false);
        setDraggedFiles([]);
      }
    };
    
    const handleDragEnd = () => {
      // When drag operation ends (anywhere), hide the overlay
      dragCounterRef.current = 0;
      setIsDragging(false);
      setDraggedFiles([]);
    };

    window.addEventListener('dragleave', handleDragLeaveWindow);
    window.addEventListener('dragend', handleDragEnd);
    window.addEventListener('drop', handleDragEnd);
    
    return () => {
      window.removeEventListener('dragleave', handleDragLeaveWindow);
      window.removeEventListener('dragend', handleDragEnd);
      window.removeEventListener('drop', handleDragEnd);
    };
  }, []);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to upload file');
        return null;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset drag counter
    dragCounterRef.current = 0;
    
    // Only proceed if we're not in readonly mode
    if (isReadonly) {
      setIsDragging(false);
      setDraggedFiles([]);
      toast({
        type: 'error',
        description: 'Cannot upload files in read-only mode',
      });
      return;
    }
    
    // Handle the dropped files
    const files = Array.from(e.dataTransfer.files);
    
    // Show uploading toast
    if (files.length > 0) {
      toast({
        type: 'success',
        description: `Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`,
      });
    }
    
    // Upload each file
    const uploadPromises = files.map(async (file) => {
      try {
        const result = await uploadFile(file);
        if (result) {
          const { url, pathname, contentType } = result;
          return {
            url,
            name: pathname,
            contentType,
          };
        }
        return null;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return null;
      }
    });
    
    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(Boolean) as Attachment[];
    
    // Update attachments with successful uploads
    if (successfulUploads.length > 0) {
      setAttachments(currentAttachments => [...currentAttachments, ...successfulUploads]);
      
      toast({
        type: 'success',
        description: `Successfully uploaded ${successfulUploads.length} file${successfulUploads.length > 1 ? 's' : ''}`,
      });
    }
    
    // Show error if some files failed to upload
    const failedCount = files.length - successfulUploads.length;
    if (failedCount > 0) {
      toast({
        type: 'error',
        description: `Failed to upload ${failedCount} file${failedCount > 1 ? 's' : ''}`,
      });
    }
    
    setIsDragging(false);
    setDraggedFiles([]);
  }, [isReadonly]);

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
      <div 
        className="flex flex-col min-w-0 h-dvh bg-white relative @container/nav"
        style={{ minHeight: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 0 }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* File drop overlay */}
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-500"
            style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center gap-4 max-w-md"
            >
              <div className="bg-blue-50 p-4 rounded-full">
                <FileIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">Drop files here</h3>
                <p className="text-sm text-gray-500">
                  {draggedFiles.length > 0 
                    ? `Ready to upload ${draggedFiles.length} file${draggedFiles.length > 1 ? 's' : ''}` 
                    : 'Drop your files to upload them to the chat'}
                </p>
              </div>
              {draggedFiles.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-sm"
                >
                  {draggedFiles.map((file, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2 py-1"
                    >
                      <FileIcon className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{(file.size / 1024).toFixed(1)} KB</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              {isReadonly && (
                <p className="text-xs text-amber-600 mt-2">Note: This chat is in read-only mode. Files cannot be uploaded.</p>
              )}
            </motion.div>
          </motion.div>
        )}
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
          attachments={attachments}
          setAttachments={setAttachments}
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
