"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowLeft, Plus, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton , useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { getOrGenerateHooks, savePreferredHook, getPreferredHook } from "@/app/actions/hook-actions"
import type { HookIdea } from "@/lib/ai/hook-generator"
import { toast } from "sonner"
import { VoiceRecorder } from "@/components/voice-recorder"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"

// Create a user-friendly prompt that will trigger LinkedIn post creation
function createUserFriendlyPrompt(userProfile: any, selectedHook: string): string {
  const topics = userProfile?.selectedTopics ? (() => {
    try {
      const parsedTopics = JSON.parse(userProfile.selectedTopics)
      return Array.isArray(parsedTopics) ? parsedTopics.map((t: any) => t.title).join(" and ") : "business topics"
    } catch {
      return "business topics"
    }
  })() : "business topics"
  
  return `Write a LinkedIn post in the artifact about ${topics} using this hook: "${selectedHook}"`
}

 
export default function KleoHookSelector() {
  const [selectedHook, setSelectedHook] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHook, setIsLoadingHook] = useState(true)
  const [showCustomHookInput, setShowCustomHookInput] = useState(false)
  const [hookOptions, setHookOptions] = useState<Array<{
    id: number
    source: string
    badgeColor: string
    content: string
  }>>([]);
  const [customHook, setCustomHook] = useState<string>("");
  
  const { goToStep, userProfile, completeOnboarding } = useOnboarding()
  const { userId } = useAuth()
  const router = useRouter()
  
  // Load hooks when the component mounts
  useEffect(() => {
    async function loadHooks() {
      try {
        setIsLoadingHook(true)
        console.log('Loading hooks...')
        
        // First check if user has a saved preferred hook
        const savedHookResult = await getPreferredHook()
        console.log('Saved hook result:', savedHookResult)
        
        // Get or generate hooks based on user profile
        const result = await getOrGenerateHooks()
        console.log('Hooks result:', result)
        
        if (result.success && result.hooks) {
          // Format the hooks with badge colors
          const formattedHooks = result.hooks.map((hook: HookIdea) => ({
            id: hook.id,
            source: hook.source,
            badgeColor: "bg-[#157DFF]",
            content: hook.content
          }))
          
          setHookOptions(formattedHooks)
          
          // If user has a saved hook, select it
          if (savedHookResult.hook) {
            const hookIndex = formattedHooks.findIndex((hook) => hook.content === savedHookResult.hook)
            if (hookIndex !== -1) {
              setSelectedHook(formattedHooks[hookIndex].id)
            }
          }
        } else {
          toast.error("Failed to get hooks. Using default options.")
          // Set default hooks if retrieval fails
          setHookOptions([
            {
              id: 1,
              source: "From your writing style",
              badgeColor: "bg-[#157DFF]",
              content: "Burnout nearly destroyed my team — until AI became our secret weapon.",
            },
            {
              id: 2,
              source: "From your topic",
              badgeColor: "bg-[#157DFF]",
              content:
                "From Burnout to Brilliance: My Journey Coaching a Team from Skeptical to Supercharged with Automated AI Agents",
            },
            {
              id: 3,
              source: "From Kleo AI",
              badgeColor: "bg-[#157DFF]",
              content:
                "The moment I realized my team was burning out wasn't when they started missing deadlines—it was when they stopped complaining about them.",
            },
          ])
        }
      } catch (error) {
        console.error('Error loading hooks:', error)
        toast.error("Something went wrong loading hooks. Using default options.")
      } finally {
        setIsLoadingHook(false)
      }
    }
    
    loadHooks()
  }, [])

  const handleBack = async () => {
    try {
      await goToStep('style')
      router.push('/onboarding/style')
    } catch (error) {
      console.error('Error navigating to style:', error)
      router.push('/onboarding/style')
    }
  }

  const handleNext = async () => {
    if (!selectedHook && !customHook) {
      toast.error("Please select a hook or enter a custom hook before proceeding")
      return
    }
    
    setIsLoading(true)
    console.log('Saving preferred hook...')
    
    try {
      let hookToSave = ""
      
      if (customHook) {
        // Use the custom hook if provided
        hookToSave = customHook
      } else {
        // Find the selected hook content
        const selectedHookContent = hookOptions.find((hook) => hook.id === selectedHook)?.content
        
        if (!selectedHookContent) {
          throw new Error('Selected hook not found')
        }
        
        hookToSave = selectedHookContent
      }
      
      // Save the preferred hook
      console.log('Saving hook:', hookToSave)
      const saveResult = await savePreferredHook(hookToSave)
      console.log('Save result:', saveResult)
      
      if (!saveResult.success) {
        console.error('Failed to save hook:', saveResult.error)
        throw new Error(saveResult.error || 'Failed to save hook')
      }
      
      console.log('Hook saved successfully')
      
      // Complete onboarding
      await completeOnboarding()
      
      // Create a clean, user-friendly prompt that will trigger document creation
      const prompt = createUserFriendlyPrompt(userProfile, hookToSave)
      
      // Navigate to main chat page with the prompt - this will create a new chat and start streaming
      const encodedPrompt = encodeURIComponent(prompt)
      router.push(`/?query=${encodedPrompt}`)
    } catch (error) {
      console.error('❌ Error in handleNext:', error)
      
      // If it's a fetch error, show more specific message
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle custom hook input change
  const handleCustomHookChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomHook(e.target.value)
    // Deselect any selected hook when entering a custom one
    if (e.target.value) {
      setSelectedHook(null)
    }
  }
  
  // Toggle custom hook input visibility
  const toggleCustomHookInput = () => {
    setShowCustomHookInput(!showCustomHookInput)
    if (!showCustomHookInput) {
      // When opening the custom hook input, deselect any selected hook
      setSelectedHook(null)
    }
  }

  return (
    <OnboardingLayout>
      <div>
        {/* Progress Header */}
        <StepIndicator currentStep="hook" />

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-10 w-full max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full overflow-hidden border-2 border-blue-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover size-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Choose the hook of your post</h2>
          </div>

          <p className="text-gray-600 mb-6">
            The hook is the first thing your audience will see and is the most important part of your post.
          </p>

          {/* Hook Options */}
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {isLoadingHook ? (
              // Loading state - show skeleton cards
              <>
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-2 border-gray-200 animate-pulse">
                    <CardContent className="p-5">
                      <div className="mb-3">
                        <div className="h-6 w-24 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              // Show actual hook options
              hookOptions.map((hook) => (
                <Card
                  key={hook.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                    selectedHook === hook.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200"
                  }`}
                  onClick={() => setSelectedHook(selectedHook === hook.id ? null : hook.id)}
                >
                  <CardContent className="p-5">
                    <div className="mb-3">
                      <Badge className={`bg-[#157DFF] text-white hover:bg-blue-600`}>{hook.source}</Badge>
                    </div>

                    <p className="text-gray-800 font-medium leading-relaxed text-center">{hook.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          

          
          {/* Custom Hook Button/Input */}
          <div className="text-center mt-6 border-t border-gray-100 pt-6">
            {!showCustomHookInput ? (
              <Button
                variant="outline"
                className="bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                onClick={toggleCustomHookInput}
                disabled={isLoading}
              >
                <Plus className="size-4 mr-2" />
                Add a custom hook
              </Button>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="mb-3 text-center">
                  <h3 className="font-semibold text-gray-800">Your custom hook:</h3>
                </div>
                <div className="relative">
                  <textarea
                    value={customHook}
                    onChange={handleCustomHookChange}
                    placeholder="Enter your own hook here..."
                    className={`w-full p-4 border-2 rounded-lg ${customHook ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-300`}
                    rows={3}
                    disabled={isLoading}
                    autoFocus
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <VoiceRecorder 
                      onTranscriptionComplete={(text) => {
                        setCustomHook(prev => {
                          const newContent = prev ? `${prev}\n${text}` : text;
                          return newContent;
                        });
                        toast.success("Voice transcription added!");
                      }} 
                      className="flex items-center"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-800 mr-2"
                    onClick={() => {
                      setShowCustomHookInput(false)
                      setCustomHook('')
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
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
            disabled={(!selectedHook && !customHook) || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate my post"
            )}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  )
}
