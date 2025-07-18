import { ReactNode } from 'react';
import { OnboardingProvider } from '@/hooks/use-onboarding';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  );
}
