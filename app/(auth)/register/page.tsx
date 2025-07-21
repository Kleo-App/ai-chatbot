'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SignUp } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background with gradient and animated orbs - matching homepage */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/60 to-purple-50/40"></div>
        
        {/* Animated orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-20 w-56 h-56 bg-gradient-to-r from-green-200/20 to-emerald-200/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-orange-200/25 to-yellow-200/25 rounded-full blur-3xl animate-pulse delay-3000"></div>
        
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            background: `
              linear-gradient(90deg, #157DFF 1px, transparent 1px),
              linear-gradient(180deg, #157DFF 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/kleo.svg"
              alt="Kleo"
              width={107}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md">
          {/* Register Card */}
          <div className="bg-white/80 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Create your account
              </h1>
              <p className="text-gray-600">
                Join thousands of creators using Kleo to craft amazing content
              </p>
            </div>

            {/* Clerk SignUp Component with custom styling */}
            <div className="[&_.cl-rootBox]:w-full [&_.cl-card]:bg-transparent [&_.cl-card]:shadow-none [&_.cl-card]:border-none [&_.cl-headerTitle]:text-transparent [&_.cl-headerTitle]:h-0 [&_.cl-headerSubtitle]:text-transparent [&_.cl-headerSubtitle]:h-0 [&_.cl-socialButtonsBlockButton]:w-full [&_.cl-socialButtonsBlockButton]:justify-center [&_.cl-socialButtonsBlockButton]:border-gray-300 [&_.cl-socialButtonsBlockButton]:rounded-lg [&_.cl-socialButtonsBlockButton]:py-3 [&_.cl-socialButtonsBlockButton]:text-gray-700 [&_.cl-socialButtonsBlockButton]:hover:bg-gray-50 [&_.cl-formFieldInput]:border-gray-300 [&_.cl-formFieldInput]:rounded-lg [&_.cl-formFieldInput]:px-4 [&_.cl-formFieldInput]:py-3 [&_.cl-formFieldInput]:focus:ring-2 [&_.cl-formFieldInput]:focus:ring-blue-500 [&_.cl-formFieldInput]:focus:border-transparent [&_.cl-formButtonPrimary]:bg-blue-600 [&_.cl-formButtonPrimary]:hover:bg-blue-700 [&_.cl-formButtonPrimary]:w-full [&_.cl-formButtonPrimary]:rounded-lg [&_.cl-formButtonPrimary]:py-3 [&_.cl-formButtonPrimary]:text-lg [&_.cl-formButtonPrimary]:font-medium [&_.cl-footerActionLink]:text-blue-600 [&_.cl-footerActionLink]:hover:text-blue-700 [&_.cl-dividerLine]:border-gray-200 [&_.cl-dividerText]:text-gray-500 [&_.cl-dividerText]:bg-white [&_.cl-alternativeMethodsBlockButton]:border-gray-300 [&_.cl-alternativeMethodsBlockButton]:rounded-lg [&_.cl-alternativeMethodsBlockButton]:hover:bg-gray-50">
              <SignUp 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none border-none p-0",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "w-full justify-center border-gray-300 rounded-lg py-3 text-gray-700 hover:bg-gray-50 transition-colors",
                    formFieldInput: "border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                    formFieldLabel: "text-sm font-medium text-gray-700 mb-2",
                    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 w-full rounded-lg py-3 text-lg font-medium transition-colors",
                    footerActionLink: "text-blue-600 hover:text-blue-700 transition-colors",
                    dividerLine: "border-gray-200",
                    dividerText: "text-gray-500 bg-white px-4",
                    alternativeMethodsBlockButton: "border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
                    formFieldError: "text-red-600 text-sm mt-1",
                  },
                  layout: {
                    socialButtonsVariant: "blockButton",
                    socialButtonsPlacement: "top",
                  }
                }}
                routing="hash"
                signInUrl="/login"
                forceRedirectUrl="/onboarding/welcome"
                fallbackRedirectUrl="/onboarding/welcome"
              />
            </div>
          </div>

          {/* Additional Info */}
          <p className="text-center mt-6 text-sm text-gray-500">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-700 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
