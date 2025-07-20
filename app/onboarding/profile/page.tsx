"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton , useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { updateLinkedInServices } from "@/app/actions/profile-actions"
import { Loader2 } from "lucide-react"
import { VoiceRecorder } from "@/components/voice-recorder"
import { toast } from "sonner"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"

// Custom hook to handle page loading state
function usePageLoading() {
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    // Set a flag after the component has mounted
    setHasLoaded(true);
    
    // Reset the flag when the component unmounts
    return () => setHasLoaded(false);
  }, []);
  
  return { hasLoaded };
}

export default function ProfileSetup() {
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { goToStep, userProfile, isLoading: isProfileLoading } = useOnboarding();
  const { userId } = useAuth();
  const router = useRouter();
  const { hasLoaded } = usePageLoading();
  
  // Load existing LinkedIn services data when userProfile becomes available
  useEffect(() => {
    if (userProfile?.linkedInServices) {
      setDescription(userProfile.linkedInServices);
    }
  }, [userProfile]);

  const handleNext = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Start navigation immediately
      router.prefetch('/onboarding/topics');
      
      // Save data in the background
      const savePromise = updateLinkedInServices(description).then(result => {
        if (!result.success) {
          console.error('Failed to save profile data:', result.error);
        }
        return result;
      });
      
      // Update step in the background
      const stepPromise = goToStep('topics');
      
      // Navigate immediately without waiting
      router.push('/onboarding/topics');
      
      // Continue processing in the background
      Promise.all([savePromise, stepPromise]).catch(error => {
        console.error('Background operations error:', error);
      });
    } catch (error) {
      console.error('Error during navigation:', error);
      // Ensure navigation happens even if there's an error
      router.push('/onboarding/topics');
    }
    // No need to set isSaving to false since we're navigating away
  };

  const handleBack = async () => {
    try {
      await goToStep('welcome');
      router.push('/onboarding/welcome');
    } catch (error) {
      console.error('Error navigating to welcome:', error);
      router.push('/onboarding/welcome');
    }
  };

  // Never show loading when saving/navigating to prevent spinner during navigation
  const showLoading = (!hasLoaded || (hasLoaded && isProfileLoading)) && !isSaving;
  
  return (
    <OnboardingLayout>
      {showLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="size-12 animate-spin text-[#157DFF]" />
          <p className="mt-4 text-[#157DFF] font-medium">Loading your profile...</p>
        </div>
      ) : (
        <div>
          {/* Progress Header */}
          <StepIndicator currentStep="profile" />
          
          {/* Profile Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-10 w-full max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-full overflow-hidden border-2 border-blue-500">
                <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover size-full" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">What products or services do you sell on LinkedIn?</h2>
            </div>

            <p className="text-gray-600 mb-6">
              This will be used as context information when generating content. Don&#39;t worry, you can change it later.
            </p>

            <div className="relative">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[300px] text-gray-700 border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none rounded-xl text-base p-4 w-full"
                placeholder="Tell us about your products or services..."
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <VoiceRecorder 
                  onTranscriptionComplete={(text) => {
                    setDescription(prev => {
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

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-4">
            <Button
              onClick={handleBack}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-10 py-4 rounded-xl font-medium text-lg shadow hover:shadow-md transition-all duration-200"
              size="lg"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="bg-[#157DFF] hover:bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : 'Next'}
            </Button>
          </div>
        </div>
      )}
    </OnboardingLayout>
  )
}
