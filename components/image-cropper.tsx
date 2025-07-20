'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Button } from './ui/button';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropper({ 
  src, 
  onCropComplete, 
  onCancel, 
  aspectRatio = 1.91 // LinkedIn post aspect ratio (1200x630)
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }, [aspectRatio]);

  // Update preview canvas when crop changes
  useEffect(() => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      const image = imgRef.current;
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }
  }, [completedCrop]);

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.95);
    });
  }, [completedCrop]);

  const handleCropComplete = async () => {
    try {
      const croppedImageBlob = await getCroppedImg();
      if (croppedImageBlob) {
        onCropComplete(croppedImageBlob);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Left side - Image cropper */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full h-full flex items-center justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-w-full max-h-full"
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={src}
              style={{ maxHeight: '100%', maxWidth: '100%' }}
              onLoad={onImageLoad}
              className="rounded-lg"
            />
          </ReactCrop>
        </div>
      </div>

      {/* Right side - Preview and controls */}
      <div className="w-[377px] bg-muted/30 flex flex-col gap-4 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">1 of 1</p>
          <Button variant="outline" size="sm" className="text-xs">
            Alt Text
          </Button>
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col">
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Preview</h4>
            <div className="border-2 border-primary rounded-md overflow-hidden bg-white flex items-center justify-center" style={{ width: '162px', height: '85px' }}>
              {completedCrop ? (
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div className="text-xs text-muted-foreground">Crop preview</div>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Recommended size: 1200 x 630 pixels</p>
            <p>Aspect ratio: 1.91:1</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleCropComplete}
            className="flex-1"
            disabled={!completedCrop}
          >
            Apply Crop
          </Button>
        </div>
      </div>

      {/* Hidden canvas for generating cropped image */}
      <canvas
        ref={previewCanvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
} 