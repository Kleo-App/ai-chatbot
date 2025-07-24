'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ImageCropper } from './image-cropper';

interface MediaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageUploaded?: (imageUrl: string) => void;
}

export function MediaUploadModal({ open, onOpenChange, onImageUploaded }: MediaUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0];
      
      // Only handle images for cropping
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setCurrentImageSrc(e.target.result as string);
            setShowCropper(true);
          }
        };
        reader.readAsDataURL(file);
      }
      
      setSelectedFiles([file]);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer.files?.[0]) {
      const file = event.dataTransfer.files[0];
      
      // Only handle images for cropping
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setCurrentImageSrc(e.target.result as string);
            setShowCropper(true);
          }
        };
        reader.readAsDataURL(file);
      }
      
      setSelectedFiles([file]);
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
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Call the callback with the uploaded image URL
      if (onImageUploaded) {
        onImageUploaded(data.url);
      }

      // Close modal and reset state
      handleCancel();
    } catch (error) {
      console.error('Upload error:', error);
      // Handle error (could show toast notification)
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    uploadCroppedImage(croppedBlob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCurrentImageSrc(null);
    setSelectedFiles([]);
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setCurrentImageSrc(null);
    setShowCropper(false);
    onOpenChange(false);
  };

  const handleContinue = () => {
    // This is now handled by the cropper
    if (selectedFiles.length > 0 && !showCropper) {
      // Show cropper for first file
      const file = selectedFiles[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setCurrentImageSrc(e.target.result as string);
            setShowCropper(true);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0 border-b pb-4">
          <DialogTitle className="text-lg font-medium">
            Upload Image
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {showCropper && currentImageSrc ? (
            // Show image cropper
            <div className="flex-1 overflow-hidden">
              <ImageCropper
                src={currentImageSrc}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
              />
            </div>
          ) : (
            // Show file upload area
            <>
              <div className="flex-1 p-6">
                <div 
                  className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors h-full min-h-[400px]"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*,.png,.jpg,.jpeg,.gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="space-y-4 text-center">
                    <div className="flex flex-col items-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="48" 
                        height="48" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="text-muted-foreground mb-4"
                      >
                        <path d="M12 13v8" />
                        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                        <path d="m8 17 4-4 4 4" />
                      </svg>
                      <span className="text-lg font-medium">
                        {isUploading ? 'Uploading...' : 'Select your image'}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Upload an image to crop and add to your LinkedIn post.
                    </p>
                    {selectedFiles.length > 0 && !showCropper && (
                      <div className="mt-4">
                        <p className="text-sm text-foreground">
                          {selectedFiles[0].name} selected
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleContinue}
                  disabled={selectedFiles.length === 0 || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Continue'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 