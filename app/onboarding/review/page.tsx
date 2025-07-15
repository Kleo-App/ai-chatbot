"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, ThumbsUp, ThumbsDown, Heart, Share, Edit, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/hooks/use-onboarding"

export default function KleoReviewPublish() {
  const [selectedPost, setSelectedPost] = useState<number | null>(null)
  const { completeOnboarding } = useOnboarding()

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

  const handleComplete = async () => {
    // Complete the onboarding process
    await completeOnboarding()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <Image src="/kleo-logo.avif" alt="Kleo Logo" width={120} height={40} className="h-10 w-auto" />
          <div className="flex-1"></div>
        </div>

        {/* Centered Step Indicator */}
        <div className="flex justify-center items-center gap-2 text-sm text-gray-600 mb-8">
          <span className="font-medium">Step 7:</span>
          <span className="text-purple-600 font-semibold">Review & publish</span>
          <div className="flex gap-1 ml-2">
            <div className="w-8 h-2 bg-purple-400 rounded-full"></div>
            <div className="w-8 h-2 bg-purple-400 rounded-full"></div>
            <div className="w-8 h-2 bg-purple-400 rounded-full"></div>
          </div>
        </div>

        {/* Finish Tutorial Button */}
        <div className="flex justify-center mb-12">
          <Button 
            className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={handleComplete}
          >
            Finish tutorial and access the app
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Post Variations */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {postVariations.map((post) => (
            <Card
              key={post.id}
              className={`transition-all duration-200 hover:shadow-lg border-2 ${
                selectedPost === post.id ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-200"
              }`}
            >
              <CardContent className="p-6">
                {/* Profile Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">Creative Professional</h3>
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
                  <button className="hover:text-purple-600 transition-colors">
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <button className="hover:text-purple-600 transition-colors">
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                  <button className="hover:text-purple-600 transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="hover:text-purple-600 transition-colors">
                    <Share className="w-5 h-5" />
                  </button>
                  <button className="hover:text-purple-600 transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button className="hover:text-purple-600 transition-colors">
                    <Clock className="w-5 h-5" />
                  </button>
                </div>

                {/* Edit Button */}
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-full font-medium transition-all duration-200"
                  onClick={() => setSelectedPost(post.id)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit & preview
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
