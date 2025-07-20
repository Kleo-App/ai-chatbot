import { NextResponse } from 'next/server';
import { createOnboarding } from '@/lib/db/onboarding-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const createdUserId = searchParams.get('createdUserId');
  
  // Handle sign-up completion - create onboarding record for new users
  if (createdUserId) {
    try {
      // Create an onboarding record for the new user
      await createOnboarding(createdUserId);
      
      // Redirect to the welcome onboarding step
      return NextResponse.redirect(new URL('/onboarding/welcome', request.url));
    } catch (error) {
      console.error('Error creating onboarding record:', error);
      // Still redirect to onboarding even if record creation fails
      // The middleware will handle creating the profile
      return NextResponse.redirect(new URL('/onboarding/welcome', request.url));
    }
  }
  
  // For other auth callbacks, check if user needs onboarding
  try {
    const { userId } = await auth();
    if (userId) {
      // This handles cases where sign-up redirects here without createdUserId
      // Let the middleware handle onboarding checks and redirects
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
  
  // For non-authenticated callbacks, redirect to home
  return NextResponse.redirect(new URL('/', request.url));
}
