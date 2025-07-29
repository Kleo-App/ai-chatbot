'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { LinkedInPostPreview } from './linkedin-post-preview';
import { PostStatusBadge } from './post-status-badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import type { Document } from '@/lib/db/schema';

interface SelectDraftPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDateTime: Date;
  onPostSelected: (post: Document) => void;
}

export function SelectDraftPostModal({
  isOpen,
  onClose,
  selectedDateTime,
  onPostSelected,
}: SelectDraftPostModalProps) {
  const [draftPosts, setDraftPosts] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Document | null>(null);
  
  const { user } = useUser();

  // Map Clerk user to expected userProfile interface
  const userProfile = user ? {
    fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
    profileImage: user.imageUrl
  } : {
    fullName: 'User',
    profileImage: undefined
  };

  // Fetch draft posts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDraftPosts();
    }
  }, [isOpen]);

  const fetchDraftPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/posts?status=draft');
      if (!response.ok) {
        throw new Error('Failed to fetch draft posts');
      }
      const posts = await response.json();
      setDraftPosts(posts);
    } catch (error) {
      console.error('Error fetching draft posts:', error);
      toast.error('Failed to load draft posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostClick = (post: Document) => {
    setSelectedPost(post);
  };

  const handleScheduleSelected = () => {
    if (selectedPost) {
      onPostSelected(selectedPost);
      setSelectedPost(null);
    }
  };

  const getPreviewContent = (content: string | null) => {
    if (!content) return 'No content';
    
    try {
      const parsedContent = JSON.parse(content);
      if (parsedContent && typeof parsedContent === 'object' && parsedContent.text) {
        return parsedContent.text;
      }
      return content;
    } catch (e) {
      return content;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-divider px-6 py-4">
          <DialogTitle className="text-lg font-medium">
            Pick a draft to schedule for {format(selectedDateTime, 'MMM d')} at {format(selectedDateTime, 'h:mm a')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-0 py-0">
          <div className="px-6 pt-3 pb-6">
            <div className="mb-4 flex flex-row items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">
                Showing {draftPosts.length} draft posts
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : draftPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No draft posts found</h3>
                <p className="text-muted-foreground mb-4">
                  Create some draft posts first to schedule them
                </p>
                <Button onClick={onClose}>
                  Create New Post
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draftPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`cursor-pointer transition-all border rounded-lg p-4 hover:shadow-md ${
                        selectedPost?.id === post.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handlePostClick(post)}
                    >
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm line-clamp-1">{post.title}</h3>
                          <PostStatusBadge status="draft" className="text-[10px] h-5" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                          {getPreviewContent(post.content)}
                        </p>
                      </div>
                      
                      <div className="border rounded-md overflow-hidden">
                        <LinkedInPostPreview
                          content={getPreviewContent(post.content)}
                          userProfile={userProfile}
                          showHeader={false}
                          showDeviceToggle={false}
                          showShareButton={false}
                          showScheduleButton={false}
                          isModal={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPost && (
                  <div className="sticky bottom-0 bg-background border-t border-divider px-6 py-4 mt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm font-medium">
                          "{selectedPost.title}" selected
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setSelectedPost(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleScheduleSelected}>
                          Schedule Post
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 