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
            // Don't automatically show cropper - let user choose
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
            // Don't automatically show cropper - let user choose
          }
        };
        reader.readAsDataURL(file);
      }
      
      setSelectedFiles([file]);
    }
  };

  // Function to optimize image for LinkedIn without cropping
  const optimizeImageForLinkedIn = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const { width, height } = img;
        const aspectRatio = width / height;

        let targetWidth: number;
        let targetHeight: number;

        // Determine optimal LinkedIn dimensions based on aspect ratio
        if (aspectRatio > 1.5) {
          // Wide landscape - use LinkedIn landscape format
          targetWidth = 1200;
          targetHeight = 627;
        } else if (aspectRatio < 0.7) {
          // Tall portrait - use LinkedIn portrait format
          targetWidth = 627;
          targetHeight = 1200;
        } else {
          // Square-ish - use LinkedIn square format
          targetWidth = 1080;
          targetHeight = 1080;
        }

        // Calculate scaling to fit within target dimensions while maintaining aspect ratio
        const scaleWidth = targetWidth / width;
        const scaleHeight = targetHeight / height;
        const scale = Math.min(scaleWidth, scaleHeight);

        const finalWidth = Math.round(width * scale);
        const finalHeight = Math.round(height * scale);

        canvas.width = finalWidth;
        canvas.height = finalHeight;

        // Enable high-quality scaling
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw the scaled image
          ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            }
          }, 'image/jpeg', 0.95);
        }
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const uploadOptimizedImage = async (file: File) => {
    setIsUploading(true);
    try {
      const optimizedBlob = await optimizeImageForLinkedIn(file);
      const optimizedFile = new File([optimizedBlob], 'optimized-image.jpg', { 
        type: 'image/jpeg' 
      });

      const formData = new FormData();
      formData.append('file', optimizedFile);

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
    // Don't reset other state so user can still choose "Use Full Image"
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setCurrentImageSrc(null);
    setShowCropper(false);
    onOpenChange(false);
  };

  const handleUseFullImage = () => {
    if (selectedFiles.length > 0) {
      uploadOptimizedImage(selectedFiles[0]);
    }
  };

  const handleCropImage = () => {
    setShowCropper(true);
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
            // Show file upload area or image preview with options
            <>
              <div className="flex-1 p-6">
                {currentImageSrc && selectedFiles.length > 0 ? (
                  // Show image preview with options
                  <div className="flex flex-col h-full">
                    <div className="flex-1 flex items-center justify-center mb-6">
                      <div className="max-w-2xl max-h-96 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentImageSrc}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">Choose how to use your image</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          You can use the full image optimized for LinkedIn, or crop it for a specific composition
                        </p>
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button 
                          onClick={handleUseFullImage}
                          disabled={isUploading}
                          className="flex-1 max-w-48"
                        >
                          {isUploading ? 'Uploading...' : 'Use Full Image'}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleCropImage}
                          disabled={isUploading}
                          className="flex-1 max-w-48"
                        >
                          Crop Image
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        <p><strong>Use Full Image:</strong> Automatically optimizes for LinkedIn&apos;s recommended sizes</p>
                        <p><strong>Crop Image:</strong> Manually adjust composition with 1.91:1 aspect ratio</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show file upload area
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
                        Upload an image for your LinkedIn post. Choose to use the full image or crop it for optimal composition.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {!currentImageSrc && (
                <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              )}

              {currentImageSrc && (
                <div className="flex items-center justify-between gap-2 border-t px-6 py-4">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setCurrentImageSrc(null);
                      setSelectedFiles([]);
                    }}>
                      Choose Different Image
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 