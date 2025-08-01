"use client";

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import posthog from 'posthog-js';

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const hasTrackedSignIn = useRef(false);
  const isPostHogEnabled = useRef(false);

  // Initialize PostHog on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    
    if (!postHogKey) {
      if (process.env.NODE_ENV === "development") {
        console.warn('PostHog: NEXT_PUBLIC_POSTHOG_KEY not found. PostHog will be disabled.');
      }
      return;
    }

    if (!posthog._loaded) {
      try {
        posthog.init(postHogKey, {
          api_host: "/ingest",
          ui_host: "https://us.posthog.com",
          defaults: '2025-05-24',
          capture_exceptions: true,
          debug: process.env.NODE_ENV === "development",
          // Add error handling for failed requests
          on_request_error: (error) => {
            console.error('PostHog request error:', error);
          },
          // Disable automatic page view tracking to prevent issues
          capture_pageview: false,
        });
        
        isPostHogEnabled.current = true;
        
        if (process.env.NODE_ENV === "development") {
          console.log('PostHog initialized successfully with key:', postHogKey.substring(0, 8) + '...');
        }
      } catch (error) {
        console.error('Failed to initialize PostHog:', error);
        isPostHogEnabled.current = false;
      }
    } else {
      isPostHogEnabled.current = true;
    }
  }, []);

  // Handle user authentication state changes
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined' || !isPostHogEnabled.current || !posthog._loaded) return;

    try {
      if (isSignedIn && user) {
        const userProperties = {
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          username: user.username,
          imageUrl: user.imageUrl,
          createdAt: user.createdAt?.toISOString(),
          lastSignInAt: user.lastSignInAt?.toISOString(),
          ...user.publicMetadata,
        };

        // Identify the user with PostHog
        posthog.identify(user.id, userProperties);

        // Track sign-in event only once per session
        if (!hasTrackedSignIn.current) {
          posthog.capture('user_signed_in', {
            method: 'clerk',
            userId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
          });
          hasTrackedSignIn.current = true;

          if (process.env.NODE_ENV === "development") {
            console.log('PostHog: User identified and sign-in tracked', user.id);
          }
        }
      } else if (isLoaded && !isSignedIn) {
        // Reset PostHog and tracking state when user signs out
        posthog.reset();
        hasTrackedSignIn.current = false;

        if (process.env.NODE_ENV === "development") {
          console.log('PostHog: User session reset');
        }
      }
    } catch (error) {
      console.error('PostHog operation failed:', error);
      // If PostHog fails, disable it to prevent further errors
      isPostHogEnabled.current = false;
    }
  }, [isLoaded, isSignedIn, user?.id]);

  return <>{children}</>;
}