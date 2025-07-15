"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/hooks/use-onboarding"

export default function KleoContentCreator() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const { goToStep, completeOnboarding } = useOnboarding()

  const contentIdeas = [
    {
      category: "Educational",
      title: "The Ultimate Guide to Personal Branding: Building Your Digital Presence in 2025",
      description:
        "Step-by-step strategies for creating authentic personal brand, from social media optimization to content planning with actionable frameworks.",
      tag: "GUIDE",
    },
    {
      category: "Inspirational",
      title: "From Side Hustle to Success: How I Built a 6-Figure Business While Working Full-Time",
      description:
        "Personal journey of balancing entrepreneurship with career, including time management tips, mindset shifts, and practical growth strategies.",
      tag: "SUCCESS STORY",
    },
    {
      category: "Trending",
      title: "AI Tools That Actually Save Time: My Top 10 Productivity Game-Changers for Creators",
      description:
        "Honest review of AI tools that streamline content creation, automate workflows, and boost productivity without breaking the bank.",
      tag: "TECH REVIEW",
    },
  ]

  const handleBack = async () => {
    await goToStep('topics')
  }

  const handleNext = async () => {
    // Save selected topics if needed
    // Then proceed to the next step
    await goToStep('details')
  }

  const handleComplete = async () => {
    // Complete the onboarding process
    await completeOnboarding()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8">
          <Image src="/kleo-logo.avif" alt="Kleo Logo" width={120} height={40} className="h-10 w-auto" />
          <div className="flex-1"></div>
        </div>

        {/* Centered Step Indicator */}
        <div className="flex justify-center items-center gap-2 text-sm text-gray-600 mb-8">
          <span className="font-medium">Step 3:</span>
          <span className="text-purple-600 font-semibold">Content</span>
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
            Let's create your first post
          </h1>

          {/* Personalized Message */}
          <p className="text-xl text-gray-700 mb-4">
            Ok <span className="font-semibold text-purple-600">Creative Professional</span>, I just found these post
            ideas for you:
          </p>

          <p className="text-gray-600 mb-12">Pick one and let's create your first post</p>
        </div>

        {/* Content Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {contentIdeas.map((idea, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedCard === index ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-200"
              }`}
              onClick={() => setSelectedCard(selectedCard === index ? null : index)}
            >
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-purple-600 text-sm uppercase tracking-wide mb-2">
                    {idea.category}
                  </h3>
                </div>

                <h4 className="font-bold text-gray-900 text-lg mb-4 leading-tight">{idea.title}</h4>

                <p className="text-gray-600 text-sm leading-relaxed mb-4">{idea.description}</p>

                <div className="text-center">
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wide">
                    {idea.tag}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Show More Button */}
        <div className="text-center mb-8">
          <Button variant="ghost" className="text-gray-700 hover:text-purple-600 hover:bg-purple-50 font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Show more ideas
          </Button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-4 mb-8">
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
            className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white"
            onClick={handleNext}
            disabled={selectedCard === null}
          >
            Continue
          </Button>
        </div>

        {/* Bottom Action */}
        <div className="text-center">
          <Button
            variant="outline"
            className="bg-white border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 hover:text-purple-700 px-8 py-3 rounded-full font-medium transition-all duration-200"
            onClick={handleComplete}
          >
            Thank you Kleo, but I already have my own post idea
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
