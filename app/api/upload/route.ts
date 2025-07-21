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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Generate a unique filename
    const fileExtension = file.name.split('.').pop();
    const filename = `linkedin-post-${Date.now()}.${fileExtension}`;

    // Upload to Vercel blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({ 
      url: blob.url,
      filename: filename 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 