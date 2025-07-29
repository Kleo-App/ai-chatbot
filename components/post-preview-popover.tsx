'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, Edit, MoreHorizontal, CalendarX } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import type { Document } from '@/lib/db/schema';

interface PostPreviewPopoverProps {
  post: {
    id: string;
    title: string;
    content: string | null;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    status: 'scheduled' | 'published' | 'draft';
    kind: 'text' | 'image';
    userId: string;
    createdAt: Date;
  };
  children: React.ReactNode;
  onPostUpdated?: () => void; // Callback to refresh the calendar
}

export function PostPreviewPopover({ post, children, onPostUpdated }: PostPreviewPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { user } = useUser();

  // Extract content text
  const getPostContent = () => {
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

  // Handle removing post from calendar
  const handleRemoveFromCalendar = async () => {
    if (post.status !== 'scheduled') {
      toast.error('Only scheduled posts can be removed from calendar');
      return;
    }

    setIsRemoving(true);
    
    try {
      const response = await fetch(`/api/posts/${post.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'draft',
          scheduledAt: null,
          scheduledTimezone: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove post from calendar');
      }

      toast.success('Post removed from calendar and moved to drafts');
      setIsOpen(false); // Close the popover
      onPostUpdated?.(); // Refresh the calendar view
    } catch (error) {
      console.error('Error removing post from calendar:', error);
      toast.error('Failed to remove post from calendar');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleEditPost = async () => {
    try {
      // Try to find the existing chat that created this document
      const response = await fetch(`/api/posts/${post.id}/chat`);
      
      if (response.ok) {
        const { chatId } = await response.json();
        if (chatId) {
          // Navigate to the existing chat with the document
          window.location.href = `/chat/${chatId}?documentId=${post.id}`;
          return;
        }
      }
    } catch (error) {
      console.error('Error finding chat for document:', error);
    }
    
    // Fallback: generate a new chat ID if we can't find the original
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    const chatId = generateUUID();
    window.location.href = `/chat/${chatId}?documentId=${post.id}`;
  };

  // Map user data
  const userProfile = user ? {
    fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
    profileImage: user.imageUrl,
    bio: 'Content Creator' // You can expand this with actual user bio data
  } : {
    fullName: 'User',
    profileImage: undefined,
    bio: 'Content Creator'
  };

  const displayTime = post.scheduledAt || post.createdAt;
  const content = getPostContent();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        side="right" 
        align="start"
        className="w-[400px] max-h-[700px] overflow-y-auto p-0 bg-gradient-to-b from-content3 to-content2 border-divider"
        sideOffset={8}
      >
        <div className="flex flex-col">
          {/* Header with time and category */}
          <div className="flex flex-row justify-between border-b border-divider px-3 pt-2 pb-2">
            <time className="text-muted-foreground text-sm">
              {format(displayTime, 'MMM d, h:mm a (O)')}
            </time>
            <div className="flex w-fit items-center gap-1.5 rounded-md border border-divider border-[0.5px] px-1.5 py-0.5">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              <p className="text-muted-foreground text-[11px] font-medium">
                {post.status === 'published' ? 'Published' : 'Scheduled'}
              </p>
            </div>
          </div>

          {/* User profile section */}
          <div className="flex flex-row gap-2 px-3 pt-3">
            <div className="relative flex shrink-0 overflow-hidden rounded-full h-[32px] w-[32px]">
              {userProfile.profileImage ? (
                <Image 
                  className="aspect-square h-full w-full" 
                  src={userProfile.profileImage}
                  alt={userProfile.fullName}
                  width={32}
                  height={32}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {userProfile.fullName[0]}
                </div>
              )}
            </div>
            <div className="flex w-full flex-col gap-0 leading-snug">
              <span className="text-foreground text-sm leading-snug font-medium">
                {userProfile.fullName}
              </span>
              <span className="text-muted-foreground line-clamp-1 text-xs leading-snug">
                {userProfile.bio}
              </span>
            </div>
          </div>

          {/* Post content */}
          <div className="flex w-full flex-col gap-3 px-3 pt-2 pb-3">
            <div className="text-foreground line-clamp-5 text-sm whitespace-pre-wrap [&_p:empty]:min-h-4">
              {content.split('\n').map((line: string, index: number) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            {/* Media placeholder - can be expanded for images */}
            <div className="flex max-h-[400px] w-full items-center justify-center overflow-hidden rounded-md"></div>
          </div>

          {/* Action buttons */}
          <div className="relative flex w-full flex-row items-center justify-end gap-2 border-t border-divider px-2 py-1">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-default/40 text-default-700 border-divider h-8 text-xs gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:block">Schedule</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="bg-default/40 text-default-700 border-divider h-8 text-xs gap-2"
              onClick={handleEditPost}
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:block">Edit Post</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-default/40 text-default-700 border-divider h-8 w-8 p-0"
                  disabled={isRemoving}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {post.status === 'scheduled' && (
                  <DropdownMenuItem 
                    onClick={handleRemoveFromCalendar}
                    disabled={isRemoving}
                    className="text-sm cursor-pointer focus:bg-accent focus:text-accent-foreground"
                  >
                    <CalendarX className="mr-2 h-4 w-4" />
                    {isRemoving ? 'Removing...' : 'Remove from calendar'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 