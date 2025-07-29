'use client';

import { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Calendar, GripVertical } from 'lucide-react';
import { PostStatusBadge } from './post-status-badge';
import { PostPreviewPopover } from './post-preview-popover';
import { toast } from 'sonner';
import type { Document } from '@/lib/db/schema';

interface UnscheduledPost {
  id: string;
  title: string;
  content: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  status: 'scheduled' | 'published' | 'draft';
  kind: 'text' | 'image';
  userId: string;
  createdAt: Date;
}

// Helper function to extract text content from post
const getPostContent = (post: UnscheduledPost) => {
  if (!post.content) return post.title;
  
  let textContent = post.content;
  
  try {
    const parsed = JSON.parse(post.content);
    if (parsed && typeof parsed === 'object' && parsed.text) {
      textContent = parsed.text;
    }
  } catch (e) {
    textContent = post.content;
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

const DraggablePost = ({ post, onPostUpdated }: { post: UnscheduledPost; onPostUpdated?: () => void }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'POST',
    item: { id: post.id, post },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const content = getPostContent(post);
  
  return (
    <div
      ref={drag}
      className={`group cursor-move transition-all duration-200 ${
        isDragging ? 'opacity-50 rotate-3 scale-105' : 'opacity-100'
      }`}
      style={{ touchAction: 'manipulation' }} // Allow touch scrolling while still enabling drag
    >
      <PostPreviewPopover post={post} onPostUpdated={onPostUpdated}>
        <div className="bg-white border-divider ease flex flex-col gap-2 rounded-lg border transition-all duration-200 hover:border-foreground/30 hover:shadow-sm p-3 relative">
          <div className="flex items-start gap-2">
            <div className="text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-medium text-sm line-clamp-1 text-foreground">
                  {post.title}
                </h3>
                <PostStatusBadge status="draft" className="text-[10px] h-5 flex-shrink-0" />
              </div>
              <p className="text-foreground text-[13px] leading-snug font-medium tracking-tight line-clamp-3">
                {content}
              </p>
            </div>
          </div>
        </div>
      </PostPreviewPopover>
    </div>
  );
};

interface UnscheduledPostsSidebarProps {
  onPostsChange?: () => void;
}

export function UnscheduledPostsSidebar({ onPostsChange }: UnscheduledPostsSidebarProps) {
  const [unscheduledPosts, setUnscheduledPosts] = useState<UnscheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnscheduledPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/posts?status=draft');
      if (!response.ok) {
        throw new Error('Failed to fetch draft posts');
      }
      const data: Document[] = await response.json();
      const mappedPosts = data
        .map(doc => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          scheduledAt: doc.scheduledAt ? new Date(doc.scheduledAt) : null,
          publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
          status: doc.status as UnscheduledPost['status'],
          kind: doc.kind as UnscheduledPost['kind'],
          userId: doc.userId,
          createdAt: new Date(doc.createdAt),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort newest to oldest
      setUnscheduledPosts(mappedPosts);
    } catch (error) {
      console.error('Error fetching unscheduled posts:', error);
      toast.error('Failed to load unscheduled posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnscheduledPosts();
  }, []);

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(fetchUnscheduledPosts, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Refresh when posts change
  useEffect(() => {
    if (onPostsChange) {
      fetchUnscheduledPosts();
    }
  }, [onPostsChange]);

  return (
    <div className="bg-background border-divider flex w-80 flex-col border-r transition-all duration-300 ease-in-out h-full">
      <div className="border-divider flex items-center gap-2 border-b px-4 py-3 flex-shrink-0">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Unscheduled Posts</h2>
        <div className="ml-auto">
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-xs">
            {unscheduledPosts.length}
          </span>
        </div>
      </div>
      
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch' // Better scrolling on iOS
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : unscheduledPosts.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">No unscheduled posts</p>
            <p className="text-xs text-muted-foreground">
              Create draft posts to schedule them
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-4">
              Drag posts to calendar to schedule them
            </p>
            {unscheduledPosts.map((post) => (
              <DraggablePost key={post.id} post={post} onPostUpdated={fetchUnscheduledPosts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}