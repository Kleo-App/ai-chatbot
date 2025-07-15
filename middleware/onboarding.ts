import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getOnboardingByUserId, createOnboarding } from '@/lib/db/onboarding-queries';

// Paths that don't require onboarding check
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/onboarding/',
];

// Check if the path is public
const isPublicPath = (path: string) => {
  return PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath));
};

export async function onboardingMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip onboarding check for public paths
  if (isPublicPath(path)) {
    return NextResponse.next();
  }

  // Get the user's session
  const token = await getToken({ req: request });
  
  // If no user is logged in, allow the request to proceed (auth middleware will handle it)
  if (!token || !token.id) {
    return NextResponse.next();
  }

  // Skip onboarding check if already in the onboarding flow
  if (path.startsWith('/onboarding/')) {
    return NextResponse.next();
  }

  try {
    // Get the user's onboarding status or create one if it doesn't exist
    let onboardingStatus = await getOnboardingByUserId(token.id);
    
    if (!onboardingStatus) {
      onboardingStatus = await createOnboarding(token.id);
    }

    // If onboarding is not completed, redirect to the current onboarding step
    if (!onboardingStatus.completed) {
      const url = request.nextUrl.clone();
      url.pathname = `/onboarding/${onboardingStatus.currentStep}`;
      return NextResponse.redirect(url);
    }

    // Onboarding is completed, allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    // In case of error, allow the request to proceed to avoid blocking users
    return NextResponse.next();
  }
}
