"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, ArrowRight, Plus, Loader2 } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/hooks/use-onboarding"
import { updateContentType } from "@/app/actions/profile-actions"
import { generateContent, saveSelectedContent } from "@/app/actions/content-actions"
import { ContentIdea } from "@/lib/ai/content-generator"

export default function KleoContentCreator() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  // Don't set a default content type initially to prevent auto-generation
  const [selectedContentType, setSelectedContentType] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { goToStep, completeOnboarding, userProfile } = useOnboarding()
  const { userId } = useAuth()
  const router = useRouter()
  
  // Content types from the mindmap
  const contentTypes = [
    { id: 'monetisable_expertise', name: 'Monetisable Expertise' },
    { id: 'strategic_arbitrage', name: 'Strategic Arbitrage' },
    { id: 'educational', name: 'Educational' },
    { id: 'engaging', name: 'Highly Engaging' }
  ]
  
  // Initialize content type from user profile once on component mount
  useEffect(() => {
    if (!userProfile) return;
    
    // Set the content type from the user profile if available, otherwise default to 'educational'
    if (userProfile.contentType) {
      // Find matching content type
      const matchingType = contentTypes.find(type => 
        type.name.toLowerCase() === userProfile.contentType?.toLowerCase()
      );
      
      if (matchingType) {
        setSelectedContentType(matchingType.id);
      } else {
        // Default to educational if no match found
        setSelectedContentType('educational');
      }
    } else {
      // Default to educational if no content type in profile
      setSelectedContentType('educational');
    }
  }, [userProfile]); // Only depend on userProfile, not contentIdeas
  
  // Set selected card when content ideas change
  useEffect(() => {
    if (!userProfile?.contentDetails || contentIdeas.length === 0) return;
    
    try {
      const savedContent = JSON.parse(userProfile.contentDetails);
      const index = contentIdeas.findIndex(idea => 
        idea.title === savedContent.title
      );
      if (index !== -1) {
        setSelectedCard(index);
      }
    } catch (err) {
      console.error('Error parsing saved content details:', err);
    }
  }, [userProfile, contentIdeas]);
  
  // Store all generated content ideas by content type
  const [contentIdeasByType, setContentIdeasByType] = useState<Record<string, ContentIdea[]>>({});
  const [contentTypeInitialized, setContentTypeInitialized] = useState(false);
  
  // Handle content type changes and load appropriate content
  useEffect(() => {
    // Skip if no content type is selected
    if (!selectedContentType) return;
    
    // Mark that we've initialized the content type
    if (!contentTypeInitialized) {
      setContentTypeInitialized(true);
    }
    
    // Check if we already have generated ideas for this content type
    if (contentIdeasByType[selectedContentType] && contentIdeasByType[selectedContentType].length > 0) {
      setContentIdeas(contentIdeasByType[selectedContentType]);
      return;
    }
    
    // Only generate content if we've initialized the content type
    // This prevents the initial double request
    if (contentTypeInitialized) {
      const generateContentIdeas = async () => {
        setIsGenerating(true);
        setError(null);
        
        try {
          const contentTypeName = contentTypes.find(t => t.id === selectedContentType)?.name || 'Educational';
          const result = await generateContent(contentTypeName);
          
          if (result.success && result.contentIdeas) {
            // Store the generated ideas for this content type
            const newIdeas = result.contentIdeas;
            setContentIdeas(newIdeas);
            setContentIdeasByType(prev => ({
              ...prev,
              [selectedContentType]: newIdeas
            }));
          } else {
            setError(result.error || 'Failed to generate content ideas');
            // Set default content ideas as fallback
            const defaultIdeas = [
              {
                category: contentTypeName,
                title: `The Ultimate Guide to ${contentTypeName}: Building Your Professional Presence in 2025`,
                description:
                  "Step-by-step strategies for creating authentic content, from idea generation to execution with actionable frameworks.",
                tag: "GUIDE",
              },
              {
                category: contentTypeName,
                title: `From Novice to Expert: How I Built My ${contentTypeName} Strategy`,
                description:
                  "Personal journey of developing expertise, including key lessons, mindset shifts, and practical growth strategies.",
                tag: "SUCCESS STORY",
              },
              {
                category: contentTypeName,
                title: `Top 5 ${contentTypeName} Approaches That Actually Work in 2025`,
                description:
                  "Honest review of strategies that deliver results, optimize workflows, and boost professional credibility without excessive effort.",
                tag: "STRATEGY",
              },
            ];
            
            setContentIdeas(defaultIdeas);
            setContentIdeasByType(prev => ({
              ...prev,
              [selectedContentType]: defaultIdeas
            }));
          }
        } catch (err) {
          console.error('Error generating content ideas:', err);
          setError('An unexpected error occurred');
        } finally {
          setIsGenerating(false);
        }
      };
      
      generateContentIdeas();
    }
  }, [selectedContentType, contentIdeasByType, contentTypeInitialized]);

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
      // Save the selected content type and content details
      const contentType = contentIdeas[selectedCard].category;
      const selectedContent = contentIdeas[selectedCard];
      
      // Update content type
      const typeResult = await updateContentType(contentType);
      if (!typeResult.success) {
        throw new Error('Failed to update content type');
      }
      
      // Save selected content details
      const contentResult = await saveSelectedContent(JSON.stringify(selectedContent));
      if (!contentResult.success) {
        console.warn('Failed to save content details:', contentResult.error);
      }
      
      // Proceed to the next step
      router.prefetch('/onboarding/details');
      const stepPromise = goToStep('details');
      router.push('/onboarding/details');
      
      // Complete the background operations without blocking navigation
      stepPromise.catch((error: unknown) => {
        console.error('Background step operation error:', error);
      });
    } catch (error) {
      console.error('Error updating content or navigating:', error);
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
            I've found some post ideas based on your profile. Pick a content type and select an idea to create your first post.
          </p>
          
          {/* Content Type Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Select content type:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {contentTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedContentType === type.id ? "default" : "outline"}
                  className={`h-auto py-3 px-4 ${selectedContentType === type.id ? "bg-teal-500 hover:bg-teal-600" : "bg-white hover:bg-teal-50"}`}
                  onClick={() => setSelectedContentType(type.id)}
                >
                  <span className="text-sm font-medium">{type.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 text-teal-500 animate-spin mb-4" />
              <p className="text-gray-600">Generating content ideas for {contentTypes.find(t => t.id === selectedContentType)?.name}...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isGenerating && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
              <p className="text-red-600 text-sm mt-1">Using default content ideas instead.</p>
            </div>
          )}

          {/* Content Cards */}
          {!isGenerating && (
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
          )}

          {/* Show More Button */}
          {!isGenerating && contentIdeas.length > 0 && (
            <div className="text-center mt-4 mb-2">
              <Button 
                variant="ghost" 
                className="text-gray-700 hover:text-teal-600 hover:bg-teal-50 font-medium"
                onClick={async () => {
                  // Regenerate content ideas for the same type
                  setIsGenerating(true);
                  setError(null);
                  
                  try {
                    const contentTypeName = contentTypes.find(t => t.id === selectedContentType)?.name || 'Educational';
                    const result = await generateContent(contentTypeName);
                    
                    if (result.success && result.contentIdeas) {
                      // Add the new ideas to the existing ones
                      const newIdeas = result.contentIdeas;
                      setContentIdeas(newIdeas);
                      
                      // Update the stored ideas for this content type
                      setContentIdeasByType(prev => ({
                        ...prev,
                        [selectedContentType]: newIdeas
                      }));
                    } else {
                      setError('Failed to generate more content ideas');
                    }
                  } catch (err) {
                    console.error('Error generating more content ideas:', err);
                    setError('An unexpected error occurred');
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate more ideas
              </Button>
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
            disabled={selectedCard === null || isLoading}
          >
            {isLoading ? 'Saving...' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
