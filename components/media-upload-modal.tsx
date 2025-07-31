'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ImageCropper } from './image-cropper';
import { ImageIcon, VideoIcon, FileTextIcon, RotateCcw, X } from 'lucide-react';

interface MediaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaUploaded?: (mediaUrl: string, mediaType: 'image' | 'video' | 'document', originalName?: string) => void;
}

interface UploadedMedia {
  url: string;
  filename: string;
  mediaType: 'image' | 'video' | 'document';
  fileSize: number;
  originalName: string;
}

export function MediaUploadModal({ open, onOpenChange, onMediaUploaded }: MediaUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string | null>(null);
  const [currentMediaType, setCurrentMediaType] = useState<'image' | 'video' | 'document' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0];
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer.files?.[0]) {
      const file = event.dataTransfer.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const mediaType = determineMediaType(file);
    if (!mediaType) {
      alert('Unsupported file type. Please upload images (JPEG, PNG, GIF), videos (MP4), or documents (PDF).');
      return;
    }

    setSelectedFile(file);
    setCurrentMediaType(mediaType);
    
    if (mediaType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCurrentImageSrc(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else if (mediaType === 'video') {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCurrentVideoSrc(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else if (mediaType === 'document') {
      // Auto-upload PDFs immediately after showing preview
      setTimeout(() => {
        uploadFile(file);
      }, 100); // Small delay to show the upload UI
    }
  };

  const determineMediaType = (file: File): 'image' | 'video' | 'document' | null => {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/webm'];
    const documentTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', 
      'application/vnd.ms-powerpoint', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (imageTypes.includes(file.type)) return 'image';
    if (videoTypes.includes(file.type)) return 'video';
    if (documentTypes.includes(file.type)) return 'document';
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data: UploadedMedia = await response.json();
      
      if (onMediaUploaded) {
        onMediaUploaded(data.url, data.mediaType, data.originalName);
      }

      handleCancel();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadCroppedImage = async (croppedBlob: Blob) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      const croppedFile = new File([croppedBlob], 'cropped-image.jpg', { 
        type: 'image/jpeg' 
      });
      formData.append('file', croppedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data: UploadedMedia = await response.json();
      
      if (onMediaUploaded) {
        onMediaUploaded(data.url, data.mediaType, data.originalName);
      }

      handleCancel();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    uploadCroppedImage(croppedBlob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setCurrentImageSrc(null);
    setCurrentVideoSrc(null);
    setCurrentMediaType(null);
    setShowCropper(false);
    onOpenChange(false);
  };

  const handleStartOver = () => {
    setSelectedFile(null);
    setCurrentImageSrc(null);
    setCurrentVideoSrc(null);
    setCurrentMediaType(null);
  };

  const handleUploadFile = () => {
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  };

  const handleCropImage = () => {
    if (currentImageSrc) {
      setShowCropper(true);
    }
  };

  const renderFilePreview = () => {
    if (!selectedFile || !currentMediaType) return null;

    switch (currentMediaType) {
      case 'document':
        return (
          <div className="h-full flex flex-col">
            {/* Document Upload Progress */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-amber-50/50 to-orange-50/30">
              <div className="max-w-md w-full text-center">
                <div className="bg-gradient-to-br from-amber-100/80 to-orange-100/60 backdrop-blur-sm rounded-2xl p-12 mb-6 border border-amber-200/50 shadow-xl">
                  <div className="bg-gradient-to-br from-amber-200 to-orange-200 rounded-full p-6 w-fit mx-auto mb-4 shadow-lg">
                    <FileTextIcon size={48} className="text-amber-700" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {isUploading ? 'Uploading Document...' : 'Document Ready'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isUploading 
                      ? 'Your PDF is being uploaded and will create a carousel post on LinkedIn.'
                      : 'This will create a carousel post on LinkedIn with swipeable pages'
                    }
                  </p>
                  {isUploading && (
                    <div className="mt-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* File Info */}
            <div className="bg-card/80 backdrop-blur-sm border-t border-border p-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-amber-100 to-orange-50 rounded-lg p-2 shadow-sm">
                      <FileTextIcon size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{selectedFile.name}</h3>
                      <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="h-full flex flex-col">
            {/* Image Preview */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-50/30 to-green-50/20">
              <div className="relative max-w-2xl w-full">
                <img
                  src={currentImageSrc!}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain rounded-xl shadow-2xl border border-gray-200"
                />
              </div>
            </div>
            
            {/* File Info & Actions */}
            <div className="bg-card/80 backdrop-blur-sm border-t border-border p-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-100 to-green-50 rounded-lg p-2 shadow-sm">
                      <ImageIcon size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{selectedFile.name}</h3>
                      <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartOver}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    Choose Different
                  </Button>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleUploadFile}
                    disabled={isUploading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    {isUploading ? 'Uploading...' : 'Use Full Image'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleCropImage}
                    disabled={isUploading}
                    className="flex-1 border-border text-foreground hover:bg-accent"
                  >
                    Crop Image
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="h-full flex flex-col">
            {/* Video Preview */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-violet-50/30 to-purple-50/20">
              <div className="relative max-w-2xl w-full">
                <video
                  src={currentVideoSrc!}
                  controls
                  className="w-full h-auto max-h-96 rounded-xl shadow-2xl border border-gray-200"
                />
              </div>
            </div>
            
            {/* File Info & Actions */}
            <div className="bg-card/80 backdrop-blur-sm border-t border-border p-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-violet-100 to-purple-50 rounded-lg p-2 shadow-sm">
                      <VideoIcon size={20} className="text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{selectedFile.name}</h3>
                      <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartOver}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    Choose Different
                  </Button>
                </div>
                
                <Button 
                  onClick={handleUploadFile}
                  disabled={isUploading}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                >
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderUploadForm = () => (
    <form className="flex h-full w-full max-w-full flex-col overflow-hidden px-3 sm:px-6">
      <div 
        className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-dashed hover:bg-gray-100 dark:hover:bg-content2"
        role="presentation"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          accept="image/*,.png,.jpg,.jpeg,.gif,application/pdf,.pdf,video/mp4,.mp4"
          tabIndex={-1}
          type="file"
          onChange={handleFileSelect}
          className="absolute w-px h-px overflow-hidden border-0 -m-px p-0"
          style={{ 
            border: 0, 
            clip: 'rect(0,0,0,0)', 
            clipPath: 'inset(50%)', 
            margin: '-1px', 
            overflow: 'hidden', 
            whiteSpace: 'nowrap' 
          }}
        />
        <div className="space-y-2 text-center">
          <div className="flex cursor-pointer flex-col items-center">
            <ImageIcon className="h-12 w-12" />
            <span className="text-lg font-medium">Choose your media</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Upload images, videos, or documents to enhance your post.
          </p>
        </div>
      </div>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] max-h-[90vh] w-full flex flex-col overflow-hidden p-0">
        {/* Header */}
        <header className="flex py-4 px-6 flex-initial text-large font-semibold border-b border-divider">
          <DialogTitle className="text-foreground text-lg font-medium tracking-tight">
            Add images, videos or documents to your post
          </DialogTitle>
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {showCropper && currentImageSrc ? (
            // Show image cropper
            <div className="h-full p-6 bg-background">
              <ImageCropper
                src={currentImageSrc}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
              />
            </div>
          ) : (
            // Show file upload area or preview
            <div className="h-full">
              {selectedFile && currentMediaType ? renderFilePreview() : renderUploadForm()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}