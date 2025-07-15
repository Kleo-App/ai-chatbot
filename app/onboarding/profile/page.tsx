"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useOnboarding } from "@/hooks/use-onboarding"

export default function ProfileSetup() {
  const [description, setDescription] = useState("")
  const { goToStep } = useOnboarding();

  const handleNext = async () => {
    // Save the description if needed
    // Then proceed to the next step
    await goToStep('topics');
  };

  const handleBack = async () => {
    await goToStep('welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-slate-600 font-medium">Step 1: Profile</span>
            <div className="flex items-center gap-2 ml-4">
              <div className="w-8 h-2 bg-amber-500 rounded-full"></div>
              <div className="w-8 h-2 bg-slate-300 rounded-full"></div>
              <div className="w-8 h-2 bg-slate-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Logo Circle */}
        <div className="flex justify-center mb-12">
          <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-20 h-20 relative">
              <Image src="/kleo-logo.avif" alt="Kleo Logo" fill className="object-contain filter brightness-0 invert" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">What products or services do you offer with Kleo?</h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            This will be used as context information when generating content. Don't worry, you can change it later.
          </p>
        </div>

        {/* Input Area */}
        <div className="mb-12">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="I help teams, founders, and indie hackers harness the real power of AI—with a focus on practical tools, no-nonsense education, and frictionless development workflows.

My flagship product is the 'Kleo Assistant' ecosystem, built around intelligent automation where clients can streamline their workflows, get transparent insights, and connect with AI-powered solutions that deliver exactly what they want—no complexity, just fast results."
            className="min-h-[200px] text-base leading-relaxed resize-none border-slate-200 focus:border-amber-500 focus:ring-amber-500 bg-white shadow-sm"
          />
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            className="px-8 py-3 text-slate-600 border-slate-300 hover:bg-slate-50 bg-transparent"
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            size="lg"
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
