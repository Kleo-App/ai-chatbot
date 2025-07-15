import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  getOnboardingByUserId, 
  createOnboarding, 
  updateOnboardingStep 
} from '@/lib/db/onboarding-queries';

// GET /api/onboarding - Get the current onboarding status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's onboarding status or create one if it doesn't exist
    let onboardingStatus = await getOnboardingByUserId(userId);
    
    if (!onboardingStatus) {
      onboardingStatus = await createOnboarding(userId);
    }

    return NextResponse.json(onboardingStatus);
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to get onboarding status' },
      { status: 500 }
    );
  }
}

// PUT /api/onboarding - Update the current onboarding step
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { step } = body;

    if (!step) {
      return NextResponse.json(
        { error: 'Step is required' },
        { status: 400 }
      );
    }

    // Check if the user has an onboarding record, create one if not
    let onboardingStatus = await getOnboardingByUserId(userId);
    
    if (!onboardingStatus) {
      onboardingStatus = await createOnboarding(userId);
    }

    // Update the onboarding step
    const updatedOnboarding = await updateOnboardingStep(userId, step);

    return NextResponse.json(updatedOnboarding);
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding step' },
      { status: 500 }
    );
  }
}
