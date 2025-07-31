import { Artifact } from '@/components/create-artifact';
import { DiffView } from '@/components/diffview';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { LinkedInPostPreview } from '@/components/linkedin-post-preview';
import { LinkedInPublishModal } from '@/components/linkedin-publish-modal';
import { SchedulePostModal } from '@/components/schedule-post-modal';

import {
  CopyIcon,
  MessageIcon,
  PenIcon,
  RedoIcon,
  UndoIcon,
} from '@/components/icons';
import type { Suggestion } from '@/lib/db/schema';
import { toast } from 'sonner';
import { getSuggestions } from '../actions';
import React, { useState, } from 'react';

interface TextArtifactMetadata {
  suggestions: Array<Suggestion>;
}

// Create a separate component that can use hooks
function TextArtifactContent({
  mode,
  status,
  content,
  title,
  isCurrentVersion,
  currentVersionIndex,
  onSaveContent,
  getDocumentContentById,
  isLoading,
  metadata,
  user,
  artifact,
  document,
  isContentDirty,
  handleVersionChange,
  setMetadata,
}: any) {
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('desktop');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ url: string; name: string }>>([]);
  const [parsedTextContent, setParsedTextContent] = useState<string>(content);

  // Parse content to extract text and all media when content changes
  React.useEffect(() => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        setParsedTextContent(parsed.text || content);
        setUploadedImages(parsed.images || []);
        setUploadedVideos(parsed.videos || []);
        setUploadedDocuments(parsed.documents || []);
      } else {
        // Fallback for old format or plain text
        setParsedTextContent(content);
        setUploadedImages([]);
        setUploadedVideos([]);
        setUploadedDocuments([]);
      }
    } catch {
      // Content is not JSON, treat as plain text
      setParsedTextContent(content);
      setUploadedImages([]);
      setUploadedVideos([]);
      setUploadedDocuments([]);
    }
  }, [content]);

  const handleToggleDevice = (deviceType: 'mobile' | 'desktop') => {
    setDeviceType(deviceType);
  };

  const handleToggleCollapsed = () => {
    setIsCollapsed(prev => !prev);
  };

  const handleClosePublishModal = () => {
    setIsPublishModalOpen(false);
  };

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false);
  };

  // Helper to save content with all media
  const saveContentWithAllMedia = (textContent: string, images: string[], videos: string[], documents: Array<{ url: string; name: string }>) => {
    if (typeof onSaveContent === 'function') {
      const contentData = {
        text: textContent,
        images: images,
        videos: videos,
        documents: documents
      };
      onSaveContent(JSON.stringify(contentData), false); // Don't debounce for immediate save
    }
  };

  // Save images whenever they change
  const handleImagesChange = (newImages: string[]) => {
    setUploadedImages(newImages);
    saveContentWithAllMedia(parsedTextContent, newImages, uploadedVideos, uploadedDocuments);
  };

  // Save videos whenever they change
  const handleVideosChange = (newVideos: string[]) => {
    setUploadedVideos(newVideos);
    saveContentWithAllMedia(parsedTextContent, uploadedImages, newVideos, uploadedDocuments);
  };

  // Save documents whenever they change
  const handleDocumentsChange = (newDocuments: Array<{ url: string; name: string }>) => {
    setUploadedDocuments(newDocuments);
    saveContentWithAllMedia(parsedTextContent, uploadedImages, uploadedVideos, newDocuments);
  };

  // Save text content when it changes (from editing in preview)
  const handleTextContentChange = (newTextContent: string) => {
    setParsedTextContent(newTextContent);
    saveContentWithAllMedia(newTextContent, uploadedImages, uploadedVideos, uploadedDocuments);
  };

  if (isLoading) {
    return <DocumentSkeleton artifactKind="text" />;
  }

  if (mode === 'diff') {
    const oldContent = getDocumentContentById(currentVersionIndex - 1);
    const newContent = getDocumentContentById(currentVersionIndex);

    return <DiffView oldContent={oldContent} newContent={newContent} />;
  }

  // All content is LinkedIn posts now
  // Construct user profile from Clerk user data
  const userProfile = user ? {
    fullName: user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.fullName || user.firstName || 'User',
    profileImage: user.imageUrl
  } : {
    fullName: 'User',
    profileImage: undefined
  };

  return (
    <>
      <LinkedInPostPreview
        content={parsedTextContent}
        userProfile={userProfile}
        deviceType={deviceType}
        onToggleDevice={handleToggleDevice}
        isCollapsed={isCollapsed}
        onToggleCollapsed={handleToggleCollapsed}
        artifact={artifact}
        document={document}
        isContentDirty={isContentDirty}
        currentVersionIndex={currentVersionIndex}
        handleVersionChange={handleVersionChange}
        isCurrentVersion={isCurrentVersion}
        mode={mode}
        metadata={metadata}
        setMetadata={setMetadata}
        uploadedImages={uploadedImages}
        onImagesChange={handleImagesChange}
        uploadedVideos={uploadedVideos}
        onVideosChange={handleVideosChange}
        uploadedDocuments={uploadedDocuments}
        onDocumentsChange={handleDocumentsChange}
        onTextChange={handleTextContentChange}
        showScheduleButton={true}
        onScheduleClick={() => setIsScheduleModalOpen(true)}
        onShareClick={() => setIsPublishModalOpen(true)}
      />
      
      <LinkedInPublishModal
        isOpen={isPublishModalOpen}
        onClose={handleClosePublishModal}
        content={parsedTextContent}
        documentId={document?.id}
        userProfile={userProfile}
        uploadedImages={uploadedImages}
        uploadedVideos={uploadedVideos}
        uploadedDocuments={uploadedDocuments}
      />
      
      <SchedulePostModal
        isOpen={isScheduleModalOpen}
        onClose={handleCloseScheduleModal}
        content={parsedTextContent}
        documentId={document?.id}
        userProfile={userProfile}
        uploadedImages={uploadedImages}
        uploadedVideos={uploadedVideos}
        uploadedDocuments={uploadedDocuments}
        scheduledAt={document?.scheduledAt}
        status={document?.status}
      />
      </>
  );
}

export const textArtifact = new Artifact<'text', TextArtifactMetadata>({
  kind: 'text',
  description: 'Useful for creating and editing LinkedIn posts.',
  initialize: async ({ documentId, setMetadata }: { documentId: string; setMetadata: (metadata: TextArtifactMetadata) => void }) => {
    const suggestions = await getSuggestions({ documentId });

    setMetadata({
      suggestions,
    });
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'data-suggestion') {
      setMetadata((metadata) => {
        return {
          suggestions: [...metadata.suggestions, streamPart.data],
        };
      });
    }

    if (streamPart.type === 'data-textDelta') {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: draftArtifact.content + streamPart.data,
          isVisible:
            draftArtifact.status === 'streaming' &&
            draftArtifact.content.length > 400 &&
            draftArtifact.content.length < 450
              ? true
              : draftArtifact.isVisible,
          status: 'streaming',
        };
      });
    }


  },
  content: (props) => <TextArtifactContent {...props} />,
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion, currentVersionIndex }) => {
        // Check if we're at the latest version by using both flags
        // This ensures the button is enabled when viewing previous versions
        return isCurrentVersion === true;
      }
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy to clipboard',
      onClick: ({ content }) => {
        // Extract text content from JSON structure
        let textToCopy = content;
        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object' && 'text' in parsed && typeof parsed.text === 'string') {
            textToCopy = parsed.text;
          }
        } catch {
          // Content is not JSON, use as-is
          textToCopy = content;
        }
        
        // Strip HTML tags and convert to plain text while preserving formatting
        const stripHtml = (html: string) => {
          // Handle the specific pattern of content paragraphs and empty paragraphs
          let processedHtml = html
            // First, handle empty paragraphs (they represent single line breaks)
            .replace(/<p[^>]*>\s*<\/p>/gi, '\n')
            // Handle content paragraphs - extract text and add line break
            .replace(/<p[^>]*>([^<]+)<\/p>/gi, '$1\n')
            // Convert br tags to line breaks
            .replace(/<br[^>]*>/gi, '\n')
            // Convert div tags to line breaks  
            .replace(/<\/div>\s*<div[^>]*>/gi, '\n')
            .replace(/<div[^>]*>/gi, '')
            .replace(/<\/div>/gi, '\n')
            // Convert list items to lines
            .replace(/<\/li>\s*<li[^>]*>/gi, '\n')
            .replace(/<li[^>]*>/gi, '')
            .replace(/<\/li>/gi, '\n')
            // Remove list containers
            .replace(/<\/?[uo]l[^>]*>/gi, '\n')
            // Convert headings to text with line breaks
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<h[1-6][^>]*>/gi, '')
            // Remove any remaining HTML tags
            .replace(/<[^>]*>/g, '');
          
          // Clean up line breaks - preserve single and double breaks appropriately
          return processedHtml
            .replace(/\n{3,}/g, '\n\n') // Convert 3+ line breaks to double
            .replace(/^\s+|\s+$/g, '') // Trim start and end
            .replace(/[ \t]+/g, ' ') // Normalize horizontal spaces
            .replace(/\n /g, '\n') // Remove spaces after line breaks
            .replace(/ \n/g, '\n'); // Remove spaces before line breaks
        };
        
        // Check if content contains HTML tags
        const hasHtmlTags = /<[^>]*>/.test(textToCopy);
        
        const finalText = hasHtmlTags ? stripHtml(textToCopy) : textToCopy;
        
        navigator.clipboard.writeText(finalText);
        toast.success('Copied to clipboard!');
      },
    },
  ],
  toolbar: [
    {
      icon: <PenIcon />,
      description: 'Add final polish',
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Please add final polish and check for grammar, add section titles for better structure, and ensure everything reads smoothly.',
            },
          ],
        });
      },
    },
    {
      icon: <MessageIcon />,
      description: 'Request suggestions',
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: 'user',
          parts: [
            {
              type: 'text',
              text: 'Please add suggestions you have that could improve the writing.',
            },
          ],
        });
      },
    },
  ],
});
