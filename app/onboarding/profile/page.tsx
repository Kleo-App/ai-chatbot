"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function ProfileSetup() {
  const [description, setDescription] = useState("")
  const { goToStep } = useOnboarding();
  const { userId } = useAuth();
  const router = useRouter();

  const handleNext = async () => {
    // Save the description if needed
    // Then proceed to the next step
    try {
      await goToStep('topics');
      router.push('/onboarding/topics');
    } catch (error) {
      console.error('Error navigating to topics:', error);
      router.push('/onboarding/topics');
    }
  };

  const handleBack = async () => {
    try {
      await goToStep('welcome');
      router.push('/onboarding/welcome');
    } catch (error) {
      console.error('Error navigating to welcome:', error);
      router.push('/onboarding/welcome');
    }
  };

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
            <span className="text-gray-700 font-medium">Step 2:</span>
            <span className="text-gray-900 font-semibold">Profile Details</span>
            <div className="flex gap-2 ml-4">
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-10 w-full max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">What products or services do you sell on LinkedIn?</h2>
          </div>

          <p className="text-gray-600 mb-6">
            This will be used as context information when generating content. Don't worry, you can change it later.
          </p>

          <div className="relative">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[300px] text-gray-700 border-gray-300 focus:border-teal-400 focus:ring-teal-400 resize-none rounded-xl text-base p-4 w-full"
              placeholder="Tell us about your products or services..."
            />
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
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
