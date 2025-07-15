"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, TrendingUp, Smile, Sparkles, BookOpen, Briefcase, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOnboarding } from "@/hooks/use-onboarding"

export default function KleoStyleSelector() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const { goToStep, completeOnboarding } = useOnboarding()

  const styleOptions = [
    { id: "analyse", label: "Analyse", icon: TrendingUp },
    { id: "friendly", label: "Friendly", icon: Smile },
    { id: "inspirational", label: "Inspirational", icon: Sparkles },
    { id: "narrative", label: "Narrative", icon: BookOpen },
    { id: "professional", label: "Professional", icon: Briefcase },
    { id: "promotional", label: "Promotional", icon: Megaphone },
  ]

  const handleBack = async () => {
    await goToStep('details')
  }

  const handleNext = async () => {
    // Save selected style if needed
    // Then proceed to the next step
    await goToStep('hook')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <Image src="/kleo-logo.avif" alt="Kleo Logo" width={120} height={40} className="h-10 w-auto" />
          <div className="flex-1"></div>
        </div>

        {/* Centered Step Indicator */}
        <div className="flex justify-center items-center gap-2 text-sm text-gray-600 mb-16">
          <span className="font-medium">Step 5:</span>
          <span className="text-purple-600 font-semibold">Style</span>
          <div className="flex gap-1 ml-2">
            <div className="w-8 h-2 bg-purple-400 rounded-full"></div>
            <div className="w-8 h-2 bg-purple-400 rounded-full"></div>
            <div className="w-8 h-2 bg-purple-400 rounded-full"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          {/* Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-white rounded-full opacity-90"></div>
              ))}
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 leading-tight">
            Choose the style of your post
          </h1>
        </div>

        {/* Style Selection Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Personal Style Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedStyle === "personal"
                ? "border-purple-400 bg-purple-50"
                : "border-gray-200 hover:border-purple-200"
            }`}
            onClick={() => setSelectedStyle(selectedStyle === "personal" ? null : "personal")}
          >
            <CardContent className="p-6 text-center">
              <h3 className="font-bold text-gray-900 text-lg mb-6">Your personal style</h3>

              <div className="mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                </div>
              </div>

              <div className="bg-purple-100 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-purple-800 text-sm mb-2">
                  You need to have at least 15 published posts to use your own style.
                </p>
                <p className="text-purple-600 text-xs">WARNING: You must already have a good style to use it.</p>
              </div>

              <p className="text-gray-600 text-sm">
                Kleo AI will analyze your last posts to imitate your writing style
              </p>
            </CardContent>
          </Card>

          {/* Another Creator's Style Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedStyle === "creator" ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-200"
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
                ? "border-purple-400 bg-purple-50"
                : "border-gray-200 hover:border-purple-200"
            }`}
            onClick={() => setSelectedStyle(selectedStyle === "predefined" ? null : "predefined")}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 text-lg">From our list of styles</h3>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                  Kleo AI
                </Badge>
              </div>

              <div className="space-y-3">
                {styleOptions.map((style) => {
                  const IconComponent = style.icon
                  return (
                    <div
                      key={style.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      <IconComponent className="w-5 h-5 text-purple-600" />
                      <span className="text-gray-700 font-medium">{style.label}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            className="bg-white border-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50 text-gray-700 hover:text-purple-700 px-8 py-3 rounded-full font-medium transition-all duration-200"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>

          <Button
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={!selectedStyle}
            onClick={handleNext}
          >
            Generate my post
          </Button>
        </div>
      </div>
    </div>
  )
}
