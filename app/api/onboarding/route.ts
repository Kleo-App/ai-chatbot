import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  getOnboardingByUserId, 
  createOnboarding, 
  updateOnboardingStep 
} from '@/lib/db/onboarding-queries';

// GET /api/onboarding - Get the current onboarding status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's onboarding status or create one if it doesn't exist
    let onboardingStatus = await getOnboardingByUserId(session.user.id);
    
    if (!onboardingStatus) {
      onboardingStatus = await createOnboarding(session.user.id);
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
    const session = await auth();
    
    if (!session || !session.user?.id) {
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
    let onboardingStatus = await getOnboardingByUserId(session.user.id);
    
    if (!onboardingStatus) {
      onboardingStatus = await createOnboarding(session.user.id);
    }

    // Update the onboarding step
    const updatedOnboarding = await updateOnboardingStep(session.user.id, step);

    return NextResponse.json(updatedOnboarding);
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding step' },
      { status: 500 }
    );
  }
}
