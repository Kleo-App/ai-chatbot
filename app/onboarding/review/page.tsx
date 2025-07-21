"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowRight, ThumbsUp, ThumbsDown, Heart, Share, Edit, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton, useUser , useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { getOrGeneratePosts, savePreferredPost } from "@/app/actions/post-actions"
import type { PostIdea } from "@/lib/ai/post-generator"
import { trackFeedback } from "@/lib/ai/langfuse-client"
import { toast } from "sonner"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"

export default function KleoReviewPublish() {
  const [selectedPost, setSelectedPost] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [postVariations, setPostVariations] = useState<PostIdea[]>([])
  const [error, setError] = useState<string | null>(null)
  const [feedbackState, setFeedbackState] = useState<Record<number, 'liked' | 'disliked' | null>>({})  // Track feedback state for each post
  const { completeOnboarding, goToStep } = useOnboarding()
  const { userId } = useAuth()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  
  // Load or generate posts when the component mounts
  useEffect(() => {
    async function loadPosts() {
      try {
        setIsLoading(true)
        const result = await getOrGeneratePosts()
        
        if (result.success && result.posts) {
          setPostVariations(result.posts)
          
          // Initialize feedback state for all posts
          const initialFeedbackState: Record<number, 'liked' | 'disliked' | null> = {}
          result.posts.forEach(post => {
            initialFeedbackState[post.id] = null
          })
          setFeedbackState(initialFeedbackState)
        } else {
          setError(result.error || 'Failed to load posts')
          toast.error(result.error || 'Failed to load posts')
        }
      } catch (err) {
        console.error('Error loading posts:', err)
        setError('An unexpected error occurred')
        toast.error('An unexpected error occurred while loading posts')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadPosts()
  }, [])
  
  // Handle post selection and saving
  const handleSelectPost = async (postId: number) => {
    try {
      setSelectedPost(postId)
      setIsSaving(true)
      
      const selectedPostContent = postVariations.find(post => post.id === postId)
      if (selectedPostContent) {
        const fullPostContent = JSON.stringify(selectedPostContent)
        await savePreferredPost(fullPostContent)
        toast.success('Post selected and saved')
      }
    } catch (err) {
      console.error('Error saving selected post:', err)
      toast.error('Failed to save your selected post')
    } finally {
      setIsSaving(false)
    }
  }


  // Handle user feedback (thumbs up/down)
  const handleFeedback = async (postId: number, isPositive: boolean) => {
    try {
      if (!userId) {
        console.warn('Cannot track feedback: No user ID available');
        return;
      }

      // Update local state first for immediate UI feedback
      setFeedbackState(prev => ({
        ...prev,
        [postId]: isPositive ? 'liked' : 'disliked'
      }));

      // Find the post
      const post = postVariations.find(p => p.id === postId);
      if (!post) {
        console.warn('Cannot track feedback: Post not found');
        return;
      }

      // Create a trace ID based on post ID and user ID for consistency
      // This allows us to track feedback even without an explicit trace ID
      const generatedTraceId = `post_${postId}_${userId}`;

      // Track feedback in Langfuse
      const success = await trackFeedback(
        generatedTraceId,
        userId,
        isPositive ? 1 : 0,
        `User ${isPositive ? 'liked' : 'disliked'} post ID ${postId}`,
        { 
          postId, 
          postTitle: post.title,
          feedback: isPositive ? 'thumbs_up' : 'thumbs_down'
        }
      );

      if (success) {
        toast.success(`Thank you for your ${isPositive ? 'positive' : 'negative'} feedback!`, {
          duration: 2000,
          position: 'bottom-center'
        });
      }
    } catch (error) {
      console.error('Error tracking feedback:', error);
      toast.error('Unable to record your feedback');
      
      // Revert the UI state on error
      setFeedbackState(prev => ({
        ...prev,
        [postId]: null
      }));
    }
  };

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
      await completeOnboarding();
      // The completeOnboarding function already handles navigation to '/'
      // So we don't need to manually redirect here
    } catch (error) {
      console.error('[ReviewPage] Error completing onboarding:', error);
      // Fallback navigation to home page if completion fails
      router.push('/');
    }
  }

    return (
    <OnboardingLayout currentStep="review">
      <div className="flex w-full flex-col items-center gap-8 text-center">
        <div className="flex w-full flex-col items-center space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-muted-foreground text-xs font-medium tracking-[0.1em] uppercase">
              Final review
            </p>
            <h1 className="w-full text-center text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
              Review & publish your post
            </h1>
            <p className="text-gray-600 max-w-3xl">
              Select one of the variations below to edit and preview before publishing.
            </p>
          </div>
        </div>
        
        <div className="w-full max-w-7xl">

          {/* Post Variations */}
          <div>
            {error ? (
              <div className="flex flex-col items-center justify-center py-12 w-full">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
                  <p className="font-medium">Something went wrong</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
                <Button 
                  onClick={() => router.refresh()}
                  className="bg-[#157DFF] hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Try again
                </Button>
              </div>
            ) : postVariations.length === 0 && isLoading ? (
              // Show skeleton posts while loading
              <div className="grid md:grid-cols-2 gap-6 w-full max-w-6xl">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4" />
                      <div className="space-y-2 mb-4">
                        <div className="h-3 bg-gray-200 rounded" />
                        <div className="h-3 bg-gray-200 rounded w-5/6" />
                        <div className="h-3 bg-gray-200 rounded w-4/6" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-16 bg-gray-200 rounded" />
                        <div className="h-8 w-16 bg-gray-200 rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {postVariations.map((post) => (
                <Card
                  key={post.id}
                  className={`overflow-hidden transition-all duration-200 ${selectedPost === post.id ? 'ring-2 ring-teal-500 shadow-lg' : 'hover:shadow-md'}`}
                >
                  <CardContent className="p-6">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-4">
                      {isLoaded && user?.imageUrl ? (
                        <div className="size-10 rounded-full overflow-hidden">
                          <Image src={user.imageUrl} alt={user.fullName || "User"} width={40} height={40} className="object-cover size-full" />
                        </div>
                      ) : (
                        <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 font-medium">U</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{isLoaded && user?.fullName ? user.fullName : "Creative Professional"}</h3>
                        <p className="text-sm text-gray-600">{isLoaded && user?.publicMetadata?.jobTitle ? String(user.publicMetadata.jobTitle) : "AI Enthusiast"} | {isLoaded && user?.publicMetadata?.company ? String(user.publicMetadata.company) : "Content Creator"}</p>
                        <p className="text-xs text-gray-500">Just now •</p>
                      </div>
                    </div>

                    {/* Post Title */}
                    <h4 className="font-bold text-gray-900 mb-4 leading-tight">
                      {post.title}
                    </h4>

                    {/* Post Content */}
                    <div className="space-y-3 mb-6 text-gray-700">
                      <p className="font-medium">{post.hook}</p>
                      <div className="whitespace-pre-line text-sm">{post.body}</div>
                      <div className="whitespace-pre-line text-sm font-medium">{post.conclusion}</div>
                    </div>

                    {/* Word Count and Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">{post.wordCount} Words</span>
                      <div className="flex items-center gap-1 text-green-600">
                        <div className="size-2 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium">Ready to publish</span>
                      </div>
                    </div>

                    {/* Social Actions */}
                    <div className="flex items-center gap-4 mb-4 text-gray-500">
                      <button 
                        type="button"
                        className={`transition-colors ${feedbackState[post.id] === 'liked' ? 'text-teal-600' : 'hover:text-teal-600'}`}
                        onClick={() => handleFeedback(post.id, true)}
                        disabled={feedbackState[post.id] === 'liked' || feedbackState[post.id] === 'disliked'}
                        aria-label="Like this post"
                      >
                        <ThumbsUp className="size-5" />
                      </button>
                      <button 
                        type="button"
                        className={`transition-colors ${feedbackState[post.id] === 'disliked' ? 'text-red-500' : 'hover:text-red-500'}`}
                        onClick={() => handleFeedback(post.id, false)}
                        disabled={feedbackState[post.id] === 'liked' || feedbackState[post.id] === 'disliked'}
                        aria-label="Dislike this post"
                      >
                        <ThumbsDown className="size-5" />
                      </button>
                      <button type="button" className="hover:text-teal-600 transition-colors">
                        <Heart className="size-5" />
                      </button>
                      <button type="button" className="hover:text-teal-600 transition-colors">
                        <Share className="size-5" />
                      </button>
                      <button type="button" className="hover:text-teal-600 transition-colors">
                        <Edit className="size-5" />
                      </button>
                    </div>

                    {/* Select Button */}
                    <Button
                      className="w-full bg-[#157DFF] hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-200"
                      onClick={() => handleSelectPost(post.id)}
                      disabled={isSaving}
                    >
                      {isSaving && selectedPost === post.id ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : selectedPost === post.id ? (
                        <>
                          <ThumbsUp className="size-4 mr-2" />
                          Selected
                        </>
                      ) : (
                        <>
                          <Edit className="size-4 mr-2" />
                          Select this post
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </div>
          
        </div>
        
        <div className="flex w-full justify-center pt-8">
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleBack}
              className="bg-white/80 backdrop-blur-sm hover:bg-gray-50 text-gray-700 border border-gray-300 px-10 py-6 rounded-full font-medium text-base shadow hover:shadow-md transition-all duration-200"
              disabled={isLoading || isSaving}
            >
              Back
            </Button>
            <Button
              className="bg-[#157DFF] hover:bg-blue-600 text-white px-10 py-6 rounded-full font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px]"
              onClick={handleComplete}
              disabled={isLoading || isSaving || !selectedPost}
            >
              {isLoading || isSaving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  Finish and access the app
                  <ArrowRight className="size-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}
