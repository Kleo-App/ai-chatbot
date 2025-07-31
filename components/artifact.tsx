import { formatDistance } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useDebounceCallback, useWindowSize } from 'usehooks-ts';
import type { Document, Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { VersionFooter } from './version-footer';
import { ArtifactActions } from './artifact-actions';
import { ArtifactCloseButton } from './artifact-close-button';
import { ArtifactMessages } from './artifact-messages';
import { ArrowLeftIcon, HomeIcon, MessageIcon, PenIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { useArtifact, initialArtifactData } from '@/hooks/use-artifact';
import { imageArtifact } from '@/artifacts/image/client';
import { textArtifact } from '@/artifacts/text/client';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useUser } from '@clerk/nextjs';
import { LinkedInPostEditor } from './linkedin-post-editor';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export const artifactDefinitions = [
  textArtifact,
  imageArtifact,
];
export type ArtifactKind = (typeof artifactDefinitions)[number]['kind'];

export interface UIArtifact {
  title: string;
  documentId: string;
  kind: ArtifactKind;
  content: string;
  isVisible: boolean;
  status: 'streaming' | 'idle';
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  linkedInHooks?: Array<{
    id: number;
    source: string;
    content: string;
  }>;
}

function PureArtifact({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  sendMessage,
  messages,
  setMessages,
  regenerate,
  votes,
  isReadonly,
  selectedVisibilityType,
  openedFromPosts = false,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: UseChatHelpers<ChatMessage>['stop'];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  votes: Array<Vote> | undefined;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  selectedVisibilityType: VisibilityType;
  openedFromPosts?: boolean;
}) {
  const { artifact, setArtifact, metadata, setMetadata } = useArtifact();
  const { user } = useUser();
  const router = useRouter();

  const {
    data: documents,
    isLoading: isDocumentsFetching,
    mutate: mutateDocuments,
  } = useSWR<Array<Document>>(
    artifact.documentId !== 'init' && artifact.status !== 'streaming'
      ? `/api/document?id=${artifact.documentId}`
      : null,
    fetcher,
  );

  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const [viewMode, setViewMode] = useState<'chat' | 'editor'>('chat');

  const { open: isSidebarOpen } = useSidebar();

  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(documents.length - 1);
        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          content: mostRecentDocument.content ?? '',
        }));
      }
    }
  }, [documents, setArtifact]);

  useEffect(() => {
    mutateDocuments();
  }, [artifact.status, mutateDocuments]);

  const { mutate } = useSWRConfig();
  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact) return;

      mutate<Array<Document>>(
        `/api/document?id=${artifact.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          if (currentDocument.content !== updatedContent) {
            await fetch(`/api/document?id=${artifact.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: artifact.title,
                content: updatedContent,
                kind: artifact.kind,
              }),
            });

            setIsContentDirty(false);

            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false },
      );
    },
    [artifact, mutate],
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange],
  );

  const handleEditorContentChange = useCallback((newTextContent: string) => {
    // Get existing media from current artifact content
    const existingMedia = getAllMediaFromArtifact(artifact.content);
    
    // Create new content structure with updated text and existing media
    const newContentData = {
      text: newTextContent,
      images: existingMedia.images,
      videos: existingMedia.videos,
      documents: existingMedia.documents
    };
    const newContent = JSON.stringify(newContentData);

    // Update artifact content immediately for instant preview (only if changed)
    setArtifact((currentArtifact) => {
      if (currentArtifact.content === newContent) {
        return currentArtifact; // No change, don't trigger re-render
      }
      return {
        ...currentArtifact,
        content: newContent,
      };
    });
    
    // Save immediately without debouncing to prevent old content from overwriting new content
    saveContent(newContent, false);
  }, [saveContent, setArtifact, artifact.content]);

  const toggleViewMode = useCallback(() => {
    setViewMode(mode => mode === 'chat' ? 'editor' : 'chat');
  }, []);

  const handleBackButton = useCallback(() => {
    if (openedFromPosts) {
      // Clear the artifact state when navigating back from posts
      setArtifact({ ...initialArtifactData, status: 'idle' });
      router.push('/posts');
    } else {
      // Clear the artifact state and navigate to start a new chat
      setArtifact({ ...initialArtifactData, status: 'idle' });
      router.push('/');
    }
  }, [openedFromPosts, router, setArtifact]);

  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  // Helper function to extract text content from JSON format
  const getTextContentFromArtifact = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && 'text' in parsed) {
        return parsed.text;
      }
    } catch {
      // Content is not JSON, return as is
    }
    return content;
  };

  // Helper functions to get media from content
  const getImagesFromArtifact = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && 'images' in parsed) {
        return parsed.images || [];
      }
    } catch {
      // Content is not JSON
    }
    return [];
  };

  const getVideosFromArtifact = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && 'videos' in parsed) {
        return parsed.videos || [];
      }
    } catch {
      // Content is not JSON
    }
    return [];
  };

  const getDocumentsFromArtifact = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && 'documents' in parsed) {
        return parsed.documents || [];
      }
    } catch {
      // Content is not JSON
    }
    return [];
  };

  const getAllMediaFromArtifact = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return {
          text: parsed.text || '',
          images: parsed.images || [],
          videos: parsed.videos || [],
          documents: parsed.documents || []
        };
      }
    } catch {
      // Content is not JSON
    }
    return {
      text: content,
      images: [],
      videos: [],
      documents: []
    };
  };

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    if (type === 'latest') {
      setCurrentVersionIndex(documents.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < documents.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  // All content is LinkedIn posts now
  const isLinkedInPost = true;

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!');
  }

  useEffect(() => {
    if (artifact.documentId !== 'init') {
      if (artifactDefinition.initialize) {
        artifactDefinition.initialize({
          documentId: artifact.documentId,
          setMetadata,
        });
      }
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  return (
    <AnimatePresence>
      {artifact.isVisible && (
        <motion.div
          data-testid="artifact"
          className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {!isMobile && (
            <motion.div
              className="fixed bg-background h-dvh"
              initial={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
              animate={{ width: windowWidth, right: 0 }}
              exit={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
            />
          )}

          {!isMobile && (
            <motion.div
              className="relative w-2/5 bg-white h-dvh shrink-0"
              initial={{ opacity: 0, x: 10, scale: 1 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }}
              exit={{
                opacity: 0,
                x: 0,
                scale: 1,
                transition: { duration: 0 },
              }}
            >
              <AnimatePresence>
                {!isCurrentVersion && (
                  <motion.div
                    className="left-0 absolute h-dvh w-full top-0 bg-zinc-900/50 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>

              <div className="flex flex-col h-full">
                {/* Header with Back Button and Tabs */}
                <div className="flex h-[70px] items-center justify-between w-full px-2 sm:px-4 md:px-6">
                  <div className="flex items-center gap-3">
                    {isLinkedInPost && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleBackButton}
                        className="h-fit p-2"
                        title="Home"
                      >
                        <HomeIcon size={16} />
                      </Button>
                    )}
                  </div>
                  
                  {/* Tabs Component */}
                  <Tabs 
                    value={viewMode} 
                    onValueChange={(value) => setViewMode(value as 'chat' | 'editor')}
                    className="w-fit"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="chat" className="flex items-center gap-2">
                        <MessageIcon size={16} />
                        <span className="text-sm font-medium">Chat</span>
                      </TabsTrigger>
                      <TabsTrigger value="editor" className="flex items-center gap-2">
                        <PenIcon size={16} />
                        <span className="text-sm font-medium">Edit</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div></div> {/* Empty div for spacing */}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden">
                  {viewMode === 'chat' ? (
                    <div className="flex flex-col h-full justify-between">
                      <ArtifactMessages
                        chatId={chatId}
                        status={status}
                        votes={votes}
                        messages={messages}
                        setMessages={setMessages}
                        regenerate={regenerate}
                        isReadonly={isReadonly}
                        artifactStatus={artifact.status}
                      />

                      <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
                        <MultimodalInput
                          chatId={chatId}
                          input={input}
                          setInput={setInput}
                          status={status}
                          stop={stop}
                          attachments={attachments}
                          setAttachments={setAttachments}
                          messages={messages}
                          sendMessage={sendMessage}
                          className="bg-white dark:bg-white"
                          setMessages={setMessages}
                          selectedVisibilityType={selectedVisibilityType}
                          isArtifactContext={true}
                          artifactKind={artifact.kind}
                        />
                      </form>
                    </div>
                  ) : (
                    <div className="h-full overflow-hidden">
                      {/* Debug LinkedIn hooks in artifact */}
                      {(() => {
                        console.log('[artifact.tsx] LinkedIn hooks before passing to editor:', JSON.stringify(artifact.linkedInHooks));
                        console.log('[artifact.tsx] LinkedIn hooks length:', artifact.linkedInHooks?.length);
                        return null;
                      })()}
                      <LinkedInPostEditor
                        content={isCurrentVersion ? getTextContentFromArtifact(artifact.content) : getTextContentFromArtifact(getDocumentContentById(currentVersionIndex))}
                        onContentChange={handleEditorContentChange}
                        onToggleView={toggleViewMode}
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="fixed bg-white h-dvh flex flex-col overflow-y-scroll"
            initial={
              isMobile
                ? {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
                : {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
            }
            animate={
              isMobile
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : 'calc(100dvw)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
                : {
                    opacity: 1,
                    x: windowWidth ? windowWidth * 0.4 : 'calc(40dvw)',
                    y: 0,
                    height: windowHeight,
                    width: windowWidth
                      ? windowWidth * 0.6
                      : 'calc(60dvw)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
            }
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: 'spring',
                stiffness: 600,
                damping: 30,
              },
            }}
          >
            {/* Hide header for LinkedIn posts as it's now integrated into the preview */}
            {!isLinkedInPost && (
              <div className="p-2 flex flex-row justify-between items-start">
                <div className="flex flex-row gap-4 items-start">
                  <ArtifactCloseButton />

                  <div className="flex flex-col">
                    <div className="font-medium">{artifact.title}</div>

                    {isContentDirty ? (
                      <div className="text-sm text-muted-foreground">
                        Saving changes...
                      </div>
                    ) : document ? (
                      <div className="text-sm text-muted-foreground">
                        {`Updated ${formatDistance(
                          new Date(document.createdAt),
                          new Date(),
                          {
                            addSuffix: true,
                          },
                        )}`}
                      </div>
                    ) : (
                      <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
                    )}
                  </div>
                </div>

                <ArtifactActions
                  artifact={artifact}
                  currentVersionIndex={currentVersionIndex}
                  handleVersionChange={handleVersionChange}
                  isCurrentVersion={isCurrentVersion}
                  mode={mode}
                  metadata={metadata}
                  setMetadata={setMetadata}
                />
              </div>
            )}

            <div className="bg-white h-full overflow-y-scroll !max-w-full items-center">
              <artifactDefinition.content
                title={artifact.title}
                content={
                  isCurrentVersion
                    ? artifact.content
                    : getDocumentContentById(currentVersionIndex)
                }
                mode={mode}
                status={artifact.status}
                currentVersionIndex={currentVersionIndex}
                suggestions={[]}
                onSaveContent={saveContent}
                isInline={false}
                isCurrentVersion={isCurrentVersion}
                getDocumentContentById={getDocumentContentById}
                isLoading={isDocumentsFetching && !artifact.content}
                metadata={metadata}
                setMetadata={setMetadata}
                user={user}
                artifact={artifact}
                document={document}
                isContentDirty={isContentDirty}
                handleVersionChange={handleVersionChange}
              />
            </div>

            <AnimatePresence>
              {!isCurrentVersion && (
                <VersionFooter
                  currentVersionIndex={currentVersionIndex}
                  documents={documents}
                  handleVersionChange={handleVersionChange}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.input !== nextProps.input) return false;
  if (!equal(prevProps.messages, nextProps.messages.length)) return false;
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
    return false;

  return true;
});
