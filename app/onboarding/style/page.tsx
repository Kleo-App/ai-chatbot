"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { TrendingUp, Smile, Sparkles, BookOpen, Briefcase, Megaphone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton , useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { saveStylePreference, getStylePreference } from "@/app/actions/style-actions"

export default function KleoStyleSelector() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStyle, setIsLoadingStyle] = useState(true)
  const { goToStep, userProfile } = useOnboarding()
  const { userId } = useAuth()
  const router = useRouter()
  
  // Load style preference from database on initial render
  useEffect(() => {
    async function loadStylePreference() {
      try {
        setIsLoadingStyle(true)
        console.log('Loading style preference...')
        
        // Get style preference from the database
        const result = await getStylePreference()
        console.log('Style preference result:', result)
        
        if (result.style) {
          console.log('Setting selected style to:', result.style)
          setSelectedStyle(result.style)
        } else {
          console.log('No style preference found in database')
        }
      } catch (error) {
        console.error('Error loading style preference:', error)
      } finally {
        setIsLoadingStyle(false)
      }
    }
    
    loadStylePreference()
  }, [])

  const handleBack = async () => {
    try {
      await goToStep('details')
      router.push('/onboarding/details')
    } catch (error) {
      console.error('Error navigating to details:', error)
      router.push('/onboarding/details')
    }
  }

  const handleNext = async () => {
    if (!selectedStyle) {
      toast.error("Please select a style before proceeding")
      return
    }
    
    setIsLoading(true)
    console.log('Saving style preference:', selectedStyle)
    
    try {
      // First, save the style preference to the user profile without advancing the step
      console.log('Calling saveStylePreference with:', selectedStyle)
      const saveResult = await saveStylePreference(selectedStyle)
      console.log('Save result:', saveResult)
      
      if (!saveResult.success) {
        console.error('Failed to save style preference:', saveResult.error)
        throw new Error(saveResult.error || 'Failed to save style preference')
      }
      
      console.log('Style preference saved successfully')
      
      // Now, update the step and navigate to the next page
      console.log('Updating step to hook and navigating')
      await goToStep('hook')
      router.push('/onboarding/hook')
    } catch (error) {
      console.error('Error saving style or navigating:', error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
      {/* User button for logout in top-right corner */}
      <div className="absolute top-6 right-6 z-10">
        <UserButton afterSignOutUrl="/login" />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Progress Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-gray-700 font-medium">Step 6:</span>
            <span className="text-gray-900 font-semibold">Style</span>
            <div className="flex gap-2 ml-4">
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-10 w-full max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full overflow-hidden border-2 border-teal-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover size-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Choose the style of your post</h2>
          </div>

          <p className="text-gray-600 mb-6">
            The style will determine the tone and voice of your content.
          </p>

          {/* Style Selection Cards */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Kleo Generated Style Card */}
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedStyle === "kleo-generated"
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-200 hover:border-teal-200"
              }`}
              onClick={() => setSelectedStyle(selectedStyle === "kleo-generated" ? null : "kleo-generated")}
            >
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">Kleo-generated style</h3>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="size-12 rounded-full overflow-hidden border-2 border-teal-200">
                    <Image src="/images/kleo_square.svg" alt="Kleo" width={48} height={48} className="object-cover size-full" />
                  </div>
                  <p className="font-semibold text-gray-800">
                    Based on your selections
                  </p>
                </div>

                <p className="text-gray-600 text-sm">
                  Kleo AI will generate content based on your profile and topic selections.
                </p>
              </CardContent>
            </Card>

            {/* Jake's Style Card */}
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedStyle === "jake" ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-200"
              }`}
              onClick={() => setSelectedStyle(selectedStyle === "jake" ? null : "jake")}
            >
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Jake's style</h3>

                <div className="flex justify-center mb-4">
                  <div className="size-16 rounded-full overflow-hidden border-2 border-teal-200">
                    <Image src="/images/jake_headshot.png" alt="Jake" width={64} height={64} className="object-cover size-full" />
                  </div>
                </div>

                <p className="font-semibold text-gray-800 mb-2">Tech Influencer</p>

                <p className="text-gray-600 text-sm">
                  Kleo AI will analyze Jake's writing style for your content.
                </p>
              </CardContent>
            </Card>

            {/* Lara's Style Card */}
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedStyle === "lara" ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-200"
              }`}
              onClick={() => setSelectedStyle(selectedStyle === "lara" ? null : "lara")}
            >
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Lara's style</h3>

                <div className="flex justify-center mb-4">
                  <div className="size-16 rounded-full overflow-hidden border-2 border-teal-200">
                    <Image src="/images/laura_headshot.png" alt="Lara" width={64} height={64} className="object-cover size-full" />
                  </div>
                </div>

                <p className="font-semibold text-gray-800 mb-2">Marketing Expert</p>

                <p className="text-gray-600 text-sm">
                  Kleo AI will analyze Laura's writing style for your content.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-6">
            <div className="size-3 bg-teal-500 rounded-full"></div>
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
              className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
              disabled={!selectedStyle || isLoading || isLoadingStyle}
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
      </div>
    </div>
  )
}
