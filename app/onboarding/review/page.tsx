"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, ThumbsUp, ThumbsDown, Heart, Share, Edit, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton, useUser } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function KleoReviewPublish() {
  const [selectedPost, setSelectedPost] = useState<number | null>(null)
  const { completeOnboarding, goToStep } = useOnboarding()
  const { userId } = useAuth()
  const router = useRouter()
  const { user, isLoaded } = useUser()

  const postVariations = [
    {
      id: 1,
      wordCount: 272,
      content: {
        hook: "I used to think automation meant replacing humans.",
        opening: "I was wrong.",
        body: "Six months ago, my team was drowning:\n\n• Endless Squire data queries\n• Manual reporting nightmares",
      },
    },
    {
      id: 2,
      wordCount: 253,
      content: {
        hook: "I used to think automation meant replacing humans.",
        opening: "I was wrong.",
        body: "My team was drowning in:\n\n• Endless support tickets\n• Repetitive data entry",
      },
    },
    {
      id: 3,
      wordCount: 268,
      content: {
        hook: "I remember the breaking point.",
        opening:
          "My team was drowning in manual tasks.\nBurning midnight oil.\nChasing endless tickets.\nLiving in constant firefighting mode.",
        body: "Sound familiar?",
      },
    },
  ]

  const handleBack = async () => {
    try {
      await goToStep('hook')
      router.push('/onboarding/hook')
    } catch (error) {
      console.error('Error navigating to hook:', error)
      router.push('/onboarding/hook')
    }
  }

  const handleComplete = async () => {
    // Complete the onboarding process
    try {
      await completeOnboarding()
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      router.push('/dashboard')
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
            <span className="text-gray-700 font-medium">Step 8:</span>
            <span className="text-gray-900 font-semibold">Review & publish</span>
            <div className="flex gap-2 ml-4">
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-10 w-full max-w-7xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Review & publish your post</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Select one of the variations below to edit and preview before publishing.
          </p>

          {/* Post Variations */}
          <div className="grid lg:grid-cols-3 gap-5 mb-8">
            {postVariations.map((post) => (
              <Card
                key={post.id}
                className={`transition-all duration-200 hover:shadow-lg border-2 ${
                  selectedPost === post.id ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-200"
                }`}
              >
              <CardContent className="p-6">
                {/* Profile Header */}
                <div className="flex items-start gap-3 mb-4">
                  {isLoaded && user?.imageUrl ? (
                    <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden border-2 border-teal-100">
                      <Image src={user.imageUrl} alt={user.fullName || "User"} width={48} height={48} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-lg">
                      {isLoaded ? `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}` : "KU"}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{isLoaded && user?.fullName ? user.fullName : "Creative Professional"}</h3>
                    <p className="text-sm text-gray-600">AI Enthusiast | Content Creator | Kleo User</p>
                    <p className="text-xs text-gray-500">1d •</p>
                  </div>
                </div>

                {/* Post Title */}
                <h4 className="font-bold text-gray-900 mb-4 leading-tight">
                  From Burnout to Brilliance: My Journey Coaching a Team from Skeptical to Supercharged with Automated
                  AI Agents
                </h4>

                {/* Post Content */}
                <div className="space-y-3 mb-6 text-gray-700">
                  <p className="font-medium">{post.content.hook}</p>
                  <p>{post.content.opening}</p>
                  <div className="whitespace-pre-line text-sm">{post.content.body}</div>
                </div>

                {/* Word Count and Status */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">{post.wordCount} Words</span>
                  <div className="flex items-center gap-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Automatically saved</span>
                  </div>
                </div>

                {/* Social Actions */}
                <div className="flex items-center gap-4 mb-4 text-gray-500">
                  <button className="hover:text-teal-600 transition-colors">
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <button className="hover:text-teal-600 transition-colors">
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                  <button className="hover:text-teal-600 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="hover:text-teal-600 transition-colors">
                    <Share className="w-5 h-5" />
                  </button>
                  <button className="hover:text-teal-600 transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button className="hover:text-teal-600 transition-colors">
                    <Clock className="w-5 h-5" />
                  </button>
                </div>

                {/* Edit Button */}
                <Button
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-all duration-200"
                  onClick={() => setSelectedPost(post.id)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit & preview
                </Button>
              </CardContent>
            </Card>
          ))}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-6 border-t border-gray-100 pt-6">
            <Button
              onClick={handleBack}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-8 py-3 rounded-xl font-medium shadow hover:shadow-md transition-all duration-200"
            >
              Back
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={handleComplete}
            >
              Finish tutorial and access the app
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
          <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
