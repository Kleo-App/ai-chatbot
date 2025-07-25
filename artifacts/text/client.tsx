import { Artifact } from '@/components/create-artifact';
import { DiffView } from '@/components/diffview';
import { DocumentSkeleton } from '@/components/document-skeleton';
import { LinkedInPostPreview } from '@/components/linkedin-post-preview';
import { LinkedInPublishModal } from '@/components/linkedin-publish-modal';

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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [parsedTextContent, setParsedTextContent] = useState<string>(content);

  // Parse content to extract text and images when content changes
  React.useEffect(() => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && 'text' in parsed && 'images' in parsed) {
        setParsedTextContent(parsed.text);
        setUploadedImages(parsed.images || []);
      } else {
        // Fallback for old format or plain text
        setParsedTextContent(content);
        setUploadedImages([]);
      }
    } catch {
      // Content is not JSON, treat as plain text
      setParsedTextContent(content);
      setUploadedImages([]);
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

  // Helper to save content with images
  const saveContentWithImages = (textContent: string, images: string[]) => {
    if (typeof onSaveContent === 'function') {
      const contentData = {
        text: textContent,
        images: images
      };
      onSaveContent(JSON.stringify(contentData), false); // Don't debounce for immediate save
    }
  };

  // Save images whenever they change
  const handleImagesChange = (newImages: string[]) => {
    setUploadedImages(newImages);
    saveContentWithImages(parsedTextContent, newImages);
  };

  // Save text content when it changes (from editing in preview)
  const handleTextContentChange = (newTextContent: string) => {
    setParsedTextContent(newTextContent);
    saveContentWithImages(newTextContent, uploadedImages);
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
        onTextChange={handleTextContentChange}
        onShareClick={() => setIsPublishModalOpen(true)}
      />
      
      <LinkedInPublishModal
        isOpen={isPublishModalOpen}
        onClose={handleClosePublishModal}
        content={parsedTextContent}
        userProfile={userProfile}
        uploadedImages={uploadedImages}
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
        navigator.clipboard.writeText(content);
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
