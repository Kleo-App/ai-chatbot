"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Loader2 } from "lucide-react"
import Image from "next/image"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { generateTopics, saveSelectedTopics } from "@/app/actions/topic-actions"
import { TopicSuggestion } from "@/lib/ai/topic-generator"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// Default topics will be replaced by AI-generated ones

export default function TopicSelector() {
  const [selectedTopics, setSelectedTopics] = useState<number[]>([])
  const [currentStep] = useState(3)
  const totalSteps = 4
  const [topics, setTopics] = useState<TopicSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false)
  const [customTopicTitle, setCustomTopicTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { goToStep, userProfile } = useOnboarding()
  const { userId } = useAuth()
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
            { id: 6, title: "Product-market fit strategies", subtitle: "Default suggestion" },
            { id: 7, title: "Growth hacking for 2024", subtitle: "Default suggestion" },
            { id: 8, title: "Future of work and automation", subtitle: "Default suggestion" },
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
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : prev.length < 10 ? [...prev, topicId] : prev,
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
      console.log('Navigating back to profile page');
      // Try both navigation methods to ensure it works
      await goToStep('profile');
      // As a fallback, use direct router navigation
      router.push('/onboarding/profile');
    } catch (error) {
      console.error('Error navigating back:', error);
      // If the goToStep fails, try direct navigation
      router.push('/onboarding/profile');
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

  const progressPercentage = (currentStep / totalSteps) * 100

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
            <span className="text-gray-700 font-medium">Step 3:</span>
            <span className="text-gray-900 font-semibold">Topics</span>
            <div className="flex gap-2 ml-4">
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-teal-500 rounded-full"></div>
              <div className="w-8 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-10 w-full max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Select between 1 to 10 topics</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Choose between 1 to 10 big themes you want to talk about on social media. These will be used to generate your content ideas every week. Don't worry, you can change these later.
          </p>

          {/* Topic Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {isLoading ? (
              // Loading state - show skeleton cards
              Array.from({ length: 9 }).map((_, index) => (
                <Card key={`loading-${index}`} className="bg-white">
                  <CardContent className="p-5 flex flex-col items-center justify-center min-h-[120px]">
                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-2/3 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Show generated topics
              topics.map((topic) => (
                <Card
                  key={topic.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedTopics.includes(topic.id)
                      ? "ring-2 ring-teal-400 bg-teal-50 border-teal-200"
                      : "hover:border-teal-200 bg-white"
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
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-teal-200 bg-white border-2 border-dashed border-gray-300"
                onClick={() => setIsCustomDialogOpen(true)}
              >
                <CardContent className="p-5 flex flex-col items-center justify-center text-center min-h-[120px]">
                  <Plus className="h-8 w-8 text-teal-500 mb-2" />
                  <h3 className="font-semibold text-gray-900">Add custom topic</h3>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Selection Counter */}
          {selectedTopics.length > 0 && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 font-medium">{selectedTopics.length} of 10 topics selected</p>
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
            disabled={selectedTopics.length === 0 || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    </div>
  )
}
