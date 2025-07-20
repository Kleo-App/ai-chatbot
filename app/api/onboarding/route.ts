import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  getUserProfile,
  updateOnboardingStep
} from '@/app/actions/profile-actions';

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

    // Get the user's profile which contains onboarding status
    const result = await getUserProfile();
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 500 }
      );
    }

    const profile = result.profile;
    
    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    // Format the response to match the expected structure
    return NextResponse.json({
      currentStep: profile.lastCompletedStep || 'welcome',
      completed: !!profile.onboardingCompleted,
      profile: profile
    });
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

    // Update the onboarding step using the new profile actions
    const result = await updateOnboardingStep(step);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update onboarding step' },
        { status: 500 }
      );
    }

    // Format the response to match the expected structure
    return NextResponse.json({
      currentStep: step,
      profile: result.profile
    });
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding step' },
      { status: 500 }
    );
  }
}
