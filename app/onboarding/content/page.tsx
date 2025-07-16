"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { updateContentType } from "@/app/actions/profile-actions"

export default function KleoContentCreator() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { goToStep, completeOnboarding, userProfile } = useOnboarding()
  const { userId } = useAuth()
  const router = useRouter()
  
  // Pre-select card if user has already selected a content type
  useEffect(() => {
    if (userProfile?.contentType) {
      const index = contentIdeas.findIndex(idea => 
        idea.category.toLowerCase() === userProfile.contentType?.toLowerCase()
      );
      if (index !== -1) {
        setSelectedCard(index);
      }
    }
  }, [userProfile]);

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
    try {
      await goToStep('topics')
      router.push('/onboarding/topics')
    } catch (error) {
      console.error('Error navigating to topics:', error)
      router.push('/onboarding/topics')
    }
  }

  const handleNext = async () => {
    if (selectedCard === null) return;
    
    setIsLoading(true);
    try {
      // Save the selected content type
      const contentType = contentIdeas[selectedCard].category;
      const result = await updateContentType(contentType);
      
      if (!result.success) {
        throw new Error('Failed to update content type');
      }
      
      // Proceed to the next step
      await goToStep('details');
      router.push('/onboarding/details');
    } catch (error) {
      console.error('Error updating content type or navigating:', error);
      router.push('/onboarding/details');
    } finally {
      setIsLoading(false);
    }
  }

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save a default content type if none selected
      if (selectedCard === null) {
        const result = await updateContentType("Custom");
        
        if (!result.success) {
          throw new Error('Failed to update content type');
        }
      }
      
      // Proceed to the next step instead of completing onboarding
      await goToStep('details');
      router.push('/onboarding/details');
    } catch (error) {
      console.error('Error updating content type or navigating:', error);
      router.push('/onboarding/details');
    } finally {
      setIsLoading(false);
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
            <span className="text-gray-700 font-medium">Step 4:</span>
            <span className="text-gray-900 font-semibold">Content</span>
            <div className="flex gap-2 ml-4">
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
            <h2 className="text-2xl font-bold text-gray-900">Let's create your first post</h2>
          </div>

          <p className="text-gray-600 mb-6">
            I've found some post ideas based on your profile. Pick one and we'll create your first post together.
          </p>

          {/* Content Cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {contentIdeas.map((idea, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                  selectedCard === index ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-teal-200"
                }`}
                onClick={() => setSelectedCard(selectedCard === index ? null : index)}
              >
                <CardContent className="p-5">
                  <div className="text-center mb-3">
                    <h3 className="font-semibold text-teal-600 text-sm uppercase tracking-wide mb-2">
                      {idea.category}
                    </h3>
                  </div>

                  <h4 className="font-bold text-gray-900 text-lg mb-3 leading-tight">{idea.title}</h4>

                  <p className="text-gray-600 text-sm leading-relaxed mb-3">{idea.description}</p>

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
          <div className="text-center mt-4 mb-2">
            <Button variant="ghost" className="text-gray-700 hover:text-teal-600 hover:bg-teal-50 font-medium">
              <Plus className="w-4 h-4 mr-2" />
              Show more ideas
            </Button>
          </div>
          
          {/* Bottom Action */}
          <div className="text-center mt-6 border-t border-gray-100 pt-6">
            <Button
              variant="outline"
              className="bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-gray-700 hover:text-teal-700 px-6 py-2 rounded-lg font-medium transition-all duration-200"
              onClick={handleComplete}
            >
              Thank you Kleo, but I already have my own post idea
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
            disabled={selectedCard === null || isLoading}
          >
            {isLoading ? 'Saving...' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
