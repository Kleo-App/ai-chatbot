'use client';

import { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/');
      } else {
        setError('Sign-in failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message || 'Sign-in failed');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;

    setIsGoogleLoading(true);
    setError('');

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/onboarding/welcome', // Redirect to onboarding after Google sign-in
        redirectUrlComplete: '/', // Redirect to home if onboarding is already complete
      });
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message || 'Google sign-in failed');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setResetLoading(true);
    setError('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: resetEmail,
      });
      setResetSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message || 'Password reset failed');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
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
          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8">
            {!showResetForm ? (
              <>
                {/* Login Form Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                    Welcome back
                  </h1>
                  <p className="text-gray-600">
                    Sign in to continue creating amazing content
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Google Sign In Button */}
                <div className="mb-6">
                  <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    size="lg"
                    className="w-full py-3 text-lg font-medium border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-3"
                    disabled={isGoogleLoading || !isLoaded}
                  >
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="size-5" />
                        ) : (
                          <Eye className="size-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                    disabled={isLoading || !isLoaded}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  {/* Forgot Password Link */}
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetForm(true);
                        setResetEmail(email);
                        setError('');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      disabled={isLoading}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>


              </>
            ) : (
              <>
                {/* Password Reset Form */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                    Reset your password
                  </h1>
                  <p className="text-gray-600">
                    {resetSent 
                      ? "We&apos;ve sent you a password reset link" 
                      : "Enter your email address and we&apos;ll send you a reset link"
                    }
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {resetSent ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Email sent!</p>
                      <p className="text-green-600 text-sm mt-1">
                        Check your email and click the reset link to create a new password.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          setShowResetForm(false);
                          setResetSent(false);
                          setResetEmail('');
                          setError('');
                        }}
                        variant="outline"
                        size="lg"
                        className="w-full"
                      >
                        Back to Sign In
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setResetSent(false);
                          setError('');
                        }}
                        variant="ghost"
                        size="lg"
                        className="w-full text-blue-600 hover:text-blue-700"
                      >
                        Send another email
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handlePasswordReset} className="space-y-6">
                      <div>
                        <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          id="resetEmail"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="you@example.com"
                          required
                          disabled={resetLoading}
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
                        disabled={resetLoading || !isLoaded}
                      >
                        {resetLoading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                    </form>

                    <div className="mt-6">
                      <Button
                        onClick={() => {
                          setShowResetForm(false);
                          setError('');
                        }}
                        variant="ghost"
                        size="lg"
                        className="w-full text-gray-600 hover:text-gray-900"
                      >
                        Back to Sign In
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Additional Info */}
          <p className="text-center mt-6 text-sm text-gray-500">
            By signing in, you agree to our{' '}
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
