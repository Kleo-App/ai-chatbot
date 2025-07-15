"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Image from "next/image"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

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
  const [currentStep] = useState(3)
  const totalSteps = 4
  const { goToStep, completeOnboarding } = useOnboarding()
  const { userId } = useAuth()
  const router = useRouter()

  const toggleTopic = (topicId: number) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : prev.length < 10 ? [...prev, topicId] : prev,
    )
  }

  const handleBack = async () => {
    try {
      console.log('Navigating back to profile page');
      // Try both navigation methods to ensure it works
      await goToStep('profile');
      // As a fallback, use direct router navigation
      router.push('/onboarding/profile');
    } catch (error) {
      console.error('Error navigating back:', error);
      // If the goToStep fails, try direct navigation
      router.push('/onboarding/profile');
    }
  }

  const handleNext = async () => {
    // Save selected topics if needed
    // Then proceed to the next step
    await goToStep('content');
  }

  const progressPercentage = (currentStep / totalSteps) * 100

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
            <span className="text-gray-700 font-medium">Step 3:</span>
            <span className="text-gray-900 font-semibold">Topics</span>
            <div className="flex gap-2 ml-4">
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-10 w-full max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Select between 1 to 10 topics</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Choose between 1 to 10 big themes you want to talk about on social media. These will be used to generate your content ideas every week. Don't worry, you can change these later.
          </p>

          {/* Topic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {sampleTopics.map((topic) => (
              <Card
                key={topic.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedTopics.includes(topic.id)
                    ? "ring-2 ring-teal-400 bg-teal-50 border-teal-200"
                    : "hover:border-teal-200 bg-white"
                }`}
                onClick={() => toggleTopic(topic.id)}
              >
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-2 leading-snug">{topic.title}</h3>
                  <p className="text-sm text-gray-500">{topic.subtitle}</p>
                </CardContent>
              </Card>
            ))}

            {/* Add Custom Topic Card */}
            <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-teal-200 bg-white border-2 border-dashed border-gray-300">
              <CardContent className="p-5 flex flex-col items-center justify-center text-center min-h-[120px]">
                <Plus className="h-8 w-8 text-teal-500 mb-2" />
                <h3 className="font-semibold text-gray-900">Add custom topic</h3>
              </CardContent>
            </Card>
          </div>
          
          {/* Selection Counter */}
          {selectedTopics.length > 0 && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 font-medium">{selectedTopics.length} of 10 topics selected</p>
            </div>
          )}
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
            disabled={selectedTopics.length === 0}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
