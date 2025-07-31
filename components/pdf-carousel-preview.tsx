'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for react-pdf to avoid SSR issues
const PDFDocument = dynamic(
  () => import('react-pdf').then(mod => {
    // Set up the PDF.js worker using local file (most reliable)
    mod.pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    return mod.Document;
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading PDF viewer...</p>
        </div>
      </div>
    )
  }
);

const PDFPage = dynamic(
  () => import('react-pdf').then(mod => mod.Page),
  { ssr: false }
);

interface PDFCarouselPreviewProps {
  documentUrl: string;
  documentName: string;
  isEditingTitle: boolean;
  editedTitle: string;
  onTitleSave: () => void;
  onTitleCancel: () => void;
  onEditStart: () => void;
  onTitleChange: (title: string) => void;
  onRemove: () => void;
  isModal?: boolean;
}

export default function PDFCarouselPreview({
  documentUrl,
  documentName,
  isEditingTitle,
  editedTitle,
  onTitleSave,
  onTitleCancel,
  onEditStart,
  onTitleChange,
  onRemove,
  isModal = false,
}: PDFCarouselPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [scale, setScale] = useState<number>(0.6);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const nextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Document Title Bar */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="w-full text-sm font-medium text-gray-900 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document title..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onTitleSave();
                    if (e.key === 'Escape') onTitleCancel();
                  }}
                />
                <div className="flex gap-1">
                  <button
                    onClick={onTitleSave}
                    className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={onTitleCancel}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{documentName}</h3>
                {!isModal && (
                  <button
                    onClick={onEditStart}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
                    title="Edit title"
                  >
                    <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Remove button */}
          {!isModal && (
            <button
              onClick={onRemove}
              className="bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors ml-2 flex-shrink-0"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">Document carousel • {numPages} pages</p>
      </div>

      {/* Carousel Player Area */}
      <div 
        className="relative bg-gray-100 aspect-[4/5] min-h-[400px] flex items-center justify-center overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* PDF Document */}
        {isClient ? (
          <PDFDocument
            file={documentUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error('Failed to load PDF:', error);
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading PDF...</p>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <svg className="size-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">Unable to load PDF</p>
                  <p className="text-xs text-gray-400 mt-1">Please try refreshing or uploading again</p>
                </div>
              </div>
            }
        >
          <PDFPage
            pageNumber={currentPage}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mx-auto"
          />
        </PDFDocument>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="size-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-gray-500">Loading PDF viewer...</p>
            </div>
          </div>
        )}

        {/* Navigation Controls - Appear on Hover */}
        {isHovered && numPages > 1 && (
          <>
            {/* Left Navigation Arrow */}
            <button 
              onClick={prevPage}
              disabled={currentPage <= 1}
              className={`absolute left-3 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-all duration-200 ${
                currentPage <= 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-90 hover:opacity-100'
              }`}
            >
              <svg className="size-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Navigation Arrow */}
            <button 
              onClick={nextPage}
              disabled={currentPage >= numPages}
              className={`absolute right-3 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-all duration-200 ${
                currentPage >= numPages ? 'opacity-30 cursor-not-allowed' : 'opacity-90 hover:opacity-100'
              }`}
            >
              <svg className="size-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Page indicator overlay */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {currentPage} / {numPages}
            </div>
          </>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-blue-600 rounded-r transition-all duration-300" 
          style={{ width: `${(currentPage / numPages) * 100}%` }}
        ></div>
      </div>


    </div>
  );
}