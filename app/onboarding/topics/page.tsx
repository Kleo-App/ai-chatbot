"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Image from "next/image"
import { useOnboarding } from "@/hooks/use-onboarding"

const sampleTopics = [
  {
    id: 1,
    title: "Building scalable SaaS products from idea to IPO",
    subtitle: "From your Kleo profile",
  },
  {
    id: 2,
    title: "Modern web development: React, Next.js, and the future of frontend",
    subtitle: "From your Kleo profile",
  },
  {
    id: 3,
    title: "AI-powered content creation and automation strategies",
    subtitle: "From your Kleo profile",
  },
  {
    id: 4,
    title: "Startup fundraising: From seed to Series A and beyond",
    subtitle: "From your Kleo profile",
  },
  {
    id: 5,
    title: "Remote team management and building distributed cultures",
    subtitle: "From your Kleo profile",
  },
  {
    id: 6,
    title: "Product-market fit: How to validate and iterate your MVP",
    subtitle: "From your Kleo profile",
  },
  {
    id: 7,
    title: "Growth hacking strategies that actually work in 2024",
    subtitle: "From your Kleo profile",
  },
  {
    id: 8,
    title: "The future of work: AI, automation, and human creativity",
    subtitle: "From your Kleo profile",
  },
]

export default function TopicSelector() {
  const [selectedTopics, setSelectedTopics] = useState<number[]>([])
  const [currentStep] = useState(2)
  const totalSteps = 3
  const { goToStep, completeOnboarding } = useOnboarding()

  const toggleTopic = (topicId: number) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : prev.length < 10 ? [...prev, topicId] : prev,
    )
  }

  const handleBack = async () => {
    await goToStep('profile')
  }

  const handleNext = async () => {
    // Save selected topics if needed
    // Then proceed to the next step
    await goToStep('content');
  }

  const progressPercentage = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image src="/kleo-logo.avif" alt="Kleo" width={40} height={40} className="object-contain" />
            <span className="text-2xl font-bold text-gray-900">Kleo</span>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-600">Step {currentStep}:</span>
            <span className="text-sm font-semibold text-gray-900">Topics</span>
            <div className="flex gap-1 ml-4">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full ${index < currentStep ? "bg-orange-400" : "bg-gray-200"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            Select between 1 to 10 big themes you want to talk about on social media
          </h1>
          <p className="text-lg text-gray-600 mb-4">These will be used to generate your content ideas every week.</p>
          <p className="text-sm text-gray-500">Don't worry, you can always change it later.</p>
        </div>

        {/* Topic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {sampleTopics.map((topic) => (
            <Card
              key={topic.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedTopics.includes(topic.id)
                  ? "ring-2 ring-orange-400 bg-orange-50 border-orange-200"
                  : "hover:border-orange-200 bg-white"
              }`}
              onClick={() => toggleTopic(topic.id)}
            >
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3 leading-snug">{topic.title}</h3>
                <p className="text-sm text-gray-500">{topic.subtitle}</p>
              </CardContent>
            </Card>
          ))}

          {/* Add Custom Topic Card */}
          <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-orange-200 bg-white border-2 border-dashed border-gray-300">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[140px]">
              <Plus className="h-8 w-8 text-orange-400 mb-3" />
              <h3 className="font-semibold text-gray-900">Add custom topic</h3>
            </CardContent>
          </Card>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full ${index === currentStep - 1 ? "bg-orange-400" : "bg-gray-300"}`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            className="px-8 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            size="lg"
            className="px-8 py-3 bg-orange-400 hover:bg-orange-500 text-white"
            disabled={selectedTopics.length === 0}
            onClick={handleNext}
          >
            Continue
          </Button>
        </div>

        {/* Selection Counter */}
        {selectedTopics.length > 0 && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">{selectedTopics.length} of 10 topics selected</p>
          </div>
        )}
      </div>
    </div>
  )
}
