"use client";

import React from 'react';
import type { OnboardingStep } from '@/hooks/use-onboarding';

// Define the steps in the onboarding flow
const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'about',
  'hook'
];

interface StepIndicatorProps {
  currentStep: OnboardingStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  // Find the index of the current step (0-based)
  const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep);
  
  return (
    <ol className="flex">
      {ONBOARDING_STEPS.map((step, index) => {
        let dotClasses = "group m-2 flex h-2 w-2 flex-row rounded-full md:flex-col";
        
        if (index < currentStepIndex) {
          // Completed steps - muted foreground
          dotClasses += " bg-gray-400";
        } else if (index === currentStepIndex) {
          // Current step - primary color
          dotClasses += " bg-[#157DFF]";
        } else {
          // Future steps - even more muted
          dotClasses += " bg-gray-200";
        }
        
        return (
          <li key={step} className="flex-1">
            <div 
              className={dotClasses}
              aria-current={index === currentStepIndex ? "step" : undefined}
            />
          </li>
        );
      })}
    </ol>
  );
}
