import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { type NextRequest, NextResponse } from 'next/server';

interface ClientPayload {
  type?: string;
  size?: number;
  originalName?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string, clientPayload: string | null, multipart: boolean) => {
        // Parse the client payload
        let parsedPayload: ClientPayload = {};
        if (clientPayload) {
          try {
            parsedPayload = JSON.parse(clientPayload);
          } catch (error) {
            console.error('Failed to parse client payload:', error);
          }
        }

        // Validate file type
        const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        const supportedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/webm'];
        const supportedDocumentTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        const allSupportedTypes = [...supportedImageTypes, ...supportedVideoTypes, ...supportedDocumentTypes];

        const contentType = parsedPayload?.type;
        if (!contentType || !allSupportedTypes.includes(contentType)) {
          throw new Error('Unsupported file type. Please upload images (JPEG, PNG, GIF), videos (MP4, MOV, AVI, WebM), or documents (PDF, PPT, DOC).');
        }

        // Validate file size based on type
        const maxImageSize = 36 * 1024 * 1024; // 36MB for images (LinkedIn limit)
        const maxVideoSize = 5 * 1024 * 1024 * 1024; // 5GB for videos (LinkedIn recommendation)
        const maxDocumentSize = 100 * 1024 * 1024; // 100MB for documents (LinkedIn limit)

        let maxSize: number;
        let mediaType: string;

        if (supportedImageTypes.includes(contentType)) {
          maxSize = maxImageSize;
          mediaType = 'image';
        } else if (supportedVideoTypes.includes(contentType)) {
          maxSize = maxVideoSize;
          mediaType = 'video';
        } else {
          maxSize = maxDocumentSize;
          mediaType = 'document';
        }

        const fileSize = parsedPayload?.size;
        if (fileSize && fileSize > maxSize) {
          const maxSizeMB = Math.round(maxSize / (1024 * 1024));
          throw new Error(`File too large. Maximum size for ${mediaType}s is ${maxSizeMB}MB.`);
        }

        // Generate a unique filename
        const originalName = parsedPayload?.originalName || 'file';
        const fileExtension = originalName.split('.').pop();
        const filename = `linkedin-${mediaType}-${Date.now()}.${fileExtension}`;

        return {
          allowedContentTypes: [contentType],
          maximumSizeInBytes: maxSize,
          tokenPayload: JSON.stringify({
            mediaType,
            originalName,
            filename,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Parse the token payload to get metadata
        const payload = JSON.parse(tokenPayload || '{}');
        
        console.log('Client upload completed:', {
          blobUrl: blob.url,
          mediaType: payload.mediaType,
          originalName: payload.originalName,
          filename: payload.filename,
        });

        // You can add any post-upload logic here
        // like saving to database, sending notifications, etc.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Client upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 400 }
    );
  }
}