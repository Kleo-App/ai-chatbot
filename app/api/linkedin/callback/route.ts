import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { linkedinConnection } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client, { schema: { linkedinConnection } });

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (!userId) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
  }

  if (error) {
    return NextResponse.redirect(new URL('/chat?error=linkedin_auth_failed', request.url));
  }

  // Parse state to extract userId and returnUrl
  let stateData: { userId: string; returnUrl: string };
  try {
    stateData = JSON.parse(state || '{}');
  } catch {
    return NextResponse.redirect(new URL('/chat?error=invalid_request', request.url));
  }

  if (!code || stateData.userId !== userId) {
    return NextResponse.redirect(new URL('/chat?error=invalid_request', request.url));
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, scope } = tokenData;

    // Get LinkedIn profile information using OpenID Connect userinfo
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get LinkedIn profile');
    }

    const profileData = await profileResponse.json();
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Store or update LinkedIn connection in database
    const existingConnection = await db
      .select()
      .from(linkedinConnection)
      .where(eq(linkedinConnection.userId, userId))
      .limit(1);

    const connectionData = {
      userId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
      scope,
      linkedinId: profileData.sub, // OpenID Connect uses 'sub' for subject identifier
      firstName: profileData.given_name,
      lastName: profileData.family_name,
      profilePicture: profileData.picture,
      isActive: true,
      updatedAt: new Date(),
    };

    if (existingConnection.length > 0) {
      // Update existing connection
      await db
        .update(linkedinConnection)
        .set(connectionData)
        .where(eq(linkedinConnection.userId, userId));
    } else {
      // Create new connection
      await db.insert(linkedinConnection).values({
        ...connectionData,
        createdAt: new Date(),
      });
    }

    // Redirect back to the original URL with success parameter
    const returnUrl = stateData.returnUrl || '/';
    const redirectUrl = new URL(returnUrl, request.url);
    redirectUrl.searchParams.set('linkedin_connected', 'true');
    
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    
    // On error, redirect back to return URL with error parameter
    const returnUrl = stateData?.returnUrl || '/chat';
    const redirectUrl = new URL(returnUrl, request.url);
    redirectUrl.searchParams.set('error', 'linkedin_connection_failed');
    
    return NextResponse.redirect(redirectUrl.toString());
  }
}