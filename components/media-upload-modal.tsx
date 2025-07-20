'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { ImageIcon } from './icons';
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
    if (event.target.files && event.target.files[0]) {
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
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
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
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <DialogTitle className="text-lg font-medium">
            Add images, videos or documents to your post
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-auto">
            <TabsTrigger 
              value="upload" 
              className="border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none px-6 py-3"
            >
              Upload image
            </TabsTrigger>
            <TabsTrigger 
              value="ai-photos" 
              className="border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none px-6 py-3"
            >
              AI Photos
            </TabsTrigger>
            <TabsTrigger 
              value="unsplash" 
              className="border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none px-6 py-3"
            >
              Search Unsplash
            </TabsTrigger>
            <TabsTrigger 
              value="giphy" 
              className="border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none px-6 py-3"
            >
              Search Giphy
            </TabsTrigger>
            <TabsTrigger 
              value="carousel" 
              className="border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none px-6 py-3"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" className="h-5 w-5">
                  <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor">
                    <rect x="3" y="3" width="12" height="12" rx="2" fill="currentColor" fillOpacity="0.3" stroke="none" />
                    <path d="M15.25 8V4.75C15.25 3.645 14.355 2.75 13.25 2.75H10" />
                    <path d="M2.75 10V13.25C2.75 14.355 3.645 15.25 4.75 15.25H8" />
                    <path d="M7 2.75H2.75V7" />
                    <path d="M2.75 2.75L7 7" />
                    <path d="M11 15.25H15.25V11" />
                    <path d="M15.25 15.25L11 11" />
                  </g>
                </svg>
                <span>Carousel</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex-1 flex flex-col overflow-hidden">
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
          </TabsContent>

          <TabsContent value="ai-photos" className="flex-1 p-6">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">AI Photos functionality coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="unsplash" className="flex-1 p-6">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Unsplash search functionality coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="giphy" className="flex-1 p-6">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Giphy search functionality coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="carousel" className="flex-1 p-6">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Carousel functionality coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 