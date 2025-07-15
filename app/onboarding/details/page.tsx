"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, Mic, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOnboarding } from "@/hooks/use-onboarding"

export default function KleoContentDetails() {
  const [content, setContent] = useState(
    "From Burnout to Brilliance: My Journey Coaching a Team from Skeptical to Supercharged with Automated AI Agents\nPersonal story on transforming workflow pain points with agents.",
  )
  const { goToStep, completeOnboarding } = useOnboarding()

  const handleBack = async () => {
    await goToStep('content')
  }

  const handleNext = async () => {
    // Save content if needed
    // Then proceed to the next step
    await goToStep('style')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <Image src="/kleo-logo.avif" alt="Kleo Logo" width={120} height={40} className="h-10 w-auto" />
          <div className="flex-1"></div>
        </div>

        {/* Centered Step Indicator */}
        <div className="flex justify-center items-center gap-2 text-sm text-gray-600 mb-16">
          <span className="font-medium">Step 4:</span>
          <span className="text-purple-600 font-semibold">Details</span>
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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Good choice! Now, let's fill in the details
          </h1>

          {/* Subheading */}
          <p className="text-xl text-gray-600 mb-12">Please input your ideas and let's create your first post</p>
        </div>

        {/* Content Input Area */}
        <div className="mb-8">
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] p-6 text-lg leading-relaxed border-2 border-gray-200 rounded-2xl bg-white shadow-sm focus:border-purple-300 focus:ring-2 focus:ring-purple-100 resize-none"
              placeholder="Enter your content ideas here..."
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-purple-500 hover:text-purple-600 hover:bg-purple-50"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex justify-center mb-12">
          <Select defaultValue="english">
            <SelectTrigger className="w-48 bg-white border-2 border-gray-200 rounded-full px-4 py-2 shadow-sm hover:border-purple-200">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🇺🇸</span>
                </div>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇺🇸</span>
                  English
                </div>
              </SelectItem>
              <SelectItem value="spanish">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇪🇸</span>
                  Spanish
                </div>
              </SelectItem>
              <SelectItem value="french">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇫🇷</span>
                  French
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
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
            disabled={!content.trim()}
            onClick={handleNext}
          >
            Generate my post
          </Button>
        </div>
      </div>
    </div>
  )
}
