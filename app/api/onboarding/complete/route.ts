import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  getOnboardingByUserId, 
  createOnboarding, 
  completeOnboarding 
} from '@/lib/db/onboarding-queries';

// POST /api/onboarding/complete - Mark the onboarding process as complete
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the user has an onboarding record, create one if not
    let onboardingStatus = await getOnboardingByUserId(userId);
    
    if (!onboardingStatus) {
      onboardingStatus = await createOnboarding(userId);
    }

    // Mark the onboarding as complete
    const completedOnboarding = await completeOnboarding(userId);

    return NextResponse.json(completedOnboarding);
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
