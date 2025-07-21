"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useOnboarding } from "@/hooks/use-onboarding"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { VoiceRecorder } from "@/components/voice-recorder"
import { toast } from "sonner"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { updatePostDetails } from "@/app/actions/topic-actions"

export default function PostInformationPage() {
  const [postInformation, setPostInformation] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const { goToStep, userProfile } = useOnboarding();
  const { userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  // Pre-fill the post information from the user's profile
  useEffect(() => {
    if (userProfile?.postDetails) {
      setPostInformation(userProfile.postDetails);
    }
  }, [userProfile]);

  const handleBack = async () => {
    try {
      await goToStep('about');
      router.push('/onboarding/about');
    } catch (error) {
      console.error('Error navigating back:', error);
      router.push('/onboarding/about');
    }
  }

  const handleUseExample = () => {
    const exampleContent = `I'm a software engineer who's passionate about helping developers build better products. I've been working with React and TypeScript for the past 5 years and love sharing what I've learned.

Some topics I'd like to write about:
• Best practices for clean code and maintainable architecture
• My experience transitioning from junior to senior developer
• Common mistakes I see in React applications and how to avoid them
• The importance of testing and how to write effective tests
• Career advice for developers looking to level up their skills

I want to share practical insights that other developers can actually use in their day-to-day work.`;

    setPostInformation(exampleContent);
    toast.success("Example content added!");
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // Save the post information
      const result = await updatePostDetails(postInformation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save post information');
      }
      
      // Navigate to next step
      await goToStep('hook');
      router.push('/onboarding/hook');
    } catch (error) {
      console.error('Error saving post information:', error);
      toast.error('Failed to save post information');
      // Still try to navigate even if there's an error
      router.push('/onboarding/hook');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout currentStep="topics">
      <div className="flex w-full flex-col items-center gap-8 text-center">
        <div className="flex w-full flex-col items-center space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.1em] uppercase">
              Let&apos;s create your content
            </p>
            <h1 className="w-full text-center text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
              Build your first post
            </h1>
            <p className="text-gray-600 max-w-3xl">
              Share topics, notes, and any information we can use to build your first post.
            </p>
          </div>
        </div>
        
        <div className="w-full">
          <div className="relative">
            <div className="relative w-full max-w-2xl pt-8 mx-auto">
              <div className="relative bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-gray-300 focus-within:border-[#157DFF] focus-within:ring-2 focus-within:ring-[#157DFF]/20 rounded-2xl shadow-sm transition-all duration-200">
                <textarea
                  value={postInformation}
                  onChange={(e) => setPostInformation(e.target.value)}
                  className="w-full min-h-[280px] text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none text-base p-6 pb-16 placeholder:text-gray-400"
                  placeholder="What should we write your post about?"
                  maxLength={65000}
                />
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/80 backdrop-blur-sm border-t border-gray-100 rounded-b-2xl flex items-center justify-end px-4 gap-3">
                  <button
                    onClick={handleUseExample}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
                  >
                    Use an example
                  </button>
                  <VoiceRecorder 
                    onTranscriptionComplete={(text) => {
                      setPostInformation(prev => {
                        const newContent = prev ? `${prev}\n${text}` : text;
                        return newContent;
                      });
                      toast.success("Voice transcription added!");
                    }} 
                    className="flex items-center"
                    showText={true}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
                
        <div className="flex w-full justify-center pt-8">
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleBack}
              className="bg-white/80 backdrop-blur-sm hover:bg-gray-50 text-gray-700 border border-gray-300 px-10 py-6 rounded-full font-medium text-base shadow hover:shadow-md transition-all duration-200"
              size="lg"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="bg-[#157DFF] hover:bg-blue-600 text-white px-10 py-6 rounded-full font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 min-w-[120px]"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Continue'}
              {!isLoading && (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
