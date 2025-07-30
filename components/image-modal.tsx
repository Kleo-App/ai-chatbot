'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ src, alt, isOpen, onClose }: ImageModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const zoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5)); // Max zoom 5x
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5)); // Min zoom 0.5x
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset zoom and position when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
        <DialogTitle className="sr-only">
          View larger image: {alt}
        </DialogTitle>
        <div className="relative bg-black/90 rounded-lg overflow-hidden">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 size-8 p-0 bg-black/50 hover:bg-black/70 text-white hover:text-white border-none"
          >
            <X className="size-4 text-white" />
          </Button>

          {/* Zoom controls */}
          {imageLoaded && (
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                className="size-8 p-0 bg-black/50 hover:bg-black/70 text-white hover:text-white border-none"
                disabled={zoom >= 5}
              >
                <ZoomIn className="size-4 text-white" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                className="size-8 p-0 bg-black/50 hover:bg-black/70 text-white hover:text-white border-none"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="size-4 text-white" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="size-8 p-0 bg-black/50 hover:bg-black/70 text-white hover:text-white border-none"
                disabled={zoom === 1 && position.x === 0 && position.y === 0}
              >
                <RotateCcw className="size-4 text-white" />
              </Button>
            </div>
          )}

          {/* Zoom level indicator */}
          {imageLoaded && zoom !== 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {Math.round(zoom * 100)}%
            </div>
          )}

          {/* Image container */}
          <div 
            className="relative overflow-hidden"
            style={{ 
              height: '80vh',
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full size-8 border-b-2 border-white"></div>
              </div>
            )}
            <Image
              src={src}
              alt={alt}
              fill
              className={`size-full object-contain transition-all duration-200 select-none ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transformOrigin: 'center center'
              }}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                console.error('Failed to load image:', src);
                onClose();
              }}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>

          {/* Image title and instructions */}
          {imageLoaded && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-sm font-medium mb-1">{alt}</p>
              {zoom > 1 && (
                <p className="text-white/70 text-xs">
                  Drag to pan • Use zoom controls to adjust size
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 