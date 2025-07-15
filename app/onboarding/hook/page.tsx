"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function KleoHookSelector() {
  const [selectedHook, setSelectedHook] = useState<number | null>(null)
  const { goToStep } = useOnboarding()
  const { userId } = useAuth()
  const router = useRouter()

  const hookOptions = [
    {
      id: 1,
      source: "From your writing style",
      badgeColor: "bg-teal-500",
      content: "Burnout nearly destroyed my team — until AI became our secret weapon.",
    },
    {
      id: 2,
      source: "From your topic",
      badgeColor: "bg-teal-500",
      content:
        "From Burnout to Brilliance: My Journey Coaching a Team from Skeptical to Supercharged with Automated AI Agents",
    },
    {
      id: 3,
      source: "From Kleo AI",
      badgeColor: "bg-teal-500",
      content:
        "The moment I realized my team was burning out wasn't when they started missing deadlines—it was when they stopped complaining about them.",
    },
  ]

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
    // Save selected hook if needed
    // Then proceed to the next step
    try {
      await goToStep('review')
      router.push('/onboarding/review')
    } catch (error) {
      console.error('Error navigating to review:', error)
      router.push('/onboarding/review')
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
            <span className="text-gray-700 font-medium">Step 7:</span>
            <span className="text-gray-900 font-semibold">Hook</span>
            <div className="flex gap-2 ml-4">
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
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
            <h2 className="text-2xl font-bold text-gray-900">Choose the hook of your post</h2>
          </div>

          <p className="text-gray-600 mb-6">
            The hook is the first thing your audience will see and is the most important part of your post.
          </p>

          {/* Hook Options */}
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {hookOptions.map((hook) => (
              <Card
                key={hook.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                  selectedHook === hook.id ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-200"
                }`}
                onClick={() => setSelectedHook(selectedHook === hook.id ? null : hook.id)}
              >
                <CardContent className="p-5">
                  <div className="mb-3">
                    <Badge className={`bg-teal-500 text-white hover:bg-teal-600`}>{hook.source}</Badge>
                  </div>

                  <p className="text-gray-800 font-medium leading-relaxed text-center">{hook.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Show More Button */}
          <div className="text-center mt-4 mb-2">
            <Button variant="ghost" className="text-gray-700 hover:text-teal-600 hover:bg-teal-50 font-medium">
              <Plus className="w-4 h-4 mr-2" />
              Show more hooks
            </Button>
          </div>
          
          {/* Custom Hook Button */}
          <div className="text-center mt-6 border-t border-gray-100 pt-6">
            <Button
              variant="outline"
              className="bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-gray-700 hover:text-teal-700 px-6 py-2 rounded-lg font-medium transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add a custom hook
            </Button>
          </div>
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
            disabled={!selectedHook}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
