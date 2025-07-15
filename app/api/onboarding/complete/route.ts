import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { 
  getOnboardingByUserId, 
  createOnboarding, 
  completeOnboarding 
} from '@/lib/db/onboarding-queries';

// POST /api/onboarding/complete - Mark the onboarding process as complete
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if the user has an onboarding record, create one if not
    let onboardingStatus = await getOnboardingByUserId(session.user.id);
    
    if (!onboardingStatus) {
      onboardingStatus = await createOnboarding(session.user.id);
    }

    // Mark the onboarding as complete
    const completedOnboarding = await completeOnboarding(session.user.id);

    return NextResponse.json(completedOnboarding);
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
