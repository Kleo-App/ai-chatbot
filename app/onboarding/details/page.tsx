"use client"

import { useState } from "react"
import Image from "next/image"
import { Mic, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function KleoContentDetails() {
  const [content, setContent] = useState(
    "",
  )
  const { goToStep } = useOnboarding()
  const { userId } = useAuth()
  const router = useRouter()

  const handleBack = async () => {
    try {
      await goToStep('content')
      router.push('/onboarding/content')
    } catch (error) {
      console.error('Error navigating to content:', error)
      router.push('/onboarding/content')
    }
  }

  const handleNext = async () => {
    // Save content if needed
    // Then proceed to the next step
    try {
      await goToStep('style')
      router.push('/onboarding/style')
    } catch (error) {
      console.error('Error navigating to style:', error)
      router.push('/onboarding/style')
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
            <span className="text-gray-700 font-medium">Step 5:</span>
            <span className="text-gray-900 font-semibold">Details</span>
            <div className="flex gap-2 ml-4">
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
            <h2 className="text-2xl font-bold text-gray-900">Good choice!</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Please input your ideas and let's create your first post
          </p>

          {/* Content Input Area */}
          <div className="mb-8">
            <div className="relative">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] p-6 text-lg leading-relaxed border-2 border-gray-200 rounded-2xl bg-white shadow-sm focus:border-teal-300 focus:ring-2 focus:ring-teal-100 resize-none"
                placeholder="Enter your content ideas here..."
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-teal-500 hover:text-teal-600 hover:bg-teal-50"
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
              <SelectTrigger className="w-48 bg-white border-2 border-gray-200 rounded-full px-4 py-2 shadow-sm hover:border-teal-200">
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
            disabled={!content.trim()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
