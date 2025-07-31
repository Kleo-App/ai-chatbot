import { put } from '@vercel/blob';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    if (!request.body) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Define supported file types for LinkedIn
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const supportedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/webm'];
    const supportedDocumentTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    const allSupportedTypes = [...supportedImageTypes, ...supportedVideoTypes, ...supportedDocumentTypes];

    // Validate file type
    if (!allSupportedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload images (JPEG, PNG, GIF), videos (MP4, MOV, AVI, WebM), or documents (PDF, PPT, DOC).' 
      }, { status: 400 });
    }

    // Validate file size based on type
    const maxImageSize = 4 * 1024 * 1024; // 4MB for images (server upload limit)
    const maxVideoSize = 4 * 1024 * 1024; // 4MB for videos (server upload limit)
    const maxDocumentSize = 4 * 1024 * 1024; // 4MB for documents (server upload limit - larger documents use client-side upload)

    let maxSize: number;
    let mediaType: string;

    if (supportedImageTypes.includes(file.type)) {
      maxSize = maxImageSize;
      mediaType = 'image';
    } else if (supportedVideoTypes.includes(file.type)) {
      maxSize = maxVideoSize;
      mediaType = 'video';
    } else {
      maxSize = maxDocumentSize;
      mediaType = 'document';
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json({ 
        error: `File too large. Maximum size for ${mediaType}s is ${maxSizeMB}MB.` 
      }, { status: 400 });
    }

    // Generate a unique filename
    const fileExtension = file.name.split('.').pop();
    const filename = `linkedin-${mediaType}-${Date.now()}.${fileExtension}`;

    // Upload to Vercel blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url,
      filename: filename,
      mediaType: mediaType,
      fileSize: file.size,
      originalName: file.name // Added originalName for documents
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 