"use client";

import React, { useState, useEffect } from 'react';
import { Background } from "@/components/background";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import type { OnboardingStep } from "@/hooks/use-onboarding";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: OnboardingStep;
}

export function OnboardingLayout({ children, currentStep }: OnboardingLayoutProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth animation on step changes
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [currentStep]); // Re-trigger animation when step changes

  // Reset animation when step changes
  useEffect(() => {
    setIsVisible(false);
  }, [currentStep]);

  return (
    <>
      <Background />
      <div className="relative flex size-full min-h-screen items-center justify-center overflow-hidden">
        <div className="relative z-10 mx-auto flex min-h-screen size-full flex-col items-center justify-center">
          <div className="flex size-full max-w-6xl flex-1 items-center justify-center">
            <div className="relative flex w-full flex-1 items-center justify-center px-4 py-12 sm:px-6">
              <div className="flex size-full flex-col items-center justify-center">
                <div 
                  className={`relative flex size-full max-w-5xl flex-col items-center justify-center px-4 transition-all duration-700 ease-out ${
                    isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>
          
          {/* Fixed footer with step indicator - also animated */}
          <div 
            className={`fixed bottom-8 inset-x-0 z-20 transition-all duration-700 ease-out delay-300 ${
              isVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            <nav aria-label="Progress" className="mx-auto flex h-[50px] shrink-0 items-center justify-center">
              <StepIndicator currentStep={currentStep} />
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
