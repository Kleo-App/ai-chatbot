import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { linkedinConnection } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client, { schema: { linkedinConnection } });

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get LinkedIn connection for the user
    const connection = await db
      .select()
      .from(linkedinConnection)
      .where(eq(linkedinConnection.userId, userId))
      .limit(1);

    if (connection.length === 0) {
      return NextResponse.json(
        { error: 'LinkedIn not connected' },
        { status: 400 }
      );
    }

    const linkedinConn = connection[0];

    // Check if token needs refresh
    const now = new Date();
    if (linkedinConn.expiresAt && linkedinConn.expiresAt <= now) {
      // Token expired, try to refresh
      if (linkedinConn.refreshToken) {
        const refreshed = await refreshLinkedInToken(linkedinConn.refreshToken);
        if (!refreshed) {
          return NextResponse.json(
            { error: 'LinkedIn connection expired. Please reconnect.' },
            { status: 401 }
          );
        }
        // Update the connection with new token
        await db
          .update(linkedinConnection)
          .set({
            accessToken: refreshed.access_token,
            expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
            updatedAt: new Date(),
          })
          .where(eq(linkedinConnection.userId, userId));
        linkedinConn.accessToken = refreshed.access_token;
      } else {
        return NextResponse.json(
          { error: 'LinkedIn connection expired. Please reconnect.' },
          { status: 401 }
        );
      }
    }

    // Publish to LinkedIn
    const publishResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${linkedinConn.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${linkedinConn.linkedinId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.text();
      console.error('LinkedIn API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to publish to LinkedIn' },
        { status: 500 }
      );
    }

    const result = await publishResponse.json();
    return NextResponse.json({ success: true, postId: result.id });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function refreshLinkedInToken(refreshToken: string) {
  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
} 