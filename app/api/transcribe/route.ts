import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.DEEPGRAM_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Deepgram API key is not configured' },
        { status: 500 }
      );
    }

    // Get form data with audio file
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer for sending to Deepgram
    const arrayBuffer = await audioFile.arrayBuffer();
    
    // Create a new FormData object for the Deepgram API
    const deepgramFormData = new FormData();
    deepgramFormData.append('audio', new Blob([arrayBuffer], { type: audioFile.type }));
    
    // Send directly to Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&language=en-US&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
      body: deepgramFormData
    });
    
    if (!response.ok) {
      throw new Error(`Deepgram API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the transcription text
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    
    // Return the transcription
    return NextResponse.json({ 
      success: true,
      transcription: transcript
    });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
