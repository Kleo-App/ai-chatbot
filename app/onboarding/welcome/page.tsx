"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton , useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { updateProfileInfo, initializeUserProfile } from "@/app/actions/profile-actions"
import { checkAndCreateUser } from "@/app/actions/user-actions"
import { VoiceRecorder } from "@/components/voice-recorder"
import { toast } from "sonner"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { StepIndicator } from "@/components/onboarding/step-indicator"

export default function KleoProfileSetup() {
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

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // Start navigation immediately to prevent flashing
      // We'll do this in the background while transitioning
      router.prefetch('/onboarding/topics');
      
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
          linkedInServices: "", // We're storing everything in the bio field now
          // Use existing fullName from database if available, otherwise use Clerk data
          fullName: userProfile?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : undefined),
        })
      );
      
      // Update the step in the background
      promises.push(goToStep('topics'));
      
      // Navigate immediately without waiting for all operations to complete
      router.push('/onboarding/topics');
      
      // Still wait for operations to complete in the background
      await Promise.all(promises).catch(err => {
        console.error('Background operations error:', err);
        // Operations will continue in the background, but we've already navigated
      });
    } catch (error) {
      console.error('Error during navigation:', error);
      // Ensure we navigate even if there's an error
      router.push('/onboarding/topics');
    }
    // We don't need to set isLoading to false since we're navigating away
  };

  return (
    <OnboardingLayout>
      {!isPageReady ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full size-12 border-y-2 border-[#157DFF]"></div>
          <p className="mt-4 text-[#157DFF]">Loading your profile...</p>
        </div>
      ) : (
        <div>
          {/* Progress Header */}
          <StepIndicator currentStep="welcome" />
          
          {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 mb-4 md:mb-6 w-full max-w-3xl">
          {/* Combined Who is X and LinkedIn Services section */}
          <div className="flex items-center gap-3 mb-2 md:mb-4">
            <div className="size-10 rounded-full overflow-hidden border-2 border-blue-500">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover size-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Who is {userProfile?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || user?.lastName || 'you')} and what products or services do you sell on LinkedIn?
            </h2>
          </div>

          <p className="text-gray-600 mb-3 md:mb-4">
            This will be used as context information when generating content. Don&#39;t worry, you can change it later.
          </p>

          <div className="relative">
            <Textarea
              value={combinedProfileText}
              onChange={(e) => setCombinedProfileText(e.target.value)}
              className="h-[200px] sm:h-[250px] text-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none rounded-xl text-base p-4 w-full"
              placeholder="Tell us about yourself and the products or services you sell on LinkedIn..."
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <VoiceRecorder 
                onTranscriptionComplete={(text) => {
                  setCombinedProfileText(prev => {
                    const newContent = prev ? `${prev}\n${text}` : text;
                    return newContent;
                  });
                  toast.success("Voice transcription added!");
                }} 
                className="flex items-center"
              />
            </div>
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-center mt-4">
          <div className="flex flex-col gap-3 md:gap-4 mt-2 md:mt-4">
            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                <p>Error: {error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="underline mt-2"
                >
                  Retry
                </button>
              </div>
            )}
            <Button
              onClick={handleNext}
              className="w-full"
              size="lg"
              disabled={isLoading || isInitializing || !!error}
            >
              {isLoading ? 'Saving...' : isInitializing ? 'Initializing...' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </OnboardingLayout>
  );
}
