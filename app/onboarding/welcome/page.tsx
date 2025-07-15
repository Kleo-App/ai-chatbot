"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { useOnboarding } from "@/hooks/use-onboarding"

export default function KleoProfileSetup() {
  const [profileText, setProfileText] = useState(
    "I'm a passionate entrepreneur with a deep belief in leveraging technology to create meaningful connections. I graduated from Stanford Business School after spending countless hours building innovative solutions alongside some of the brightest minds in the industry.\n\nBefore that? Marketing and product development, which gave me a unique perspective on both customer needs and technical implementation. I'm a certified digital strategist (with the credentials to prove it), but I'd much rather solve real-world problems than just theorize about solutions.\n\nMy passions: building platforms that actually make people's lives easier, championing sustainable business practices, mentoring the next generation of leaders, and making sure technology serves humanity rather than the other way around.",
  )
  const { goToStep } = useOnboarding();

  const handleNext = async () => {
    // Save the profile text if needed
    // Then proceed to the next step
    await goToStep('profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-gray-700 font-medium">Step 1:</span>
            <span className="text-gray-900 font-semibold">Profile</span>
            <div className="flex gap-2 ml-4">
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Logo Circle */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-teal-100">
            <Image src="/kleo-logo.avif" alt="Kleo Logo" width={80} height={80} className="object-contain" />
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200">
              <Image src="/kleo-logo.avif" alt="Kleo" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Who are you?</h2>
          </div>

          <p className="text-gray-600 mb-6">
            This will be used as context information when generating every post. Don't worry, you can change it later.
          </p>

          <div className="relative">
            <Textarea
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              className="min-h-[300px] text-gray-700 border-gray-300 focus:border-teal-400 focus:ring-teal-400 resize-none rounded-xl"
              placeholder="Tell us about yourself..."
            />
            <div className="absolute bottom-4 right-4 w-1 h-8 bg-teal-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
          <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
        </div>

        {/* Next Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleNext}
            className="bg-teal-500 hover:bg-teal-600 text-white px-12 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
