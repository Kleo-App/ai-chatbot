import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

// This endpoint creates a temporary token for client-side real-time transcription
export async function GET(request: NextRequest) {
  try {
    // Get the API key from environment variables - same as the one used in the regular transcribe endpoint
    const apiKey = process.env.DEEPGRAM_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Deepgram API key is not configured' },
        { status: 500 }
      );
    }

    // Generate a temporary token with limited scope and time
    try {
      const response = await fetch('https://api.deepgram.com/v1/auth/grant', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ttl_seconds: 3600, // 1 hour TTL
          scope: 'listen' // Only allow listening capabilities
        }),
      });

      if (!response.ok) {
        throw new Error(`Deepgram token generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json({ token: data.access_token });
    } catch (error) {
      console.error('Error generating Deepgram token:', error);
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
