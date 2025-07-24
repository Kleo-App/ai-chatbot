"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useOnboarding } from "@/hooks/use-onboarding"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { updateProfileInfo, initializeUserProfile } from "@/app/actions/profile-actions"
import { checkAndCreateUser } from "@/app/actions/user-actions"
import { VoiceRecorder } from "@/components/voice-recorder"
import { toast } from "sonner"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"

export default function AboutPage() {
  const [combinedProfileText, setCombinedProfileText] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { goToStep, userProfile, isLoading: isProfileLoading } = useOnboarding();
  const { userId } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Determine if we're ready to show the page content
  const isPageReady = !isInitializing && isLoaded && !isProfileLoading && userProfile !== null;
  
  useEffect(() => {
    async function initializeProfile() {
      if (!isLoaded || !user || !userId) return;

      try {
        console.log('Creating or getting user record...');
        // Create or get the user record
        const userResult = await checkAndCreateUser(
          userId,
          user.primaryEmailAddress?.emailAddress || '',
          user.firstName || undefined,
          user.lastName || undefined
        );
        console.log('User record result:', userResult);
        
        console.log('Initializing user profile...');
        // Initialize the user profile
        const profileResult = await initializeUserProfile();
        console.log('Profile initialization result:', profileResult);
        
        if (!profileResult.success) {
          throw new Error(profileResult.error || 'Failed to initialize user profile');
        }
        
        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize profile');
        setIsInitializing(false);
      }
    }

    initializeProfile();
  }, [isLoaded, user, userId]);
  
  // Pre-fill the combined profile text from the user's bio
  useEffect(() => {
    let combinedText = '';
    
    if (userProfile?.bio) {
      combinedText = userProfile.bio;
    }
    
    setCombinedProfileText(combinedText);
  }, [userProfile]);

  const handleOpenLinkedIn = () => {
    window.open('https://www.linkedin.com/in/me/', '_blank');
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // Start navigation immediately to prevent flashing
      // We'll do this in the background while transitioning
      router.prefetch('/onboarding/hook');
      
      // Run these operations in parallel to speed up the process
      const promises = [];
      
      // If we're still initializing, make sure to initialize the profile first
      if (isInitializing && userId && user) {
        promises.push(
          checkAndCreateUser(
            userId,
            user.primaryEmailAddress?.emailAddress || '',
            user.firstName || undefined,
            user.lastName || undefined
          ).then(() => initializeUserProfile())
        );
      }
      
      // Save the combined profile text to the user profile
      promises.push(
        updateProfileInfo({
          bio: combinedProfileText,
          // Use existing fullName from database if available, otherwise use Clerk data
          fullName: userProfile?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : undefined),
        })
      );
      
      // Update the step in the background
      promises.push(goToStep('hook'));
      
      // Navigate immediately without waiting for all operations to complete
      router.push('/onboarding/hook');
      
      // Still wait for operations to complete in the background
      await Promise.all(promises).catch(err => {
        console.error('Background operations error:', err);
        // Operations will continue in the background, but we've already navigated
      });
    } catch (error) {
      console.error('Error during navigation:', error);
      // Ensure we navigate even if there's an error
      router.push('/onboarding/hook');
    }
    // We don't need to set isLoading to false since we're navigating away
  };

  return (
    <OnboardingLayout currentStep="about">
      <div className="flex w-full flex-col items-center gap-8 text-center">
        <div className="flex w-full flex-col items-center space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.1em] uppercase">
              Let&apos;s get to know you better
            </p>
            <h1 className="w-full text-center text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
              What do you want to educate on and <br /> what do you want to be known for?
            </h1>
          </div>
        </div>
        
        <div className="w-full">
          <div className="relative">
            <div className="relative w-full max-w-2xl pt-8 mx-auto">
              <div className="relative bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-gray-300 focus-within:border-[#157DFF] focus-within:ring-2 focus-within:ring-[#157DFF]/20 rounded-2xl shadow-sm transition-all duration-200">
                <textarea
                  value={combinedProfileText}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue.length <= 250) {
                      setCombinedProfileText(newValue);
                    }
                  }}
                  className="w-full min-h-[160px] text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-base p-6 pb-16 placeholder:text-gray-400"
                  placeholder="Keep it short. What you educate on and what you want to be known for."
                  maxLength={250}
                />
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/80 backdrop-blur-sm border-t border-gray-100 rounded-b-2xl flex items-center justify-between px-4 gap-3">
                  <div className="text-xs text-gray-500">
                    {combinedProfileText.length}/250 characters
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleOpenLinkedIn}
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
                    >
                      Copy from LinkedIn
                    </button>
                    <VoiceRecorder 
                      onTranscriptionComplete={(text) => {
                        setCombinedProfileText(prev => {
                          const newContent = prev ? `${prev}\n${text}` : text;
                          return newContent.slice(0, 250); // Ensure we don't exceed character limit
                        });
                        toast.success("Voice transcription added!");
                      }} 
                      className="flex items-center"
                      showText={true}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  This will be used as information when generating content. You can change it later.
                </p>
              </div>
            </div>
          </div>
        </div>
                
        <div className="flex w-full justify-center pt-8">
          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
              <p>Error: {error}</p>
              <button 
                type="button"
                onClick={() => window.location.reload()} 
                className="underline mt-2"
              >
                Retry
              </button>
            </div>
          )}
          <Button
            onClick={handleNext}
            className="z-0 group relative inline-flex items-center justify-center box-border appearance-none select-none whitespace-nowrap overflow-hidden tap-highlight-transparent cursor-pointer outline-none min-w-24 gap-3 rounded-full transition-transform-colors-opacity bg-[#157DFF] text-white hover:opacity-90 h-12 px-8 py-6 text-base font-medium sm:w-[360px]"
            disabled={isLoading || !!error || !combinedProfileText.trim()}
          >
            {isLoading ? 'Saving...' : 'Continue'}
            {!isLoading && (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
} 