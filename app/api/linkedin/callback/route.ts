import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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

  if (!code || state !== userId) {
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

    return NextResponse.redirect(new URL('/chat?linkedin_connected=true', request.url));
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    return NextResponse.redirect(new URL('/chat?error=linkedin_connection_failed', request.url));
  }
} 