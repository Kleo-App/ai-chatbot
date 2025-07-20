"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Plus, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/hooks/use-onboarding"
import { updateContentType } from "@/app/actions/profile-actions"
import { generateContent, saveSelectedContent } from "@/app/actions/content-actions"
import type { ContentIdea } from "@/lib/ai/content-generator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"

export default function KleoContentCreator() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  const [selectedContentType, setSelectedContentType] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { goToStep, userProfile } = useOnboarding()
  const router = useRouter()
  
  // Content types from the mindmap
  const contentTypes = useMemo(() => [
    { id: 'monetisable_expertise', name: 'Monetisable Expertise' },
    { id: 'strategic_arbitrage', name: 'Strategic Arbitrage' },
    { id: 'educational', name: 'Educational' },
    { id: 'engaging', name: 'Highly Engaging' }
  ], [])
  
  // Track generation status for each content type
  const [generationStatus, setGenerationStatus] = useState<Record<string, 'idle' | 'loading' | 'complete' | 'error'>>({})  
  
  // Track if we've initialized from the user profile
  const hasInitialized = useRef(false);

  // Function to check if content exists in user profile for a content type
  const checkExistingContent = useCallback((contentType: string): ContentIdea[] | null => {
    if (!userProfile) return null;
    
    // Check for stored content in the user profile
    const storedContentKey = `generatedContent_${contentType.toLowerCase().replace(/\s+/g, '_')}`;
    const storedContent = (userProfile as any)[storedContentKey];
    
    if (storedContent) {
      try {
        const parsedContent = JSON.parse(storedContent);
        if (Array.isArray(parsedContent) && parsedContent.length > 0) {
          console.log(`Found existing content for ${contentType} in database`);
          return parsedContent;
        }
      } catch (e) {
        console.warn(`Failed to parse stored content for ${contentType}:`, e);
      }
    }
    
    console.log(`No existing content found for ${contentType} in database`);
    return null;
  }, [userProfile]);
  
  // Load existing content from database for all content types
  const loadExistingContent = useCallback(() => {
    if (!userProfile) return false;
    
    console.log('Loading existing content from database');
    const loadedContentByType: Record<string, ContentIdea[]> = {};
    const updatedGenerationStatus: Record<string, 'idle' | 'loading' | 'complete' | 'error'> = {};
    let hasAnyContent = false;
    let contentForSelectedType: ContentIdea[] | null = null;
    
    // Check for existing content for each type
    contentTypes.forEach(type => {
      const existingContent = checkExistingContent(type.name);
      if (existingContent) {
        console.log(`Found existing content for ${type.name}`);
        loadedContentByType[type.id] = existingContent;
        updatedGenerationStatus[type.id] = 'complete';
        hasAnyContent = true;
        
        // If we have content for the currently selected type, store it to update later
        if (selectedContentType === type.id) {
          contentForSelectedType = existingContent;
        }
      } else {
        console.log(`No existing content found for ${type.name}`);
      }
    });
    
    if (hasAnyContent) {
      // Batch all state updates together to avoid infinite loops
      if (Object.keys(updatedGenerationStatus).length > 0) {
        setGenerationStatus(prev => ({
          ...prev,
          ...updatedGenerationStatus
        }));
      }
      
      // Update the state with all loaded content at once
      setContentIdeasByType(prev => ({
        ...prev,
        ...loadedContentByType
      }));
      
      // Update selected content if we found it
      if (contentForSelectedType && selectedContentType) {
        setContentIdeas(contentForSelectedType);
      }
      
      // Mark that we've loaded all types to prevent regeneration
      hasLoadedAllTypes.current = true;
      return true;
    }
    
    return false;
  }, [userProfile, contentTypes, checkExistingContent, selectedContentType]);

  // Initialize content type from user profile and trigger content generation for all types
  useEffect(() => {
    // Only run this once when userProfile is available
    if (!userProfile || hasInitialized.current) return;
    
    // Mark as initialized to prevent future runs
    hasInitialized.current = true;
    
    // Set default content type from user profile if available, otherwise default to 'educational'
    let defaultType = 'educational';
    
    if (userProfile.contentType) {
      // Find matching content type
      const matchingType = contentTypes.find(type => 
        type.name.toLowerCase() === userProfile.contentType?.toLowerCase()
      );
      
      if (matchingType) {
        defaultType = matchingType.id;
      }
    }
    
    // Initialize generation status for all content types
    const initialStatus: Record<string, 'idle' | 'loading' | 'complete' | 'error'> = {};
    contentTypes.forEach(type => {
      initialStatus[type.id] = 'idle';
    });
    
    setGenerationStatus(initialStatus);
    
    // IMPORTANT: Always try to load ALL existing content from the database first
    // This ensures we don't regenerate content when returning to this page
    const loadedContent = loadExistingContent();
    
    // Set the selected content type after loading content
    setSelectedContentType(defaultType);
  }, [userProfile, contentTypes, loadExistingContent]);
  
  // Set selected card when content ideas change
  useEffect(() => {
    if (!userProfile?.contentDetails || contentIdeas.length === 0) return;
    
    try {
      // Check if contentDetails is a valid JSON string before parsing
      if (typeof userProfile.contentDetails !== 'string' || !userProfile.contentDetails.trim()) {
        console.warn('Content details is empty or not a string');
        return;
      }
      
      // Try to parse the JSON with additional error handling
      let savedContent: any;
      try {
        savedContent = JSON.parse(userProfile.contentDetails);
      } catch (parseError) {
        console.error('Failed to parse content details JSON:', parseError);
        console.warn('Invalid content details format:', userProfile.contentDetails);
        return;
      }
      
      // Make sure savedContent has the expected structure
      if (!savedContent || typeof savedContent !== 'object' || !savedContent.title) {
        console.warn('Parsed content details has invalid structure:', savedContent);
        return;
      }
      
      const index = contentIdeas.findIndex(idea => 
        idea.title === savedContent.title
      );
      if (index !== -1) {
        setSelectedCard(index);
      }
    } catch (err) {
      console.error('Error handling saved content details:', err);
    }
  }, [contentIdeas, userProfile?.contentDetails]);
  
  // Store all generated content ideas by content type
  const [contentIdeasByType, setContentIdeasByType] = useState<Record<string, ContentIdea[]>>({});
  
  // Function to generate content for a specific type
  // Using useCallback to prevent recreation on each render
  const generateContentForType = useCallback(async (typeId: string, isPriority = true) => {
    // Skip if we already have content for this type in state
    if (contentIdeasByType[typeId] && contentIdeasByType[typeId].length > 0) {
      // If this is the priority type, update the current content ideas
      if (isPriority) {
        setContentIdeas(contentIdeasByType[typeId]);
        setGenerationStatus(prev => ({ ...prev, [typeId]: 'complete' }));
      }
      return;
    }
    
    // Find the content type name
    let contentTypeName = 'Educational';
    for (const type of contentTypes) {
      if (type.id === typeId) {
        contentTypeName = type.name;
        break;
      }
    }
    
    // Check if we have existing content in the database first
    const existingContent = checkExistingContent(contentTypeName);
    if (existingContent) {
      // Use existing content from database
      setContentIdeasByType(prev => ({
        ...prev,
        [typeId]: existingContent
      }));
      
      // If this is the priority type, update the current content ideas
      if (isPriority) {
        setContentIdeas(existingContent);
      }
      
      // Update generation status
      setGenerationStatus(prev => ({ ...prev, [typeId]: 'complete' }));
      
      // No need to show loading state if we found existing content
      if (isPriority) {
        setIsGenerating(false);
      }
      
      return;
    }
    
    // If no existing content, proceed with generation
    // Update generation status
    setGenerationStatus(prev => ({ ...prev, [typeId]: 'loading' }));
    
    // If this is the priority type, show the loading state
    if (isPriority) {
      setIsGenerating(true);
      setError(null);
    }
    
    try {      
      const result = await generateContent(contentTypeName);
      
      if (result.success && result.contentIdeas) {
        // Store the ideas for this content type
        setContentIdeasByType(prev => ({
          ...prev,
          [typeId]: result.contentIdeas || []
        }));
        
        // If this is the priority type, update the current content ideas
        if (isPriority) {
          setContentIdeas(result.contentIdeas);
        }
        
        // Update generation status
        setGenerationStatus(prev => ({ ...prev, [typeId]: 'complete' }));
      } else {
        // Update generation status
        setGenerationStatus(prev => ({ ...prev, [typeId]: 'error' }));
        
        if (isPriority) {
          setError('Failed to generate content ideas');
        }
      }
    } catch (err) {
      console.error(`Error generating content ideas for ${typeId}:`, err);
      
      // Update generation status
      setGenerationStatus(prev => ({ ...prev, [typeId]: 'error' }));
      
      if (isPriority) {
        setError('An unexpected error occurred');
      }
    } finally {
      // If this is the priority type, hide the loading state
      if (isPriority) {
        setIsGenerating(false);
      }
    }
  }, [contentIdeasByType, setContentIdeas, setContentIdeasByType, setGenerationStatus, setIsGenerating, setError, contentTypes, checkExistingContent]);
  
  // Function to generate content for all types, with priority for the selected type
  // Using useCallback to prevent recreation on each render
  const generateAllContentTypes = useCallback(async (priorityType: string) => {
    // First generate the priority type
    await generateContentForType(priorityType);
    
    // Then generate all other types in parallel
    // Use a local copy of contentTypes to avoid dependency issues
    const typesToGenerate = contentTypes.filter(type => type.id !== priorityType);
    await Promise.all(typesToGenerate.map(type => generateContentForType(type.id, false)));
  }, [generateContentForType, contentTypes]);
  
  // Function to regenerate content ideas for the currently selected type
  async function regenerateContentIdeas() {
    setIsGenerating(true);
    setError(null);
    
    try {
      const contentTypeName = contentTypes.find(t => t.id === selectedContentType)?.name || 'Educational';
      const result = await generateContent(contentTypeName);
      
      if (result.success && result.contentIdeas) {
        setContentIdeas(result.contentIdeas);
        
        // Store the ideas for this content type
        setContentIdeasByType(prev => ({
          ...prev,
          [selectedContentType]: result.contentIdeas || []
        }));
      } else {
        setError('Failed to generate content ideas');
      }
    } catch (err) {
      console.error('Error generating content ideas:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  }

  
  // Track if we've generated content for other types
  const hasGeneratedOtherTypes = useRef(false);

  // Track if we've loaded all content types from the database
  const hasLoadedAllTypes = useRef(false);

  // Track if we're currently processing a content type change to prevent infinite loops
  const isProcessingContentChange = useRef(false);
  
  // Handle content type changes and load appropriate content
  useEffect(() => {
    // Skip if no content type is selected
    if (!selectedContentType) return;
    
    // Prevent infinite loops by avoiding re-entry
    if (isProcessingContentChange.current) {
      console.log('Already processing content change, skipping');
      return;
    }
    
    // Set processing flag
    isProcessingContentChange.current = true;
    
    console.log(`Content type changed to ${selectedContentType}`);
    
    // Use an async function to handle the content loading/generation
    const processContentTypeChange = async () => {
      try {
        // Check if we already have generated ideas for this content type in state
        if (contentIdeasByType[selectedContentType] && contentIdeasByType[selectedContentType].length > 0) {
          console.log(`Using existing content for ${selectedContentType} from state`);
          setContentIdeas(contentIdeasByType[selectedContentType]);
          return;
        }
        
        // Find the content type name for the selected type ID
        const selectedTypeName = contentTypes.find(type => type.id === selectedContentType)?.name || 'Educational';
        
        // Check if content exists in database for the selected type
        const existingContent = checkExistingContent(selectedTypeName);
        if (existingContent) {
          console.log(`Loading existing content for ${selectedTypeName} from database`);
          // Batch state updates
          const updates = () => {
            // Update content ideas by type
            setContentIdeasByType(prev => ({
              ...prev,
              [selectedContentType]: existingContent
            }));
            
            // Update current content ideas
            setContentIdeas(existingContent);
            
            // Update generation status
            setGenerationStatus(prev => ({ ...prev, [selectedContentType]: 'complete' }));
          };
          
          updates();
          return;
        }
        
        // Generate content for this type if not already available in state or database
        console.log(`Generating new content for ${selectedTypeName}`);
        await generateContentForType(selectedContentType);
        
        // Only try to load or generate other content types once
        if (!hasGeneratedOtherTypes.current && userProfile && !hasLoadedAllTypes.current) {
          hasGeneratedOtherTypes.current = true;
          hasLoadedAllTypes.current = true;
          
          console.log('Starting background loading/generation for other content types');
          
          // Try to load all content types from database first
          const currentContentTypes = [...contentTypes]; // Create a copy to avoid dependency issues
          const currentSelectedType = selectedContentType; // Capture current value
          
          // Use requestIdleCallback if available, otherwise setTimeout
          const scheduleBackgroundWork = window.requestIdleCallback || setTimeout;
          
          scheduleBackgroundWork(() => {
            const otherTypes = currentContentTypes.filter(type => type.id !== currentSelectedType);
            
            // First try to load all types from database
            let hasAllContent = true;
            const missingTypes: typeof otherTypes = [];
            const batchedUpdates: Record<string, ContentIdea[]> = {};
            const batchedStatus: Record<string, 'idle' | 'loading' | 'complete' | 'error'> = {};
            
            // Check which types need to be generated
            otherTypes.forEach(type => {
              // Skip if we already have this type in state
              if (contentIdeasByType[type.id] && contentIdeasByType[type.id].length > 0) {
                console.log(`Type ${type.name} already in state, skipping`);
                return;
              }
              
              // Check if content exists in database
              const existingContent = checkExistingContent(type.name);
              if (existingContent) {
                // Collect updates to batch them
                batchedUpdates[type.id] = existingContent;
                batchedStatus[type.id] = 'complete';
              } else {
                hasAllContent = false;
                missingTypes.push(type);
              }
            });
            
            // Apply batched updates
            if (Object.keys(batchedUpdates).length > 0) {
              setContentIdeasByType(prev => ({
                ...prev,
                ...batchedUpdates
              }));
              
              setGenerationStatus(prev => ({
                ...prev,
                ...batchedStatus
              }));
            }
            
            // If we're missing any types, generate them sequentially
            if (!hasAllContent && missingTypes.length > 0) {
              console.log(`Need to generate content for ${missingTypes.length} missing types`);
              let index = 0;
              const processNextType = () => {
                if (index < missingTypes.length) {
                  console.log(`Generating content for ${missingTypes[index].name} (${index + 1}/${missingTypes.length})`);
                  generateContentForType(missingTypes[index].id, false)
                    .then(() => {
                      index++;
                      // Use a small delay between requests
                      setTimeout(processNextType, 300);
                    })
                    .catch(() => {
                      // Continue even if one fails
                      index++;
                      setTimeout(processNextType, 300);
                    });
                } else {
                  console.log('Finished generating all missing content types');
                }
              };
              
              processNextType();
            } else {
              console.log('All content types are already available, no need for generation');
            }
          }, { timeout: 1000 });
        }
      } finally {
        // Always reset the processing flag when done
        isProcessingContentChange.current = false;
      }
    };
    
    // Start the async process
    processContentTypeChange();
    
  }, [selectedContentType, contentIdeasByType, userProfile, checkExistingContent, contentTypes, generateContentForType]);

  // Reset initialization flags when component unmounts to ensure proper reloading
  useEffect(() => {
    return () => {
      // This cleanup function runs when the component unmounts
      // We don't reset hasInitialized because we want to keep the initialization state
      // across page navigations to prevent regeneration
      console.log('Content page unmounting - preserving initialization state');
    };
  }, []);
  
  const handleBack = async () => {
    try {
      // Don't reset the initialization flags when going back
      // This ensures we don't regenerate content when returning to this page
      await goToStep('topics');
      router.push('/onboarding/topics');
    } catch (error) {
      console.error('Error navigating to topics:', error);
      router.push('/onboarding/topics');
    }
  }

  const handleNext = async () => {
    if (selectedCard === null) return;
    
    setIsLoading(true);
    
    try {
      // Save the selected content type and content details
      const contentType = contentIdeas[selectedCard].category;
      const selectedContent = contentIdeas[selectedCard];
      
      // Start navigation immediately
      router.prefetch('/onboarding/details');
      
      // Perform these operations in the background without blocking navigation
      Promise.all([
        // Update content type
        updateContentType(contentType).then(typeResult => {
          if (!typeResult.success) {
            console.warn('Failed to update content type:', typeResult.error);
          }
        }),
        
        // Save selected content details
        saveSelectedContent(JSON.stringify(selectedContent)).then(contentResult => {
          if (!contentResult.success) {
            console.warn('Failed to save content details:', contentResult.error);
          }
        }),
        
        // Update step in the background
        goToStep('details').catch(error => {
          console.error('Background step operation error:', error);
        })
      ]).catch(error => {
        console.error('Background operations error:', error);
      });
      
      // Navigate immediately without waiting for background operations
      router.push('/onboarding/details');
    } catch (error) {
      console.error('Error preparing navigation:', error);
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
    <OnboardingLayout>
      {/* Progress Header */}
      <StepIndicator currentStep="content" />

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full max-w-5xl overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full overflow-hidden border-2 border-blue-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover size-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Let&apos;s create your first post</h2>
          </div>

          <p className="text-gray-600 mb-6">
            I&apos;ve found some post ideas based on your profile. Pick a content type and select an idea to create your first post.
          </p>
          
          {/* Content Type Selection */}
          <Tabs 
            value={selectedContentType} 
            onValueChange={setSelectedContentType}
            className="mb-8"
          >
            <TabsList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 bg-transparent h-auto">
              {contentTypes.map((type) => (
                <TabsTrigger 
                  key={type.id} 
                  value={type.id}
                  className={`h-auto py-3 px-4 text-left ${selectedContentType === type.id ? 'data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200' : 'bg-white border-gray-200 text-gray-700'} border rounded-xl relative`}
                >
                  <div className="flex flex-col items-start">
                    <div className="font-semibold">{type.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {type.id === 'monetisable_expertise' && 'Showcase your professional value'}
                      {type.id === 'strategic_arbitrage' && 'Highlight unique market insights'}
                      {type.id === 'educational' && 'Teach concepts and share knowledge'}
                      {type.id === 'engaging' && 'Spark conversation and engagement'}
                    </div>
                  </div>
                  {/* Show loading indicator if this type is being generated */}
                  {generationStatus[type.id] === 'loading' && (
                    <div className="absolute top-1 right-1">
                      <Loader2 className="size-3 animate-spin text-[#157DFF]" />
                    </div>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="size-10 text-[#157DFF] animate-spin mb-4" />
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
                  key={`content-idea-${idea.title}-${index}`}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                    selectedCard === index ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-200"
                  }`}
                  onClick={() => setSelectedCard(selectedCard === index ? null : index)}
                >
                  <CardContent className="p-5">
                    <div className="text-center mb-3">
                      <h3 className="font-semibold text-[#157DFF] text-sm uppercase tracking-wide mb-2">
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
                className="text-gray-700 hover:text-[#157DFF] hover:bg-blue-50 font-medium"
                onClick={regenerateContentIdeas}
                disabled={isGenerating}
              >
                <Plus className="size-4 mr-2" />
                Generate more ideas
              </Button>
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
            disabled={selectedCard === null || isLoading}
          >
            {isLoading ? 'Saving...' : 'Next'}
          </Button>
        </div>
    </OnboardingLayout>
  );
}
