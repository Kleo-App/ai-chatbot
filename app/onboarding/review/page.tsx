"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ArrowRight, ThumbsUp, Heart, Share, Edit, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/hooks/use-onboarding"
import { UserButton, useUser , useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { getOrGeneratePosts, savePreferredPost } from "@/app/actions/post-actions"
import { PostIdea } from "@/lib/ai/post-generator"
import { toast } from "sonner"

export default function KleoReviewPublish() {
  const [selectedPost, setSelectedPost] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [postVariations, setPostVariations] = useState<PostIdea[]>([])
  const [error, setError] = useState<string | null>(null)
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
            <div className="size-10 rounded-full overflow-hidden border-2 border-teal-200">
              <Image src="/images/kleo_square.svg" alt="Kleo" width={40} height={40} className="object-cover size-full" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Review & publish your post</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Select one of the variations below to edit and preview before publishing.
          </p>

          {/* Post Variations */}
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 w-full">
                <Loader2 className="size-12 text-teal-500 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Generating your LinkedIn posts...</p>
                <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 w-full">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
                  <p className="font-medium">Something went wrong</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
                <Button 
                  onClick={() => router.refresh()}
                  className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Try again
                </Button>
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
                        <div className="size-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Ready to publish</span>
                      </div>
                    </div>

                    {/* Social Actions */}
                    <div className="flex items-center gap-4 mb-4 text-gray-500">
                      <button className="hover:text-teal-600 transition-colors">
                        <ThumbsUp className="size-5" />
                      </button>
                      <button className="hover:text-teal-600 transition-colors">
                        <Heart className="size-5" />
                      </button>
                      <button className="hover:text-teal-600 transition-colors">
                        <Share className="size-5" />
                      </button>
                      <button className="hover:text-teal-600 transition-colors">
                        <Edit className="size-5" />
                      </button>
                      <button className="hover:text-teal-600 transition-colors">
                        <Clock className="size-5" />
                      </button>
                    </div>

                    {/* Select Button */}
                    <Button
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-all duration-200"
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
          
          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-6 border-t border-gray-100 pt-6">
            <Button
              onClick={handleBack}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-8 py-3 rounded-xl font-medium shadow hover:shadow-md transition-all duration-200"
              disabled={isLoading || isSaving}
            >
              Back
            </Button>
            <Button
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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
        
        {/* Progress Indicator */}
        <div className="flex justify-center mb-6">
          <div className="size-3 bg-teal-500 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
