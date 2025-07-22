'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignUp } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

function RegisterPageInner() {
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const [isWaitlistSubmitted, setIsWaitlistSubmitted] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  // Check for redirect from failed authentication
  useEffect(() => {
    const redirectUrl = searchParams.get('redirect_url');
    // If there's a redirect_url and it points to onboarding, it likely means
    // they tried to authenticate but don't have access yet
    if (redirectUrl && redirectUrl.includes('/onboarding')) {
      setShowAccessDenied(true);
    }
  }, [searchParams]);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;

    setIsWaitlistSubmitting(true);
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: waitlistEmail,
        }),
      });

      if (response.ok) {
        setIsWaitlistSubmitted(true);
        setWaitlistEmail('');
      } else {
        throw new Error('Failed to submit to waitlist');
      }
    } catch (error) {
      console.error('Error submitting to waitlist:', error);
      setError('Failed to join waitlist. Please try again.');
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background with gradient and animated orbs - matching homepage */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/60 to-purple-50/40" />
        
        {/* Animated orbs */}
        <div className="absolute top-20 left-10 size-64 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 size-48 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-20 size-56 bg-gradient-to-r from-green-200/20 to-emerald-200/20 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute bottom-20 right-10 size-40 bg-gradient-to-r from-orange-200/25 to-yellow-200/25 rounded-full blur-3xl animate-pulse delay-3000" />
        
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
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md">
          {/* Register Card */}
          <div className="bg-white/80 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8">
            {showAccessDenied ? (
              <>
                {/* Access Denied Message */}
                <div className="text-center mb-8">
                  <div className="size-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="size-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.884-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                    Access Not Available Yet
                  </h1>
                  <p className="text-gray-600 text-lg">
                    It looks like you don&apos;t have access to Kleo yet. We are currently letting in people in waves from our waitlist.
                  </p>
                </div>

                {!isWaitlistSubmitted ? (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-blue-900 mb-2">Join our waitlist</h3>
                      <p className="text-blue-700 text-sm">
                        Make sure you&apos;re on our waitlist and we&apos;ll reach out soon with access!
                      </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}

                    {/* Waitlist Form */}
                    <form onSubmit={handleWaitlistSubmit} className="space-y-4 mb-6">
                      <div>
                        <label htmlFor="waitlistEmail" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          id="waitlistEmail"
                          type="email"
                          value={waitlistEmail}
                          onChange={(e) => setWaitlistEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="you@example.com"
                          required
                          disabled={isWaitlistSubmitting}
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                        disabled={isWaitlistSubmitting}
                      >
                        {isWaitlistSubmitting ? 'Joining Waitlist...' : 'Join Waitlist'}
                      </Button>
                    </form>

                    <div className="text-center">
                      <Button
                        onClick={() => {
                          setShowAccessDenied(false);
                          setError('');
                          // Clear the redirect_url from the URL
                          const url = new URL(window.location.href);
                          url.searchParams.delete('redirect_url');
                          window.history.replaceState({}, '', url.toString());
                        }}
                        variant="ghost"
                        size="lg"
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Back to Sign Up
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-6">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">✓ You&apos;re on the waitlist!</p>
                        <p className="text-green-600 text-sm mt-1">
                          We&apos;ll reach out soon with access. Keep an eye on your inbox!
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <Button
                          onClick={() => {
                            setShowAccessDenied(false);
                            setIsWaitlistSubmitted(false);
                            setError('');
                            // Clear the redirect_url from the URL
                            const url = new URL(window.location.href);
                            url.searchParams.delete('redirect_url');
                            window.history.replaceState({}, '', url.toString());
                          }}
                          variant="outline"
                          size="lg"
                          className="w-full"
                        >
                          Back to Sign Up
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
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

function RegisterPageFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageInner />
    </Suspense>
  );
}
