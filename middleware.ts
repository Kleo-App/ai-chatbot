import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getOnboardingByUserId, createOnboarding } from '@/lib/db/onboarding-queries';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher(['/', '/login', '/register', '/api/auth(.*)', '/api/admin/delete-users']);

// Define paths that don't require onboarding check
const isOnboardingExemptPath = createRouteMatcher([
  '/onboarding/(.*)',
  '/api/onboarding/(.*)',
  '/api/clerk-webhooks(.*)',
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
    // Get the user's onboarding status or create one if it doesn't exist
    let onboardingStatus = await getOnboardingByUserId(userId);
    
    if (!onboardingStatus) {
      console.log(`Creating new onboarding record for user ${userId}`);
      onboardingStatus = await createOnboarding(userId);
      
      // Immediately redirect new users to the welcome step
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding/welcome';
      return NextResponse.redirect(url);
    }

    // If onboarding is not completed, redirect to the current onboarding step
    if (!onboardingStatus.completed) {
      const url = request.nextUrl.clone();
      url.pathname = `/onboarding/${onboardingStatus.currentStep}`;
      return NextResponse.redirect(url);
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
