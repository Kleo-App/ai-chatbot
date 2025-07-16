import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getOrCreateUserProfile } from '@/lib/db/profile-queries';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher(['/', '/login', '/register', '/api/auth(.*)', '/api/admin/delete-users']);

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
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/onboarding') || isOnboardingExemptPath(request)) {
    return NextResponse.next();
  }

  // Check if user has completed onboarding
  try {
    // Get the user's profile or create one if it doesn't exist
    const userProfile = await getOrCreateUserProfile(userId);
    
    // Always create a user profile when a user first signs up
    if (userProfile) {
      console.log(`User profile found or created for user ${userId}`);
      
      // If onboarding is not completed, redirect to the appropriate step
      if (!userProfile.onboardingCompleted) {
        // Determine which page to redirect to based on lastCompletedStep
        const lastStep = userProfile.lastCompletedStep || 'welcome';
        const url = request.nextUrl.clone();
        url.pathname = `/onboarding/${lastStep}`;
        return NextResponse.redirect(url);
      }
    } else {
      // This should never happen since getOrCreateUserProfile always creates a profile
      console.error(`Failed to create user profile for user ${userId}`);
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // In case of error, allow the request to proceed to avoid blocking users
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
