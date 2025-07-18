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

export default function KleoProfileSetup() {
  const [profileText, setProfileText] = useState(
    "",
  )
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
  
  // Pre-fill the profile text if it exists in the user profile
  useEffect(() => {
    if (userProfile?.bio) {
      setProfileText(userProfile.bio);
    }
  }, [userProfile]);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // Start navigation immediately to prevent flashing
      // We'll do this in the background while transitioning
      router.prefetch('/onboarding/profile');
      
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
      
      // Save the profile text to the user profile
      promises.push(
        updateProfileInfo({
          bio: profileText,
          // Use existing fullName from database if available, otherwise use Clerk data
          fullName: userProfile?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : undefined),
        })
      );
      
      // Update the step in the background
      promises.push(goToStep('profile'));
      
      // Navigate immediately without waiting for all operations to complete
      router.push('/onboarding/profile');
      
      // Still wait for operations to complete in the background
      await Promise.all(promises).catch(err => {
        console.error('Background operations error:', err);
        // Operations will continue in the background, but we've already navigated
      });
    } catch (error) {
      console.error('Error during navigation:', error);
      // Ensure we navigate even if there's an error
      router.push('/onboarding/profile');
    }
    // We don't need to set isLoading to false since we're navigating away
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col overflow-hidden">
      {/* User button for logout in top-right corner */}
      <div className="absolute top-6 right-6 z-10">
        <UserButton afterSignOutUrl="/login" />
      </div>
      
      {!isPageReady ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full size-12 border-y-2 border-teal-500"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 md:py-8 overflow-hidden">
        {/* Progress Header */}
        <div className="text-center mb-4 md:mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-gray-700 font-medium">Step 1:</span>
            <span className="text-gray-900 font-semibold">Profile</span>
            <div className="flex gap-2 ml-4">
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 mb-4 md:mb-6 w-full max-w-3xl">
          <div className="flex items-center gap-3 mb-2 md:mb-4">
            <div className="size-10 rounded-full overflow-hidden border-2 border-teal-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover size-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Who is {userProfile?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || user?.lastName || 'you')}?
            </h2>
          </div>

          <p className="text-gray-600 mb-3 md:mb-4">
            This will be used as context information when generating every post. Don't worry, you can change it later.
          </p>

          <div className="relative">
            <Textarea
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              className="h-[120px] sm:h-[150px] md:h-[200px] lg:h-[250px] text-gray-700 border-gray-300 focus:border-teal-400 focus:ring-teal-400 resize-none rounded-xl text-base p-4 w-full"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-2 md:mb-4">
          <div className="size-3 bg-teal-500 rounded-full"></div>
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
    </div>
  )
}
