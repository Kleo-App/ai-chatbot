"use client";

import React, { ReactNode } from 'react';
import { UserButton } from "@clerk/nextjs";

interface OnboardingLayoutProps {
  children: ReactNode;
}

export function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      {/* User button for logout in top-right corner */}
      <div className="absolute top-6 right-6 z-10">
        <UserButton afterSignOutUrl="/" />
      </div>
      
      {/* Main content with scrolling enabled */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-8 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
