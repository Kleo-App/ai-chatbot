"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOnboarding } from "@/hooks/use-onboarding"

export default function KleoHookSelector() {
  const [selectedHook, setSelectedHook] = useState<number | null>(null)
  const { goToStep } = useOnboarding()

  const hookOptions = [
    {
      id: 1,
      source: "From your writing style",
      badgeColor: "bg-purple-500",
      content: "Burnout nearly destroyed my team — until AI became our secret weapon.",
    },
    {
      id: 2,
      source: "From your topic",
      badgeColor: "bg-blue-500",
      content:
        "From Burnout to Brilliance: My Journey Coaching a Team from Skeptical to Supercharged with Automated AI Agents",
    },
    {
      id: 3,
      source: "From Kleo AI",
      badgeColor: "bg-green-500",
      content:
        "The moment I realized my team was burning out wasn't when they started missing deadlines—it was when they stopped complaining about them.",
    },
  ]

  const handleBack = async () => {
    await goToStep('style')
  }

  const handleNext = async () => {
    // Save selected hook if needed
    // Then proceed to the next step
    await goToStep('review')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <Image src="/kleo-logo.avif" alt="Kleo Logo" width={120} height={40} className="h-10 w-auto" />
          <div className="flex-1"></div>
        </div>

        {/* Centered Step Indicator */}
        <div className="flex justify-center items-center gap-2 text-sm text-gray-600 mb-16">
          <span className="font-medium">Step 6:</span>
          <span className="text-purple-600 font-semibold">Hook</span>
          <div className="flex gap-1 ml-2">
            <div className="w-8 h-2 bg-purple-400 rounded-full"></div>
            <div className="w-8 h-2 bg-purple-400 rounded-full"></div>
            <div className="w-8 h-2 bg-purple-400 rounded-full"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-16">
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Choose the hook of your post
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            The hook is the first thing your audience will see and is the most important part of your post.
          </p>
        </div>

        {/* Hook Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {hookOptions.map((hook) => (
            <Card
              key={hook.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedHook === hook.id ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-200"
              }`}
              onClick={() => setSelectedHook(selectedHook === hook.id ? null : hook.id)}
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <Badge className={`${hook.badgeColor} text-white hover:${hook.badgeColor}/90`}>{hook.source}</Badge>
                </div>

                <p className="text-gray-800 font-medium leading-relaxed text-center">{hook.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Show More Button */}
        <div className="text-center mb-16">
          <Button variant="ghost" className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Show more hooks
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">
          <Button
            variant="outline"
            className="bg-white border-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50 text-gray-700 hover:text-purple-700 px-6 py-3 rounded-full font-medium transition-all duration-200"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>

          <Button 
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add a custom hook
          </Button>

          <Button 
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-6 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={handleNext}
            disabled={!selectedHook}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
