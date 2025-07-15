import { NextResponse } from 'next/server';
import { createOnboarding } from '@/lib/db/onboarding-queries';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const createdUserId = searchParams.get('createdUserId');
  
  // Handle sign-up completion
  if (createdUserId) {
    try {
      // Create an onboarding record for the new user
      await createOnboarding(createdUserId);
      
      // Redirect to the welcome onboarding step
      return NextResponse.redirect(new URL('/onboarding/welcome', request.url));
    } catch (error) {
      console.error('Error creating onboarding record:', error);
      // Redirect to home page if there's an error
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // For other auth callbacks, redirect to home
  return NextResponse.redirect(new URL('/', request.url));
}
