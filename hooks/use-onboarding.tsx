"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

// Define the onboarding steps
export type OnboardingStep = 'welcome' | 'profile' | 'topics' | 'content' | 'details' | 'style' | 'hook' | 'review' | 'complete';

interface OnboardingContextType {
  currentStep: OnboardingStep;
  isCompleted: boolean;
  isLoading: boolean;
  goToStep: (step: OnboardingStep) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, isSignedIn } = useAuth();
  const router = useRouter();

  // Fetch the current onboarding status when the user ID changes
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (!userId || !isSignedIn) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/onboarding');
        
        if (!response.ok) {
          throw new Error('Failed to fetch onboarding status');
        }

        const data = await response.json();
        setCurrentStep(data.currentStep as OnboardingStep);
        setIsCompleted(data.completed);
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
      const response = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step }),
      });

      if (!response.ok) {
        throw new Error('Failed to update onboarding step');
      }

      const data = await response.json();
      setCurrentStep(data.currentStep as OnboardingStep);
      
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
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      setIsCompleted(true);
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
