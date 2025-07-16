"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { checkAndCreateUser } from '@/app/actions/user-actions';
import { getUserProfile, updateOnboardingStep, completeOnboarding as completeUserOnboarding } from '@/app/actions/profile-actions';
import { UserProfile } from '@/lib/db/schema-profile';

// Define the onboarding steps
export type OnboardingStep = 'welcome' | 'profile' | 'topics' | 'content' | 'details' | 'style' | 'hook' | 'review' | 'complete';

interface OnboardingContextType {
  currentStep: OnboardingStep;
  isCompleted: boolean;
  isLoading: boolean;
  goToStep: (step: OnboardingStep) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  userProfile: UserProfile | null;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();

  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();

  // Fetch the current onboarding status when the user ID changes
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (!userId || !isSignedIn || !isUserLoaded || !clerkUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Use the Clerk user information to get or create a user in our database
        await checkAndCreateUser(
          userId,
          clerkUser.primaryEmailAddress?.emailAddress || '',
          clerkUser.firstName || undefined,
          clerkUser.lastName || undefined
        );
        
        // Now fetch user profile which contains onboarding status
        const result = await getUserProfile();
        
        if (!result.success || !result.profile) {
          throw new Error('Failed to fetch user profile');
        }

        const profile = result.profile;
        if (profile) {
          setUserProfile(profile);
          setCurrentStep((profile.lastCompletedStep as OnboardingStep) || 'welcome');
          setIsCompleted(!!profile.onboardingCompleted);
        }
      } catch (error) {
        console.error('Error fetching onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [userId, isSignedIn]);

  // Navigate to a specific onboarding step
  const goToStep = async (step: OnboardingStep) => {
    try {
      setIsLoading(true);
      const result = await updateOnboardingStep(step);

      if (!result.success) {
        throw new Error('Failed to update onboarding step');
      }

      setCurrentStep(step);
      if (result.profile) {
        setUserProfile(result.profile);
      }
      
      // Redirect to the appropriate onboarding page
      router.push(`/onboarding/${step}`);
    } catch (error) {
      console.error('Error updating onboarding step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Complete the onboarding process
  const completeOnboarding = async () => {
    try {
      setIsLoading(true);
      const result = await completeUserOnboarding();

      if (!result.success) {
        throw new Error('Failed to complete onboarding');
      }

      setIsCompleted(true);
      if (result.profile) {
        setUserProfile(result.profile);
      }
      router.push('/'); // Redirect to home page after completing onboarding
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        isCompleted,
        isLoading,
        goToStep,
        completeOnboarding,
        userProfile,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
}
