'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import { PostStatusBadge } from './post-status-badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
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

  const getPreviewContent = (content: string | null) => {
    if (!content) return 'No content';
    
    let textContent = content;
    
    try {
      const parsedContent = JSON.parse(content);
      if (parsedContent && typeof parsedContent === 'object' && parsedContent.text) {
        textContent = parsedContent.text;
      }
    } catch (e) {
      textContent = content;
    }

    // Strip HTML tags to show only plain text
    const stripHtml = (html: string) => {
      return html
        // Handle empty paragraphs (they represent single line breaks)
        .replace(/<p[^>]*>\s*<\/p>/gi, ' ')
        // Handle content paragraphs - extract text and add space
        .replace(/<p[^>]*>([^<]+)<\/p>/gi, '$1 ')
        // Convert br tags to spaces
        .replace(/<br[^>]*>/gi, ' ')
        // Convert div tags to spaces
        .replace(/<\/div>\s*<div[^>]*>/gi, ' ')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<\/div>/gi, ' ')
        // Remove any remaining HTML tags
        .replace(/<[^>]*>/g, '')
        // Clean up multiple spaces and trim
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    // Check if content contains HTML tags
    const hasHtmlTags = /<[^>]*>/.test(textContent);
    return hasHtmlTags ? stripHtml(textContent) : textContent;
  };

  const handlePostSelect = (post: Document) => {
    onPostSelected(post);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-divider px-6 py-4">
          <DialogTitle className="text-lg font-medium flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Pick a draft to schedule for {format(selectedDateTime, 'MMM d')} at {format(selectedDateTime, 'h:mm a')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : draftPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
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
            <div className="p-6">
              <p className="text-muted-foreground text-sm mb-4">
                {draftPosts.length} draft posts available
              </p>
              
              <div className="space-y-3">
                {draftPosts.map((post) => (
                  <div
                    key={post.id}
                    className="group cursor-pointer transition-all border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm"
                    onClick={() => handlePostSelect(post)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-sm line-clamp-1">{post.title}</h3>
                          <PostStatusBadge status="draft" className="text-xs" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {getPreviewContent(post.content)}
                        </p>
                        {post.createdAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {format(new Date(post.createdAt), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostSelect(post);
                        }}
                      >
                        Schedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 