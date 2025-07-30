"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { NuqsAdapter } from 'nuqs/adapters/next/app';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NuqsAdapter>
      <Toaster position="top-right" richColors />
      {children}
    </NuqsAdapter>
  );
}
