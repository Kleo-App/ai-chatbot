"use client";

import React from 'react';
import { OnboardingStep } from '@/hooks/use-onboarding';

// Define the steps in the onboarding flow
const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'topics',
  'content',
  'style',
  'hook',
  'review'
];

// Map step names to display names
const STEP_DISPLAY_NAMES: Record<OnboardingStep, string> = {
  'welcome': 'Welcome',
  'topics': 'Topics',
  'content': 'Content',
  'style': 'Style',
  'hook': 'Hook',
  'review': 'Review',
  'complete': 'Complete'
};

interface StepIndicatorProps {
  currentStep: OnboardingStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  // Find the index of the current step (0-based)
  const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep);
  
  // Get the display name for the current step
  const currentStepName = STEP_DISPLAY_NAMES[currentStep];
  
  // Get the step number (1-based)
  const stepNumber = currentStepIndex + 1;
  
  return (
    <div className="text-center mb-10">
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-gray-700 font-medium">Step {stepNumber}:</span>
        <span className="text-gray-900 font-semibold">{currentStepName}</span>
        <div className="flex gap-2 ml-4">
          {ONBOARDING_STEPS.map((step, index) => (
            <div 
              key={step}
              className={`w-8 h-2 ${index <= currentStepIndex ? 'bg-[#157DFF]' : 'bg-gray-300'} rounded-full`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
