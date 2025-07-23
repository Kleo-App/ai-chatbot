"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOnboarding } from "@/hooks/use-onboarding"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { getOrGenerateHooks, savePreferredHook, getPreferredHook } from "@/app/actions/hook-actions"
import type { HookIdea } from "@/lib/ai/hook-generator"
import { toast } from "sonner"

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

  const [hookOptions, setHookOptions] = useState<Array<{
    id: number
    source: string
    badgeColor: string
    content: string
  }>>([]);

  
  const { goToStep, userProfile, completeOnboarding } = useOnboarding()
  const { userId } = useAuth()
  const { user } = useUser()
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
            badgeColor: getBadgeColor(hook.source),
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
              source: "Monetisable Expertise",
              badgeColor: "bg-green-600",
              content: "I turned my biggest career failure into a $50k consulting framework.",
            },
            {
              id: 2,
              source: "Strategic Arbitrage",
              badgeColor: "bg-purple-600",
              content: "While everyone's chasing AI, I'm building the human skills that will be irreplaceable.",
            },
            {
              id: 3,
              source: "Educational",
              badgeColor: "bg-blue-600",
              content: "Here's the 3-step framework that helped me 10x my productivity in 30 days:",
            },
            {
              id: 4,
              source: "Highly Engaging",
              badgeColor: "bg-orange-600",
              content: "My biggest mistake cost me 6 months and $100k. Here's what I learned:",
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
      await goToStep('about')
      router.push('/onboarding/about')
    } catch (error) {
      console.error('Error navigating to about:', error)
      router.push('/onboarding/about')
    }
  }

  const handleNext = async () => {
    if (!selectedHook) {
      toast.error("Please select a hook before proceeding")
      return
    }
    
    setIsLoading(true)
    console.log('Saving preferred hook...')
    
    try {
      let hookToSave = ""
      
      // Find the selected hook content
      const selectedHookContent = hookOptions.find((hook) => hook.id === selectedHook)?.content
      
      if (!selectedHookContent) {
        throw new Error('Selected hook not found')
      }
      
      hookToSave = selectedHookContent
      
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
  

  


  const handleHookSelect = (id: number) => {
    setSelectedHook(id);
  };

  const getBadgeColor = (source: string): string => {
    switch (source) {
      case "Monetisable Expertise":
        return "bg-green-600";
      case "Strategic Arbitrage":
        return "bg-purple-600";
      case "Educational":
        return "bg-blue-600";
      case "Highly Engaging":
        return "bg-orange-600";
      default:
        return "bg-[#157DFF]";
    }
  };



  return (
    <OnboardingLayout currentStep="hook">
      <div className="flex w-full flex-col items-center gap-8 text-center">
        <div className="flex w-full flex-col items-center space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.1em] uppercase">
              Perfect your opening
            </p>
            <h1 className="w-full text-center text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
              Choose the hook of your post
            </h1>
            <p className="text-gray-600 max-w-3xl">
              The hook is the first thing your audience will see and is the most important part of your post.
            </p>
          </div>
        </div>
        
        <div className="w-full max-w-5xl">
          {/* Hook Options */}
          <div className="grid grid-cols-2 gap-5 mb-8">
            {hookOptions.length === 0 && isLoadingHook ? (
              // Show skeleton cards while loading
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-white/80 backdrop-blur-sm border-2 border-gray-200 animate-pulse">
                  <CardContent className="p-5">
                    <div className="mb-3">
                      <div className="h-6 w-24 bg-gray-200 rounded" />
                    </div>
                    <div className="h-20 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))
            ) : (
              hookOptions.map((hook) => (
                <Card
                  key={hook.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                      selectedHook === hook.id
                        ? "bg-blue-50/80 backdrop-blur-sm border-[#157DFF]"
                        : "bg-white/80 backdrop-blur-sm border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleHookSelect(hook.id)}
                  >
                    <CardContent className="p-4">
                      {/* Header with tag */}
                      <div className="mb-4">
                        <Badge className={`${hook.badgeColor} text-white text-xs`}>{hook.source}</Badge>
                      </div>
                      
                      {/* Hook text as LinkedIn post content */}
                      <div>
                        <p className="text-gray-800 text-sm leading-relaxed text-left">{hook.content}</p>
                      </div>
                    </CardContent>
                  </Card>
              ))
            )}
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
              disabled={!selectedHook || isLoading || isLoadingHook}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue'
              )}
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
  )
}
