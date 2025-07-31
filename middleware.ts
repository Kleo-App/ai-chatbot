import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher(['/', '/login', '/register', '/privacy', '/terms', '/api/auth(.*)', '/api/admin/delete-users', '/api/waitlist', '/api/inngest']);

// Define paths that don't require onboarding check
const isOnboardingExemptPath = createRouteMatcher([
  '/onboarding/(.*)',
  '/api/onboarding/(.*)',
  '/_next/(.*)',
  '/favicon.ico',
]);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  // Allow public routes to pass through
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Protect all other routes
  const { userId } = await auth();
  
  if (!userId) {
    // Redirect to sign-in if not authenticated
    const signInUrl = new URL('/login', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated and trying to access login/register, redirect to home
  if (userId && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Skip onboarding check for API routes except onboarding API
  // and for paths that are exempt from onboarding check
  const isApiRoute = pathname.startsWith('/api/') && !pathname.startsWith('/api/onboarding');
  const isExemptPath = isOnboardingExemptPath(request);
  
  if (isApiRoute || isExemptPath) {
    return NextResponse.next();
  }

  // Add debug logging for onboarding checks
  console.log(`[Middleware] Checking onboarding for user ${userId} on path ${pathname}`);

  // Check onboarding status by fetching user data directly from Clerk
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const onboardingComplete = clerkUser.publicMetadata?.onboardingComplete;

    console.log(`[Middleware] User ${userId} onboardingComplete status:`, onboardingComplete);

    // Check if user has completed onboarding
    if (userId && !onboardingComplete) {
      console.log(`[Middleware] User ${userId} needs onboarding, redirecting from ${pathname} to /onboarding/welcome`);
      
      // For new users, ensure they have an onboarding record in our database
      try {
        const { getOrCreateUserProfile } = await import('@/lib/db/profile-queries');
        await getOrCreateUserProfile(userId);
        console.log(`[Middleware] Created/ensured user profile for ${userId}`);
      } catch (dbError) {
        console.log(`[Middleware] Could not ensure user profile for ${userId}:`, dbError);
      }

      const url = request.nextUrl.clone();
      url.pathname = '/onboarding/welcome';
      return NextResponse.redirect(url);
    } else {
      console.log(`[Middleware] User ${userId} has completed onboarding, allowing access to ${pathname}`);
    }
  } catch (error) {
    console.error(`[Middleware] Error checking onboarding status for user ${userId}:`, error);
    // If Clerk fails, try checking our database as fallback
    try {
      const { getUserProfileByUserId } = await import('@/lib/db/profile-queries');
      const profile = await getUserProfileByUserId(userId);
      console.log(`[Middleware] Fallback DB check for user ${userId}:`, profile?.onboardingCompleted);
      
      if (!profile || !profile.onboardingCompleted) {
        console.log(`[Middleware] DB fallback: User ${userId} needs onboarding`);
        const url = request.nextUrl.clone();
        url.pathname = '/onboarding/welcome';
        return NextResponse.redirect(url);
      }
    } catch (dbError) {
      console.error(`[Middleware] DB fallback failed for user ${userId}:`, dbError);
      // Allow access if both Clerk and DB checks fail to avoid blocking users
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
