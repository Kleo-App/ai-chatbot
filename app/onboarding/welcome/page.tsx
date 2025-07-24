"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useOnboarding } from "@/hooks/use-onboarding"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"

export default function WelcomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const { goToStep } = useOnboarding();

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      await goToStep('about');
    } catch (error) {
      console.error('Error navigating to about step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout currentStep="welcome">
      <div className="flex w-full flex-col items-center gap-8 text-center">
        <div className="flex w-full flex-col items-center space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center">
              <Image
                src="/images/kleo_square.svg"
                alt="Kleo"
                width={80}
                height={80}
                className="w-20 h-20"
              />
            </div>
            
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Welcome to Kleo
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Your LinkedIn AI ghostwriter trained by top creators<br />
                for creators who hate generic content.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex w-full justify-center pt-8">
          <Button
            onClick={handleGetStarted}
            className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap overflow-hidden tap-highlight-transparent cursor-pointer outline-none min-w-24 gap-3 rounded-full transition-transform-colors-opacity bg-[#157DFF] text-white hover:opacity-90 h-12 px-8 py-6 text-base font-medium sm:w-[360px]"
            disabled={isLoading}
          >
            {isLoading ? 'Getting started...' : 'Get started'}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
