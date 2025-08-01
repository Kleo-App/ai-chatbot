"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { PostHogProvider } from './posthog-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NuqsAdapter>
      <PostHogProvider>
        <Toaster position="top-right" richColors />
        {children}
      </PostHogProvider>
    </NuqsAdapter>
  );
}
