"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useOnboarding } from "@/hooks/use-onboarding"
import { useRouter } from "next/navigation"
import { VoiceRecorder } from "@/components/voice-recorder"
import { toast } from "sonner"
import { saveContentDetails } from "@/app/actions/details-actions"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"

export default function KleoContentDetails() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const { goToStep, userProfile } = useOnboarding();
  const router = useRouter();
  
  // Initialize with content from postDetails field
  useEffect(() => {
    async function initializeContent() {
      if (!userProfile) return;
      
      try {
        setIsLoadingContent(true);
        
        // Check if we have post details saved in the user profile
        if (userProfile.postDetails) {
          // Load content from postDetails field (dedicated for this page)
          setContent(userProfile.postDetails);
          console.log('Loaded content from postDetails field');
        } else if (userProfile.contentDetails) {
          // For backward compatibility, check contentDetails but filter out JSON
          try {
            JSON.parse(userProfile.contentDetails);
            // If it parsed successfully as an object, it's JSON from the previous step
            // Don't display it - start with empty content instead
            console.log('Found JSON content from previous step, not displaying it');
          } catch (e) {
            // If it's not valid JSON, it's probably plain text that was entered before
            // So we can display it
            setContent(userProfile.contentDetails);
            console.log('Loaded plain text from contentDetails field');
          }
        }
      } catch (error) {
        console.error('Error initializing content:', error);
        toast.error('Failed to load your saved content');
      } finally {
        setIsLoadingContent(false);
      }
    }
    
    initializeContent();
  }, [userProfile]);
  
  // Handle transcription from voice recorder
  const handleTranscription = (text: string) => {
    if (text) {
      // Append the transcribed text to the current content
      setContent(prev => {
        const newContent = prev ? `${prev}\n${text}` : text;
        return newContent;
      });
      
      // Show success toast
      toast.success("Voice transcription added!");
    }
  };

  const handleBack = async () => {
    try {
      await goToStep('content')
      router.push('/onboarding/content')
    } catch (error) {
      console.error('Error navigating to content:', error)
      router.push('/onboarding/content')
    }
  }

  const handleNext = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content before proceeding");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Save the content to the user profile using our server action
      // Make sure we're saving plain text, not JSON
      const result = await saveContentDetails(content);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save content');
      }
      
      // Update the step and navigate
      await goToStep('style');
      router.push('/onboarding/style');
    } catch (error) {
      console.error('Error saving content or navigating:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <OnboardingLayout>
      <div>
        {/* Progress Header */}
        <StepIndicator currentStep="content" />
        
        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 mb-4 md:mb-6 w-full max-w-3xl sm:min-w-[768px]">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full overflow-hidden border-2 border-blue-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover size-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Good choice!</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Please input your ideas and let&#39;s create your first post
          </p>

          {/* Content Input Area */}
          <div className="mb-8">
            <div className="relative">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] p-6 text-lg leading-relaxed border-2 border-gray-200 rounded-2xl bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-blue-500 resize-none"
                placeholder={isLoadingContent ? "Loading your content..." : "Enter your content ideas here..."}
                disabled={isLoadingContent}
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <VoiceRecorder 
                  onTranscriptionComplete={handleTranscription} 
                  className="flex items-center"
                />
              </div>
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
            disabled={!content.trim() || isLoading || isLoadingContent}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  )
}
