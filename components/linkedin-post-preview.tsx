'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { 
  ShareIcon, 
  ImageIcon,
  MonitorIcon,
  SmartphoneIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from './icons';
import { ArtifactActions } from './artifact-actions';
import { MediaUploadModal } from './media-upload-modal';
import { formatDistance } from 'date-fns';
import type { UIArtifact } from './artifact';

interface LinkedInPostPreviewProps {
  content: string;
  userProfile?: {
    fullName?: string;
    profileImage?: string;
  };
  onToggleDevice?: () => void;
  deviceType?: 'mobile' | 'desktop';
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  // Artifact header props
  artifact?: UIArtifact;
  document?: {
    createdAt: Date;
  } | null;
  isContentDirty?: boolean;
  currentVersionIndex?: number;
  handleVersionChange?: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  isCurrentVersion?: boolean;
  mode?: 'edit' | 'diff';
  metadata?: any;
  setMetadata?: any;
  // Media props
  uploadedImages?: string[];
  onImagesChange?: (images: string[]) => void;
  onTextChange?: (text: string) => void;
  // UI control props
  showShareButton?: boolean;
  showHeader?: boolean;
  showDeviceToggle?: boolean;
  // Share modal props
  onShareClick?: () => void;
  isModal?: boolean;
}

export const LinkedInPostPreview = memo(function LinkedInPostPreview({
  content,
  userProfile,
  onToggleDevice,
  deviceType = 'desktop',
  isCollapsed = false,
  onToggleCollapsed,
  // Artifact header props
  artifact,
  document,
  isContentDirty,
  currentVersionIndex,
  handleVersionChange,
  isCurrentVersion,
  mode,
  metadata,
  setMetadata,
  // Media props
  uploadedImages = [],
  onImagesChange,
  onTextChange,
  // UI control props
  showShareButton = true,
  showHeader = true,
  showDeviceToggle = true,
  // Share modal props
  onShareClick,
  isModal = false,
}: LinkedInPostPreviewProps) {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const handleImageUploaded = (imageUrl: string) => {
    const newImages = [...uploadedImages, imageUrl];
    onImagesChange?.(newImages);
  };

  // Format the content to support LinkedIn-style formatting
  const formatContent = (text: string) => {
    // Check if content is HTML (contains tags) or plain text
    const isHTML = /<[^>]*>/.test(text);
    
    if (isHTML) {
      // For HTML content, render directly with safe HTML and apply LinkedIn styling
      return <div 
        className="[&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1"
        dangerouslySetInnerHTML={{ __html: text }} 
      />;
    } else {
      // For plain text, convert newlines to paragraphs with proper styling
      return (
        <div className="[&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1">
          {text
            .split('\n\n') // Split on double newlines for paragraphs
            .map((paragraph, paragraphIndex) => {
              const trimmedParagraph = paragraph.trim();
              if (!trimmedParagraph) return null;
              
              return (
                <p key={paragraphIndex} className="mb-2">
                  {trimmedParagraph
                    .split('\n') // Split remaining single newlines within paragraph
                    .map((line, lineIndex) => (
                      <span key={lineIndex}>
                        {line}
                        {lineIndex < trimmedParagraph.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                </p>
              );
            })
            .filter(Boolean)}
        </div>
      );
    }
  };

  // Truncate content for collapsed view
  const formatCollapsedContent = (text: string) => {
    if (!text) return 'Your LinkedIn post content will appear here...';
    
    return (
      <div className="relative">
        <div 
          className={`overflow-hidden ${deviceType === 'mobile' ? 'pr-10' : 'pr-12'} [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.5',
          }}
        >
          {formatContent(text)}
        </div>
        <div className="absolute bottom-0 right-0 bg-white">
          <button 
            className="text-gray-600 hover:text-gray-800 font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapsed?.();
            }}
          >
            ...more
          </button>
        </div>
      </div>
    );
  };

  const outerClass = isModal 
    ? "relative flex flex-col"
    : "border-divider dark:bg-content2 relative flex flex-col rounded-xl border bg-[#f4f2ee] overflow-hidden min-h-0 h-full";
  return (
    <div className={outerClass}>
      {showHeader && (
        <>
          {/* Consolidated Header */}
          <div className="border-divider bg-content1 z-20 flex h-12 max-w-full flex-wrap items-center justify-between gap-4 border-b px-2 sm:flex-row sm:px-4 md:px-6">
            {/* Left side: title */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-left">
                <div className="font-medium text-sm text-left" title={artifact?.title}>
                  {artifact?.title && artifact.title.length > 40 
                    ? `${artifact.title.substring(0, 40)}...` 
                    : artifact?.title}
                </div>
                {isContentDirty ? (
                  <div className="text-xs text-muted-foreground text-left">Saving changes...</div>
                ) : document ? (
                  <div className="text-xs text-muted-foreground text-left">
                    {`Updated ${formatDistance(new Date(document.createdAt), new Date(), { addSuffix: true })}`}
                  </div>
                ) : null}
              </div>
            </div>



            {/* Right side: Actions and Publish */}
            <div className="flex items-center gap-2">
              {/* Artifact Actions */}
              {artifact && handleVersionChange && (
                <div className="flex items-center gap-1">
                  <ArtifactActions
                    artifact={artifact}
                    currentVersionIndex={currentVersionIndex || 0}
                    handleVersionChange={handleVersionChange}
                    isCurrentVersion={isCurrentVersion || true}
                    mode={mode || 'edit'}
                    metadata={metadata}
                    setMetadata={setMetadata}
                  />
                </div>
              )}
              
              {/* Share button */}
              {showShareButton && (
                <Button 
                  onClick={onShareClick}
                  className="gap-1 bg-primary text-primary-foreground h-8 text-xs"
                >
                  Share
                  <ShareIcon size={14} />
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {/* LinkedIn Post Preview */}
      <div className={isModal ? "" : "flex-1 overflow-y-auto p-6 min-h-0"}>
        <div className="mx-auto max-w-2xl">
          <div className={`bg-white rounded-lg border border-foreground/20 shadow-sm mx-auto ${deviceType === 'mobile' ? 'w-[375px]' : 'w-[552px]'}`}>
            {/* Post Header */}
            <div className="flex flex-row justify-between px-4 pt-3 pb-2">
              <div className="flex flex-row gap-2">
                <div className="relative flex shrink-0 overflow-hidden size-12 rounded-full">
                  {userProfile?.profileImage ? (
                    <Image 
                      className="size-full aspect-square" 
                      alt={userProfile.fullName || 'Profile'} 
                      src={userProfile.profileImage}
                      width={48}
                      height={48}
                    />
                  ) : (
                    <Image 
                      className="size-full aspect-square" 
                      alt={userProfile?.fullName || 'John Doe'} 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
                      width={48}
                      height={48}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-0">
                  <span className="text-sm font-semibold">
                    <span className="text-[#000000E9]">{userProfile?.fullName || 'John Doe'}</span>
                  </span>
                  <span className="text-black/60 flex flex-row items-center text-xs">Just now</span>
                </div>
              </div>
              
              {/* Device selection buttons */}
              {showDeviceToggle && (
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`size-6 p-0 ${deviceType === 'mobile' ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => onToggleDevice?.()}
                  >
                    <SmartphoneIcon size={12} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`size-6 p-0 ${deviceType === 'desktop' ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => onToggleDevice?.()}
                  >
                    <MonitorIcon size={12} />
                  </Button>
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`size-6 p-0 ${isCollapsed ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => onToggleCollapsed?.()}
                    title={isCollapsed ? 'Show full post' : 'Collapse post'}
                  >
                    {isCollapsed ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
                  </Button>
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="relative px-4 pb-4">
              <div className="text-sm leading-relaxed text-left text-[#000000E9] [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1">
                {isCollapsed ? formatCollapsedContent(content) : formatContent(content)}
              </div>
            </div>

            {/* Media Upload Area */}
            {(uploadedImages.length > 0 || !isModal) && (
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {uploadedImages.map((imageUrl, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden">
                      <Image 
                        src={imageUrl} 
                        alt={`Uploaded image ${index + 1}`}
                        className="w-full h-auto max-h-80 object-cover rounded-lg"
                        width={552}
                        height={320}
                      />
                      {!isModal && (
                        <button
                          onClick={() => {
                            const newImages = uploadedImages.filter((_, i) => i !== index);
                            onImagesChange?.(newImages);
                          }}
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                        >
                          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {!isModal && (
                    <div 
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50/50"
                      onClick={() => setIsMediaModalOpen(true)}
                    >
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <ImageIcon size={20} />
                        <span className="text-sm">{uploadedImages.length > 0 ? 'Add another image' : 'Add image'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Post Engagement */}
            <div className="flex flex-row items-center justify-between px-4 pb-2">
              <div className="flex flex-row gap-1">
                <div className="flex flex-row">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="size-4">
                    <g>
                      <path d="M8 0a8 8 0 018 8 8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8z" fill="none" />
                      <circle cx="8" cy="8" r="7" fill="#df704d" />
                      <path d="M7.71 5A2.64 2.64 0 004 8.75l4 4 4-4A2.64 2.64 0 0012 5a2.61 2.61 0 00-1.85-.77h0A2.57 2.57 0 008.3 5l-.3.3z" fill="#fff3f0" stroke="#77280c" fillRule="evenodd" />
                    </g>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="-ml-1 size-4">
                    <g>
                      <path d="M8 0a8 8 0 018 8 8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8z" fill="none" />
                      <circle cx="8" cy="8" r="7" fill="#6dae4f" />
                      <path d="M12.13 9.22a9.19 9.19 0 00-.36-2.32A4.29 4.29 0 0110.44 5c-.16-.53-.27-.72-.74-.73a.74.74 0 00-.65.8c0 .24 0 .49.06.72a11.5 11.5 0 00.58 1.92l-4.5-3.38a.75.75 0 00-1.11.07.73.73 0 00.27 1L6.6 7.1l.59.56L3.62 5a.71.71 0 00-.75-.16.69.69 0 00-.46.61.71.71 0 00.36.67L5 7.77l1.35 1-2.9-2.19a.79.79 0 00-.57-.21.8.8 0 00-.54.28c-.31.4-.06.81.26 1.06L4.85 9.4l1.15.85-2.27-1.7a.74.74 0 00-1.09 0 .76.76 0 00.24 1.09l4.1 3c.6.45 2.07.84 2.72.27" fill="none" stroke="#165209" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    </g>
                  </svg>
                </div>
                <span className="text-black/60 text-xs tracking-tight">{userProfile?.fullName || 'John'} and 12 others</span>
              </div>
              <div>
                <span className="text-black/60 text-xs tracking-tight">3 Comments</span>
              </div>
            </div>

            {/* Post Actions */}
            <div className="border-t border-foreground/10 flex flex-row justify-between px-4 py-2">
              <div className={`flex w-full flex-row justify-evenly ${deviceType === 'mobile' ? 'gap-0' : 'gap-2'}`}>
                <Button variant="ghost" className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground flex-1 ${deviceType === 'mobile' ? 'h-8 p-1' : 'h-10 px-4 py-2'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`${deviceType === 'mobile' ? 'mr-0.5 size-4' : 'mr-1 size-6'} text-black/60`} fill="currentColor">
                    <path d="M19.46 11l-3.91-3.91a7 7 0 01-1.69-2.74l-.49-1.47A2.76 2.76 0 0010.76 1 2.75 2.75 0 008 3.74v1.12a9.19 9.19 0 00.46 2.85L8.89 9H4.12A2.12 2.12 0 002 11.12a2.16 2.16 0 00.92 1.76A2.11 2.11 0 002 14.62a2.14 2.14 0 001.28 2 2 2 0 00-.28 1 2.12 2.12 0 002 2.12v.14A2.12 2.12 0 007.12 22h7.49a8.08 8.08 0 003.58-.84l.31-.16H21V11zM19 19h-1l-.73.37a6.14 6.14 0 01-2.69.63H7.72a1 1 0 01-1-.72l-.25-.87-.85-.41A1 1 0 015 17l.17-1-.76-.74A1 1 0 014.27 14l.66-1.09-.73-1.1a.49.49 0 01.08-.7.48.48 0 01.34-.11h7.05l-1.31-3.92A7 7 0 0110 4.86V3.75a.77.77 0 01.75-.75.75.75 0 01.71.51L12 5a9 9 0 002.13 3.5l4.5 4.5H19z" />
                  </svg>
                  <span className={`text-black/60 leading-4 ${deviceType === 'mobile' ? 'text-xs' : ''}`}>Like</span>
                </Button>
                <Button variant="ghost" className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground flex-1 ${deviceType === 'mobile' ? 'h-8 p-1' : 'h-10 px-4 py-2'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={`${deviceType === 'mobile' ? 'mr-0.5 size-4' : 'mr-1 size-6'} text-black/60`}>
                    <path d="M7 9h10v1H7zm0 4h7v-1H7zm16-2a6.78 6.78 0 01-2.84 5.61L12 22v-4H8A7 7 0 018 4h8a7 7 0 017 7zm-2 0a5 5 0 00-5-5H8a5 5 0 000 10h6v2.28L19 15a4.79 4.79 0 002-4z" />
                  </svg>
                  <span className={`text-black/60 leading-4 ${deviceType === 'mobile' ? 'text-xs' : ''}`}>Comment</span>
                </Button>
                <Button variant="ghost" className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground flex-1 ${deviceType === 'mobile' ? 'h-8 p-1' : 'h-10 px-4 py-2'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`${deviceType === 'mobile' ? 'mr-0.5 size-4' : 'mr-1 size-6'} text-black/60`} fill="currentColor">
                    <path d="M13.96 5H6c-.55 0-1 .45-1 1v10H3V6c0-1.66 1.34-3 3-3h7.96L12 0h2.37L17 4l-2.63 4H12l1.96-3zm5.54 3H19v10c0 .55-.45 1-1 1h-7.96L12 16H9.63L7 20l2.63 4H12l-1.96-3H18c1.66 0 3-1.34 3-3V8h-1.5z" />
                  </svg>
                  <span className={`text-black/60 leading-4 ${deviceType === 'mobile' ? 'text-xs' : ''}`}>Repost</span>
                </Button>
                <Button variant="ghost" className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground flex-1 ${deviceType === 'mobile' ? 'h-8 p-1' : 'h-10 px-4 py-2'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`${deviceType === 'mobile' ? 'mr-0.5 size-4' : 'mr-1 size-6'} text-black/60`} fill="currentColor">
                    <path d="M21 3L0 10l7.66 4.26L16 8l-6.26 8.34L14 24l7-21z" />
                  </svg>
                  <span className={`text-black/60 leading-4 ${deviceType === 'mobile' ? 'text-xs' : ''}`}>Send</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Upload Modal */}
      {!isModal && (
        <MediaUploadModal 
          open={isMediaModalOpen} 
          onOpenChange={setIsMediaModalOpen}
          onImageUploaded={handleImageUploaded}
        />
      )}
    </div>
  );
}); 