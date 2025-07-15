"use client"

import { useState } from "react"
import Image from "next/image"
import { TrendingUp, Smile, Sparkles, BookOpen, Briefcase, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function KleoStyleSelector() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const { goToStep } = useOnboarding()
  const { userId } = useAuth()
  const router = useRouter()

  const styleOptions = [
    { id: "analyse", label: "Analyse", icon: TrendingUp },
    { id: "friendly", label: "Friendly", icon: Smile },
    { id: "inspirational", label: "Inspirational", icon: Sparkles },
    { id: "narrative", label: "Narrative", icon: BookOpen },
    { id: "professional", label: "Professional", icon: Briefcase },
    { id: "promotional", label: "Promotional", icon: Megaphone },
  ]

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
    // Save selected style if needed
    // Then proceed to the next step
    try {
      await goToStep('hook')
      router.push('/onboarding/hook')
    } catch (error) {
      console.error('Error navigating to hook:', error)
      router.push('/onboarding/hook')
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
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Choose the style of your post</h2>
          </div>

          <p className="text-gray-600 mb-6">
            The style will determine the tone and voice of your content.
          </p>

          {/* Style Selection Cards */}
          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {/* Personal Style Card */}
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedStyle === "personal"
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-200 hover:border-teal-200"
              }`}
              onClick={() => setSelectedStyle(selectedStyle === "personal" ? null : "personal")}
            >
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-gray-900 text-lg mb-6">Your personal style</h3>

                <div className="flex justify-center gap-2 mb-6">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                </div>

                <div className="bg-teal-100 border border-teal-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-teal-800 text-sm mb-2">
                    You need to have at least 15 published posts to use your own style.
                  </p>
                  <p className="text-teal-600 text-xs">WARNING: You must already have a good style to use it.</p>
                </div>

                <p className="text-gray-600 text-sm">
                  Kleo AI will analyze your last posts to imitate your writing style
                </p>
              </CardContent>
            </Card>

            {/* Another Creator's Style Card */}
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedStyle === "creator" ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-200"
              }`}
              onClick={() => setSelectedStyle(selectedStyle === "creator" ? null : "creator")}
            >
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-gray-900 text-lg mb-6">Another creator's style</h3>

                <div className="flex justify-center gap-2 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  ))}
                </div>

                <p className="font-semibold text-gray-800 mb-4">You can choose any creator you want.</p>

                <p className="text-gray-600 text-sm">
                  Kleo AI will analyze the last posts of another creator of your choice.
                </p>
              </CardContent>
            </Card>

            {/* Predefined Styles Card */}
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedStyle === "predefined"
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-200 hover:border-teal-200"
              }`}
              onClick={() => setSelectedStyle(selectedStyle === "predefined" ? null : "predefined")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 text-lg">From our list of styles</h3>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 hover:bg-teal-200">
                    Kleo AI
                  </Badge>
                </div>

                <div className="space-y-3">
                  {styleOptions.map((style) => {
                    const IconComponent = style.icon
                    return (
                      <div
                        key={style.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-teal-50 transition-colors"
                      >
                        <IconComponent className="w-5 h-5 text-teal-600" />
                        <span className="text-gray-700 font-medium">{style.label}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-6">
            <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
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
              disabled={!selectedStyle}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
