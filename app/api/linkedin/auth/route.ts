import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the return URL from query parameters, default to current page
  const searchParams = request.nextUrl.searchParams;
  const returnUrl = searchParams.get('returnUrl') || '/';

  // LinkedIn OAuth 2.0 parameters
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  
  // Encode state with both userId and returnUrl for security and redirect handling
  const state = JSON.stringify({ userId, returnUrl });
  const scope = 'openid profile email w_member_social'; // LinkedIn API scopes

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'LinkedIn OAuth not configured' },
      { status: 500 }
    );
  }

  // Build LinkedIn authorization URL
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', scope);

  // Redirect to LinkedIn
  return NextResponse.redirect(authUrl.toString());
} 