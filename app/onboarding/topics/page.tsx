"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Loader2 } from "lucide-react"
import Image from "next/image"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { generateTopics, saveSelectedTopics } from "@/app/actions/topic-actions"
import { TopicSuggestion } from "@/lib/ai/topic-generator"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"

// Default topics will be replaced by AI-generated ones

export default function TopicSelector() {
  const [selectedTopics, setSelectedTopics] = useState<number[]>([])
  const [topics, setTopics] = useState<TopicSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)
  const [customTopicTitle, setCustomTopicTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { goToStep, userProfile } = useOnboarding()
  const router = useRouter()
  
  // Use a ref to track if topics have already been fetched to prevent multiple fetches
  const [topicsFetched, setTopicsFetched] = useState(false);
  
  // Load previously selected topics from user profile
  useEffect(() => {
    if (userProfile?.selectedTopics) {
      try {
        const parsedSelectedTopics = JSON.parse(userProfile.selectedTopics);
        if (Array.isArray(parsedSelectedTopics)) {
          // Extract just the IDs for the selectedTopics state
          const selectedIds = parsedSelectedTopics.map(topic => topic.id);
          setSelectedTopics(selectedIds);
        }
      } catch (err) {
        console.error('Error parsing selected topics:', err);
      }
    }
  }, [userProfile]);
  
  // Fetch AI-generated topics when the page loads, but only once
  useEffect(() => {
    // Skip if we've already fetched topics
    if (topicsFetched || topics.length > 0) return;
    
    const fetchTopics = async () => {
      setIsLoading(true);
      try {
        const result = await generateTopics();
        
        if (result.success && result.topics && result.topics.length > 0) {
          setTopics(result.topics);
          
          // If we have previously selected topics, make sure they exist in our topics list
          if (userProfile?.selectedTopics) {
            try {
              const parsedSelectedTopics = JSON.parse(userProfile.selectedTopics);
              if (Array.isArray(parsedSelectedTopics) && parsedSelectedTopics.length > 0) {
                // Add any selected topics that aren't in our generated list
                const existingIds = result.topics.map(t => t.id);
                const missingTopics = parsedSelectedTopics.filter(t => !existingIds.includes(t.id));
                
                if (missingTopics.length > 0) {
                  setTopics(prev => [...prev, ...missingTopics]);
                }
              }
            } catch (err) {
              console.error('Error processing selected topics:', err);
            }
          }
        } else {
          console.warn('Using fallback topics due to:', result.error);
          // Set some default topics as fallback
          setTopics([
            { id: 1, title: "Building scalable SaaS products", subtitle: "Default suggestion" },
            { id: 2, title: "Modern web development techniques", subtitle: "Default suggestion" },
            { id: 3, title: "AI-powered content creation", subtitle: "Default suggestion" },
            { id: 4, title: "Startup fundraising strategies", subtitle: "Default suggestion" },
            { id: 5, title: "Remote team management", subtitle: "Default suggestion" },
          ]);
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
        setTopicsFetched(true); // Mark as fetched regardless of success/failure
      }
    };
    
    fetchTopics();
    
    // This effect should only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTopic = (topicId: number) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : prev.length < 6 ? [...prev, topicId] : prev,
    )
  }
  
  const addCustomTopic = () => {
    if (!customTopicTitle.trim()) return;
    
    // Create a new topic with an ID that doesn't conflict with existing ones
    const maxId = topics.reduce((max, topic) => Math.max(max, topic.id), 0);
    const newTopic: TopicSuggestion = {
      id: maxId + 1,
      title: customTopicTitle.trim(),
      subtitle: 'Custom topic'
    };
    
    // Add to topics list and select it
    setTopics(prev => [...prev, newTopic]);
    setSelectedTopics(prev => [...prev, newTopic.id]);
    
    // Reset and close dialog
    setCustomTopicTitle('');
    setIsCustomDialogOpen(false);
  }

  const handleBack = async () => {
    try {
      console.log('Navigating back to welcome page');
      // Try both navigation methods to ensure it works
      await goToStep('welcome');
      // As a fallback, use direct router navigation
      router.push('/onboarding/welcome');
    } catch (error) {
      console.error('Error navigating back:', error);
      // If the goToStep fails, try direct navigation
      router.push('/onboarding/welcome');
    }
  }

  const handleNext = async () => {
    setIsSaving(true);
    try {
      // Get the full topic objects for the selected IDs
      const selectedTopicObjects = topics.filter(topic => selectedTopics.includes(topic.id));
      
      // Convert to JSON string for storage
      const topicsJson = JSON.stringify(selectedTopicObjects);
      
      // Save selected topics
      const result = await saveSelectedTopics(topicsJson);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save topics');
      }
      
      // Navigate to next step
      await goToStep('content');
      router.push('/onboarding/content');
    } catch (error) {
      console.error('Error saving topics:', error);
      // Still try to navigate even if there's an error
      router.push('/onboarding/content');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <OnboardingLayout>
      <div>
        {/* Progress Header */}
        <StepIndicator currentStep="topics" />

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full max-w-5xl overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full overflow-hidden border-2 border-blue-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover size-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Select between 1 to 6 topics</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Choose between 1 to 6 big themes you want to talk about on social media. These will be used to generate your content ideas every week. Don&#39;t worry, you can change these later.
          </p>

          {/* Topic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {isLoading ? (
              // Loading state - show skeleton cards
              Array.from({ length: 5 }).map((_, index) => (
                <Card key={`loading-${index}`} className="bg-white">
                  <CardContent className="p-5 flex flex-col items-center justify-center min-h-[120px]">
                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-2/3 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Show only first 5 generated topics
              topics.slice(0, 5).map((topic) => (
                <Card
                  key={topic.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedTopics.includes(topic.id)
                      ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
                      : "hover:border-blue-200 bg-white"
                  }`}
                  onClick={() => toggleTopic(topic.id)}
                >
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-2 leading-snug">{topic.title}</h3>
                    <p className="text-sm text-gray-500">{topic.subtitle}</p>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Add Custom Topic Card */}
            {!isLoading && (
              <Card 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-200 bg-white border-2 border-dashed border-gray-300"
                onClick={() => setIsCustomDialogOpen(true)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="size-5 text-[#157DFF]" />
                    <h3 className="font-semibold text-gray-900 leading-snug">Add custom topic</h3>
                  </div>
                  <p className="text-sm text-gray-500">Create your own topic</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Selection Counter */}
          {selectedTopics.length > 0 && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 font-medium">{selectedTopics.length} of 5 topics selected</p>
            </div>
          )}
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
            className="bg-[#157DFF] hover:bg-blue-600 text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
            disabled={selectedTopics.length === 0 || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : 'Next'}
          </Button>
        </div>
      </div>
      
      {/* Custom Topic Dialog */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Topic</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter your custom topic..."
              value={customTopicTitle}
              onChange={(e) => setCustomTopicTitle(e.target.value)}
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTopic();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCustomDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={addCustomTopic}
              disabled={!customTopicTitle.trim()}
            >
              Add Topic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OnboardingLayout>
  )
}
