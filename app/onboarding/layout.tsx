import { ReactNode } from 'react';
import { OnboardingProvider } from '@/hooks/use-onboarding';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </div>
    </div>
  );
}
