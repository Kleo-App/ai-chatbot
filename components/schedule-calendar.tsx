'use client';

import React, { useState, useEffect } from 'react';
import { DndProvider, useDrop, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Settings, Plus, Calendar, CalendarDays, MapPin, Clock } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getWeeksInMonth } from 'date-fns';
import { PostStatusBadge } from './post-status-badge';
import { SelectDraftPostModal } from './select-draft-post-modal';
import { PostPreviewPopover } from './post-preview-popover';
import { UnscheduledPostsSidebar } from './unscheduled-posts-sidebar';
import { toast } from 'sonner';
import type { Document } from '@/lib/db/schema';

// Timezone utility functions
const formatInTimezone = (date: Date, timezone: string, formatStr: string = 'h:mm a'): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: formatStr.includes('a'),
    }).format(date);
  } catch (error) {
    // Fallback to local time if timezone is invalid
    return format(date, formatStr);
  }
};

const getCurrentTimeInTimezone = (timezone: string): Date => {
  try {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc + (getTimezoneOffsetMs(timezone)));
    return targetTime;
  } catch (error) {
    return new Date();
  }
};

const getTimezoneOffsetMs = (timezone: string): number => {
  try {
    const now = new Date();
    const localTime = now.getTime();
    const utc = localTime + (now.getTimezoneOffset() * 60000);
    
    // Create date in target timezone
    const targetDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const targetTime = targetDate.getTime();
    
    // Calculate offset
    return targetTime - utc;
  } catch (error) {
    return 0;
  }
};

const getTimezoneAbbreviation = (timezone: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(new Date());
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart?.value || timezone.split('/').pop() || 'UTC';
  } catch (error) {
    return 'UTC';
  }
};

// Convert a scheduled post time from its original timezone to the viewing timezone
const convertPostTimeToViewingTimezone = (post: ScheduledPost, viewingTimezone: string): Date | null => {
  if (!post.scheduledAt) {
    return post.scheduledAt;
  }

  // If no original timezone was stored, treat as current viewing timezone
  if (!post.scheduledTimezone) {
    return post.scheduledAt;
  }

  try {
    // If the post was scheduled in the same timezone we're viewing, no conversion needed
    if (post.scheduledTimezone === viewingTimezone) {
      return post.scheduledAt;
    }
    
    // Use a simpler, more reliable conversion approach
    const originalTime = new Date(post.scheduledAt);
    
    // Get what time this would be in the original timezone
    const timeInOriginalTz = new Intl.DateTimeFormat('en-US', {
      timeZone: post.scheduledTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    });
    
    // Get what time this same moment would be in the viewing timezone  
    const timeInViewingTz = new Intl.DateTimeFormat('en-US', {
      timeZone: viewingTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    });
    
    const originalFormatted = timeInOriginalTz.format(originalTime);
    const viewingFormatted = timeInViewingTz.format(originalTime);
    
    // Parse the viewing timezone time back to a Date object
    const parts = viewingFormatted.split(', ');
    const datePart = parts[0]; // MM/DD/YYYY
    const timePart = parts[1].split(' ')[0]; // HH:MM:SS
    
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    const convertedDate = new Date();
    convertedDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
    convertedDate.setHours(parseInt(hour), parseInt(minute), parseInt(second), 0);
    
    return convertedDate;
    
  } catch (error) {
    console.error('Error converting post timezone:', error);
    return post.scheduledAt;
  }
};

const getTimezoneOffsetMinutes = (timezone: string): number => {
  try {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const targetTime = targetDate.getTime();
    return (targetTime - utc) / 60000; // Convert to minutes
  } catch (error) {
    return 0;
  }
};

interface ScheduledPost {
  id: string;
  title: string;
  content: string | null;
  scheduledAt: Date | null;
  scheduledTimezone: string | null;
  publishedAt: Date | null;
  status: 'scheduled' | 'published' | 'draft';
  kind: 'text' | 'image';
  userId: string;
  createdAt: Date;
}

const StatusIcon = ({ status }: { status: ScheduledPost['status'] }) => {
  if (status === 'published') {
    return (
      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4 text-primary">
        <g>
          <circle cx="9" cy="9" fill="none" r="7.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></circle>
          <path d="M5.5,9c.863,.867,1.537,1.868,2.1,2.962,1.307-2.491,2.94-4.466,4.9-5.923" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
        </g>
      </svg>
    );
  }
  
  return (
    <Clock className="size-4 text-foreground" />
  );
};

// Helper function to extract text content from post
const getPostContent = (post: ScheduledPost) => {
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

const PostCard = ({ post, onPostUpdated }: { post: ScheduledPost; onPostUpdated?: () => void }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'POST',
    item: { id: post.id, post, isScheduled: true },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const content = getPostContent(post);
  
  return (
    <div
      ref={drag as any}
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-50 rotate-1 scale-105 cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {isDragging ? (
        <div className="bg-white border-divider ease flex flex-col items-center justify-between gap-1.5 rounded-lg border transition-all duration-200 hover:border-foreground/30 p-2 relative z-50">
          <div className="w-full">
            <div className="flex w-full flex-row items-start justify-between gap-2">
              <div className="flex size-4 shrink-0 items-center justify-start">
                <StatusIcon status={post.status} />
              </div>
              <p className="text-foreground w-full text-[13px] leading-snug font-medium tracking-tight line-clamp-2">
                {content}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <PostPreviewPopover post={post} onPostUpdated={onPostUpdated}>
          <div className="bg-white border-divider ease flex flex-col items-center justify-between gap-1.5 rounded-lg border transition-all duration-200 hover:border-foreground/30 p-2 relative z-50">
            <div className="w-full">
              <div className="flex w-full flex-row items-start justify-between gap-2">
                <div className="flex size-4 shrink-0 items-center justify-start">
                  <StatusIcon status={post.status} />
                </div>
                <p className="text-foreground w-full text-[13px] leading-snug font-medium tracking-tight line-clamp-2">
                  {content}
                </p>
              </div>
            </div>
          </div>
        </PostPreviewPopover>
      )}
    </div>
  );
};

const TimeSlot = ({ 
  hour, 
  posts, 
  date, 
  onTimeSlotClick,
  onPostDropped,
  onPostUpdated,
  isLast = false
}: { 
  hour: number; 
  posts: ScheduledPost[]; 
  date: Date; 
  onTimeSlotClick: (date: Date, hour: number) => void; 
  onPostDropped: (postId: string, date: Date, hour: number) => void;
  onPostUpdated?: () => void;
  isLast?: boolean;
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'POST',
    drop: (item: { id: string; post: any; isScheduled?: boolean }) => {
      onPostDropped(item.id, date, hour);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isEmpty = posts.length === 0;
  
  return (
    <div 
      ref={drop as any}
      className={`group relative border-divider h-[50px] border-b transition-all duration-200 ${
        isLast ? 'border-b-0' : ''
      } ${
        canDrop && isOver ? 'bg-primary/10 border-primary/50' : ''
      }`}
    >
      <div 
        className={`subpixel-antialiased relative size-full p-1 transition-all duration-200 ${
          isEmpty 
            ? `z-10 cursor-pointer group-hover:bg-primary/10 group-hover:border-primary/70 ${
                isOver ? 'bg-primary/20 border-primary' : ''
              }` 
            : `z-0 ${isOver ? 'bg-primary/5' : ''}`
        }`}
        onClick={isEmpty && !isOver ? () => onTimeSlotClick(date, hour) : undefined}
      >
        {isEmpty ? (
          <div className={`flex items-center justify-center h-full transition-opacity duration-200 ${
            isOver ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <Plus className="size-4 text-primary" />
          </div>
        ) : (
          <div className={`space-y-1 ${isOver ? 'bg-primary/5 rounded' : ''}`}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onPostUpdated={onPostUpdated} />
            ))}
            {isOver && (
              <div className="flex items-center justify-center h-6 opacity-70">
                <div className="size-2 bg-primary rounded-full animate-pulse" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DayColumn = ({ 
  date, 
  posts, 
  onTimeSlotClick, 
  onPostDropped,
  onPostUpdated,
  timezone 
}: { 
  date: Date; 
  posts: ScheduledPost[]; 
  onTimeSlotClick: (date: Date, hour: number) => void; 
  onPostDropped: (postId: string, date: Date, hour: number) => void;
  onPostUpdated?: () => void;
  timezone: string;
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i); // Revert to 24 hours (0-23)
  
  // Check if the date is today in the selected timezone
  const [isToday, setIsToday] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
        const dateInTimezone = new Date(now.toLocaleDateString("en-US", { timeZone: timezone }));
        
        setCurrentTime(timeInTimezone);
        setIsToday(isSameDay(date, dateInTimezone));
      } catch (error) {
        // Fallback to local time if timezone is invalid
        const now = new Date();
        setCurrentTime(now);
        setIsToday(isSameDay(date, now));
      }
    };
    
    // Set initial time
    updateTime();
    
    // Update time every 30 seconds
    const interval = setInterval(updateTime, 30000);
    
    return () => clearInterval(interval);
  }, [timezone, date]);
  
  // More precise time calculation - each hour block is 50px tall
  // Remove offset to align with TimeLegend time indicator
  const currentTimePosition = currentTime 
    ? (currentTime.getHours() * 50) + (currentTime.getMinutes() / 60 * 50)
    : 0;
  
  return (
    <div className="border-divider min-w-[100px] flex-1 border-r last:border-r-0">
      <div className="relative flex size-full flex-col">
        {/* Current time indicator - only render on client side when we have current time */}
        {currentTime && (
          <>
            {isToday ? (
              <>
                <div 
                  className="pointer-events-none absolute inset-x-0 z-[15] bg-red-500 opacity-100" 
                  style={{ top: `${currentTimePosition}px`, height: '2px' }}
                ></div>
                <div 
                  className="pointer-events-none absolute z-[16] bg-red-500" 
                  style={{ top: `${currentTimePosition - 2}px`, left: '0px', width: '3px', height: '6px' }}
                ></div>
              </>
            ) : (
              <div 
                className="pointer-events-none absolute inset-x-0 z-[15] bg-red-500 opacity-30" 
                style={{ top: `${currentTimePosition}px`, height: '2px' }}
              ></div>
            )}
          </>
        )}
        
        <div className="relative" style={{ height: '1200px' }}>
          {hours.map(hour => {
            const hourPosts = posts.filter(post => {
              if (!post.scheduledAt) return false;
              
              // Convert post time to the current viewing timezone
              const convertedTime = convertPostTimeToViewingTimezone(post, timezone);
              if (!convertedTime) return false;
              
              return isSameDay(convertedTime, date) && convertedTime.getHours() === hour;
            });
            
            return (
              <TimeSlot 
                key={hour} 
                hour={hour} 
                posts={hourPosts} 
                date={date} 
                onTimeSlotClick={onTimeSlotClick}
                onPostDropped={onPostDropped}
                onPostUpdated={onPostUpdated}
                isLast={hour === 23}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TimeLegend = ({ timezone }: { timezone: string }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i); // Revert to  24 hours (0-23)
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  useEffect(() => {
    // Set the current time in the selected timezone
    const updateTime = () => {
      try {
        const now = new Date();
        const timeInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
        setCurrentTime(timeInTimezone);
      } catch (error) {
        // Fallback to local time if timezone is invalid
        setCurrentTime(new Date());
      }
    };
    
    // Set initial time
    updateTime();
    
    // Update time every 30 seconds
    const interval = setInterval(updateTime, 30000);
    
    return () => clearInterval(interval);
  }, [timezone]);
  
  // More precise time calculation - each hour block is 50px tall
  // At 9:30 PM: (21 * 50) + (30/60 * 50) = 1050 + 25 = 1075px (no extra header offset needed)
  const currentTimePosition = currentTime 
    ? (currentTime.getHours() * 50) + (currentTime.getMinutes() / 60 * 50) // Remove header offset to match DayColumn
    : 0;
    
  return (
    <div 
      className="bg-white border-divider sticky left-0 z-20 flex flex-col border-r-[0.5px] select-none" 
      style={{ width: '64px', minWidth: '64px' }}
    >
      {/* Spacer to align with CalendarHeader */}
      <div style={{ height: '32px' }}></div>
      
      <div className="relative">
        {hours.map(hour => {
          // Show the END time of each hour block, except for the last block (hour 23)
          // Hour 0 (12-1am) should show "1:00 AM"
          // Hour 1 (1-2am) should show "2:00 AM", etc.
          // Hour 23 (11pm-12am) should show nothing (end of day)
          if (hour === 23) {
            return null; // Hide the empty div for the last hour
          }
          
          const endHour = (hour + 1) % 24;
          const isAM = endHour < 12 || endHour === 0;
          const displayHour = endHour === 0 ? 12 : (endHour > 12 ? endHour - 12 : endHour);
          const timeString = `${displayHour}:00 ${isAM ? 'AM' : 'PM'}`;
          
          return (
            <div 
              key={hour}
              className="text-muted-foreground mr-2 flex items-start justify-end text-[10px] pt-[10px]" 
              style={{ height: '50px' }}
            >
              {timeString}
            </div>
          );
        })}
      </div>
      {/* Only render current time indicator on client side */}
      {currentTime && (
        <div 
          className="absolute z-20 flex items-center justify-center rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white" 
          style={{ 
            top: `${currentTimePosition}px`, 
            right: '5px', 
            transform: 'translateY(-50%)', 
            pointerEvents: 'none' 
          }}
        >
          {format(currentTime, 'h:mm a')}
        </div>
      )}
    </div>
  );
};

const MonthPostCard = ({ post, onPostUpdated }: { post: ScheduledPost; onPostUpdated?: () => void }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'POST',
    item: { id: post.id, post, isScheduled: true },
    canDrag: post.status !== 'published', // Only allow dragging if not published
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const content = getPostContent(post);
  
  return (
    <div
      ref={drag as any}
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-50 rotate-1 scale-105 cursor-grabbing' : post.status !== 'published' ? 'cursor-grab' : 'cursor-default'
      }`}
    >
      {isDragging ? (
        <div className="bg-content3 border-divider ease flex flex-col items-center justify-between gap-1.5 rounded-lg border shadow-xs transition-all duration-200 hover:border-foreground/30 hover:bg-content4">
          <div className="p-2 flex w-full flex-col items-start justify-between gap-2.5">
            <div className="flex w-full flex-col gap-1.5">
              <div className="flex w-full flex-row items-start justify-between gap-2">
                <div className="flex size-4 shrink-0 items-center justify-start">
                  <StatusIcon status={post.status} />
                </div>
                <p className="text-foreground w-full text-[13px] leading-snug font-medium tracking-tight line-clamp-1">
                  {content}
                </p>
              </div>
              {post.scheduledAt && (
                <div className="flex flex-row items-center gap-2">
                  <div className="border-divider flex w-fit items-center gap-1.5 rounded-md border-[0.5px] px-1.5 py-0.5 truncate">
                    <div className="size-2 shrink-0 rounded-full bg-blue-500"></div>
                    <p className="text-muted-foreground whitespace overflow-hidden text-[11px] font-medium text-ellipsis">
                      {format(post.scheduledAt, 'h:mm a')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <PostPreviewPopover post={post} onPostUpdated={onPostUpdated}>
          <div className="bg-content3 border-divider ease flex flex-col items-center justify-between gap-1.5 rounded-lg border shadow-xs transition-all duration-200 hover:border-foreground/30 hover:bg-content4 cursor-pointer">
            <div className="p-2 flex w-full flex-col items-start justify-between gap-2.5">
              <div className="flex w-full flex-col gap-1.5">
                <div className="flex w-full flex-row items-start justify-between gap-2">
                  <div className="flex size-4 shrink-0 items-center justify-start">
                    <StatusIcon status={post.status} />
                  </div>
                  <p className="text-foreground w-full text-[13px] leading-snug font-medium tracking-tight line-clamp-1">
                    {content}
                  </p>
                </div>
                {post.scheduledAt && (
                  <div className="flex flex-row items-center gap-2">
                    <div className="border-divider flex w-fit items-center gap-1.5 rounded-md border-[0.5px] px-1.5 py-0.5 truncate">
                      <div className="size-2 shrink-0 rounded-full bg-blue-500"></div>
                      <p className="text-muted-foreground whitespace overflow-hidden text-[11px] font-medium text-ellipsis">
                        {format(post.scheduledAt, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PostPreviewPopover>
      )}
    </div>
  );
};

const MonthDay = ({ 
  date, 
  posts, 
  onDayClick,
  onPostDropped,
  onPostUpdated,
  timezone,
  isCurrentMonth = true,
  isToday = false
}: {
  date: Date;
  posts: ScheduledPost[];
  onDayClick: (date: Date) => void;
  onPostDropped: (postId: string, date: Date, originalPost: any) => void;
  onPostUpdated?: () => void;
  timezone: string;
  isCurrentMonth?: boolean;
  isToday?: boolean;
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'POST',
    drop: (item: { id: string; post: any; isScheduled?: boolean }) => {
      // Pass the original post data to let parent handle hour calculation
      onPostDropped(item.id, date, item.post);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const dayPosts = posts
    .filter(post => {
      if (!post.scheduledAt) return false;
      return isSameDay(post.scheduledAt, date);
    })
    .sort((a, b) => {
      // Sort by scheduled time (earliest to latest)
      if (!a.scheduledAt || !b.scheduledAt) return 0;
      
      // Convert to viewing timezone for proper sorting
      const timeA = convertPostTimeToViewingTimezone(a, timezone);
      const timeB = convertPostTimeToViewingTimezone(b, timezone);
      
      if (!timeA || !timeB) return 0;
      
      return timeA.getTime() - timeB.getTime();
    });

  return (
    <div
      ref={drop as any}
      className={`group relative border-r border-b border-divider h-32 transition-all duration-200 ${
        canDrop && isOver ? 'bg-primary/10 border-primary/50' : ''
      } ${!isCurrentMonth ? 'opacity-50' : ''}`}
    >
      <div
        className={`size-full p-2 transition-all duration-200 ${
          isToday ? 'bg-primary/5' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className={`text-sm font-medium ${
            isToday 
              ? 'text-primary font-semibold' 
              : isCurrentMonth 
                ? 'text-foreground' 
                : 'text-muted-foreground'
          }`}>
            {format(date, 'd')}
          </div>
          
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onDayClick(date)}
            className="invisible group-hover:visible opacity-70 hover:opacity-100 rounded-full min-w-8 size-8 p-0 bg-transparent hover:bg-default/40 transition-all duration-200"
            aria-label="Add to day"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
        
        <div className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 flex flex-1 flex-col gap-0.5 overflow-y-auto max-h-20">
          {dayPosts.slice(0, 6).map(post => (
            <MonthPostCard key={post.id} post={post} onPostUpdated={onPostUpdated} />
          ))}
          {dayPosts.length > 6 && (
            <div className="text-xs text-muted-foreground pl-2">
              +{dayPosts.length - 6} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MonthCalendarHeader = ({ 
  currentMonth, 
  timezone, 
  weekStartsOn 
}: {
  currentMonth: Date;
  timezone: string;
  weekStartsOn: 'monday' | 'sunday';
}) => {
  const weekStartOption = weekStartsOn === 'sunday' ? 0 : 1;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const orderedDays = weekStartOption === 1 ? [...days.slice(1), days[0]] : days;
  
  return (
    <div className="border-divider bg-gray-50 flex border-b select-none">
      {orderedDays.map((day, index) => (
        <div 
          key={index}
          className="text-muted-foreground flex-1 flex items-center justify-center p-3 text-sm font-medium border-r border-divider last:border-r-0"
        >
          {day}
        </div>
      ))}
    </div>
  );
};

const MonthGrid = ({ 
  currentMonth, 
  posts, 
  onDayClick,
  onPostDropped,
  onPostUpdated,
  timezone,
  weekStartsOn
}: {
  currentMonth: Date;
  posts: ScheduledPost[];
  onDayClick: (date: Date) => void;
  onPostDropped: (postId: string, date: Date, originalPost: any) => void;
  onPostUpdated?: () => void;
  timezone: string;
  weekStartsOn: 'monday' | 'sunday';
}) => {
  const weekStartOption = weekStartsOn === 'sunday' ? 0 : 1;
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: weekStartOption });
  const calendarEnd = addDays(calendarStart, 41); // 6 weeks * 7 days
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  const todayInTimezone = (() => {
    try {
      const now = new Date();
      return new Date(now.toLocaleDateString("en-US", { timeZone: timezone }));
    } catch (error) {
      return new Date();
    }
  })();

  return (
    <div className="bg-white">
      <div className="grid grid-cols-7">
        {days.map((day, index) => (
          <MonthDay
            key={index}
            date={day}
            posts={posts}
            onDayClick={onDayClick}
            onPostDropped={(postId, date) => onPostDropped(postId, date, 9)}
            onPostUpdated={onPostUpdated}
            isCurrentMonth={day >= monthStart && day <= monthEnd}
            isToday={isSameDay(day, todayInTimezone)}
            timezone={timezone}
          />
        ))}
      </div>
    </div>
  );
};

const CalendarHeader = ({ currentWeek, onPreviousWeek, onNextWeek, onToday, timezone, weekStartsOn }: {
  currentWeek: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  timezone: string;
  weekStartsOn: 'monday' | 'sunday';
}) => {
  const weekStartOption = weekStartsOn === 'sunday' ? 0 : 1;
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: weekStartOption });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timezoneAbbr = getTimezoneAbbreviation(timezone);
  
  return (
    <div className="border-divider z-50 flex flex-row border-b select-none" style={{ backgroundColor: '#f9f8f6' }}>
      <div className="text-muted-foreground border-divider flex items-center justify-center border-r text-xs" style={{ width: '64px', minWidth: '64px' }}>
        {timezoneAbbr}
      </div>
      
      {days.map((day, index) => {
        const todayInTimezone = (() => {
          try {
            const now = new Date();
            return new Date(now.toLocaleDateString("en-US", { timeZone: timezone }));
          } catch (error) {
            return new Date();
          }
        })();
        const isToday = isSameDay(day, todayInTimezone);
        const dayName = format(day, 'EEE');
        const dayNumber = format(day, 'd');
        
        return (
          <div 
            key={index}
            className={`relative flex min-h-8 min-w-[100px] flex-1 flex-col items-center justify-center overflow-visible px-2 py-1 text-center ${
              isToday ? 'bg-primary-500/10' : ''
            }`}
          >
            <h2 className="text-foreground flex cursor-default flex-row items-center justify-center text-xs font-medium tracking-tight">
              <p className="mr-0.5 whitespace-pre">{dayName} </p>
              <div className={`relative ${isToday ? 'before:bg-primary-500/80 before:absolute before:-inset-0.5 before:rounded-full before:content-[\'\']' : ''}`}>
                <span className={isToday ? 'relative z-10 p-1' : 'relative z-10'}>{dayNumber}</span>
              </div>
            </h2>
          </div>
        );
      })}
    </div>
  );
};

function ScheduleCalendarContent() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showUnscheduledPosts, setShowUnscheduledPosts] = useState(false);
  const [previousSidebarState, setPreviousSidebarState] = useState<boolean | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>('monday');
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isCheckingLinkedIn, setIsCheckingLinkedIn] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const loadSavedPreferences = () => {
      try {
        // Load timezone preference
        const savedTimezone = localStorage.getItem('schedule-calendar-timezone');
        if (savedTimezone) {
          setSelectedTimezone(savedTimezone);
        } else {
          // Auto-detect timezone on first load and save it
          const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setSelectedTimezone(detectedTimezone);
          localStorage.setItem('schedule-calendar-timezone', detectedTimezone);
        }

        // Load week start preference
        const savedWeekStart = localStorage.getItem('schedule-calendar-week-start') as 'monday' | 'sunday';
        if (savedWeekStart && (savedWeekStart === 'monday' || savedWeekStart === 'sunday')) {
          setWeekStartsOn(savedWeekStart);
        }
      } catch (error) {
        console.error('Error loading calendar preferences:', error);
        // Fallback to auto-detect timezone
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setSelectedTimezone(detectedTimezone);
      }
    };

    loadSavedPreferences();
  }, []);
  
  // Access main navigation sidebar controls
  const { open: mainSidebarOpen, setOpen: setMainSidebarOpen } = useSidebar();

  // Handle drafts sidebar toggle and main sidebar collapse
  const handleToggleUnscheduledPosts = () => {
    const newShowState = !showUnscheduledPosts;
    setShowUnscheduledPosts(newShowState);

    if (newShowState) {
      // Store current main sidebar state before collapsing
      setPreviousSidebarState(mainSidebarOpen);
      // Collapse main sidebar when showing drafts
      setMainSidebarOpen(false);
    } else {
      // Restore main sidebar to previous state when hiding drafts
      if (previousSidebarState !== null) {
        setMainSidebarOpen(previousSidebarState);
        setPreviousSidebarState(null);
      }
    }
  };

  // Handle initial state: if drafts are shown by default, collapse main sidebar
  useEffect(() => {
    if (showUnscheduledPosts && previousSidebarState === null) {
      setPreviousSidebarState(mainSidebarOpen);
      setMainSidebarOpen(false);
    }
  }, [mainSidebarOpen, showUnscheduledPosts, previousSidebarState, setMainSidebarOpen]);

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/posts?status=scheduled');
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled posts');
      }
      const data: Document[] = await response.json();
      const mappedPosts = data
        .filter(doc => doc.scheduledAt) // Only include posts with scheduled times
        .map(doc => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          scheduledAt: doc.scheduledAt ? new Date(doc.scheduledAt) : null,
          scheduledTimezone: doc.scheduledTimezone || null,
          publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
          status: doc.status as ScheduledPost['status'],
          kind: doc.kind as ScheduledPost['kind'],
          userId: doc.userId,
          createdAt: new Date(doc.createdAt),
        }));
      setScheduledPosts(mappedPosts);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      toast.error('Failed to load scheduled posts');
    }
  };

  const checkLinkedInStatus = async () => {
    setIsCheckingLinkedIn(true);
    try {
      const response = await fetch('/api/linkedin/status');
      if (response.ok) {
        const data = await response.json();
        setIsLinkedInConnected(data.isConnected);
        console.log('LinkedIn connection status:', data.isConnected); // Debug log
      }
    } catch (error) {
      console.error('Failed to check LinkedIn status:', error);
    } finally {
      setIsCheckingLinkedIn(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, [currentWeek, selectedTimezone]); // Refresh when week changes or timezone changes

  useEffect(() => {
    checkLinkedInStatus(); // Check LinkedIn status on mount
    const interval = setInterval(fetchScheduledPosts, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);
  
  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    setCurrentMonth(today);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handlePrevious = () => {
    if (viewType === 'week') {
      handlePreviousWeek();
    } else {
      handlePreviousMonth();
    }
  };

  const handleNext = () => {
    if (viewType === 'week') {
      handleNextWeek();
    } else {
      handleNextMonth();
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const dateTime = new Date(date);
    dateTime.setHours(hour, 0, 0, 0);
    setSelectedDateTime(dateTime);
    setIsDraftModalOpen(true);
  };

  const findBestAvailableHour = (date: Date, preferredHour?: number): number => {
    // Get posts for the selected day
    const dayPosts = scheduledPosts.filter(post => {
      if (!post.scheduledAt) return false;
      // Convert post time to the current viewing timezone
      const convertedTime = convertPostTimeToViewingTimezone(post, selectedTimezone);
      if (!convertedTime) return false;
      return isSameDay(convertedTime, date);
    });

    // Get hours that are already taken
    const takenHours = new Set(dayPosts.map(post => {
      const convertedTime = convertPostTimeToViewingTimezone(post, selectedTimezone);
      return convertedTime ? convertedTime.getHours() : null;
    }).filter(hour => hour !== null));

    // If a preferred hour is provided and it's available, use it
    if (preferredHour !== undefined && !takenHours.has(preferredHour)) {
      return preferredHour;
    }

    // Find the next available hour starting from 9 AM
    for (let hour = 9; hour < 24; hour++) {
      if (!takenHours.has(hour)) {
        return hour;
      }
    }

    // If all hours from 9 AM to 11 PM are taken, start from earlier hours
    for (let hour = 6; hour < 9; hour++) {
      if (!takenHours.has(hour)) {
        return hour;
      }
    }

    // If somehow all hours are taken, default to 9 AM (shouldn't happen in practice)
    return 9;
  };

  const findNextAvailableHour = (date: Date): number => {
    return findBestAvailableHour(date);
  };

  const handleDayClick = (date: Date) => {
    const nextAvailableHour = findNextAvailableHour(date);
    handleTimeSlotClick(date, nextAvailableHour);
  };

  const handlePostDropped = async (postId: string, date: Date, hour: number) => {
    try {
      const dateTime = new Date(date);
      dateTime.setHours(hour, 0, 0, 0);

      // Check if this is the same time slot (no need to update)
      const existingPost = scheduledPosts.find(p => p.id === postId);
      if (existingPost?.scheduledAt) {
        const existingTime = new Date(existingPost.scheduledAt);
        if (existingTime.getTime() === dateTime.getTime()) {
          return; // No change needed
        }
      }

      // Always check LinkedIn status before rescheduling
      await checkLinkedInStatus();

      if (!isLinkedInConnected) {
        // If not connected to LinkedIn, just redirect to connect (don't reschedule yet)
        const currentUrl = window.location.href;
        
        // Show a toast that we're connecting
        toast.success(`Redirecting to LinkedIn to connect. You can reschedule after connecting.`);
        
        // Redirect to LinkedIn auth
        window.location.href = `/api/linkedin/auth?returnUrl=${encodeURIComponent(currentUrl)}`;
        return;
      }

      // Update the database status first
      const response = await fetch(`/api/posts/${postId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'scheduled',
          scheduledAt: dateTime.toISOString(),
          scheduledTimezone: selectedTimezone
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update post schedule');
      }

      // Schedule/reschedule the job (API will automatically cancel existing job if any)
      try {
        const scheduleResponse = await fetch('/api/posts/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: postId,
            scheduledAt: dateTime.toISOString(),
            timezone: selectedTimezone,
          }),
        });

        if (!scheduleResponse.ok) {
          throw new Error('Failed to schedule post for automatic publishing');
        }
      } catch (scheduleError) {
        console.error('Failed to schedule automatic publishing:', scheduleError);
        toast.error('Post updated in database but automatic publishing may not work. Please check your LinkedIn connection.');
      }

      const action = existingPost?.scheduledAt ? 'rescheduled' : 'scheduled';
      toast.success(`Post ${action} for ${format(dateTime, 'PPP p')}`);
      
      // Refresh calendar data
      await fetchScheduledPosts();
    } catch (error) {
      console.error('Error updating post schedule:', error);
      toast.error('Failed to reschedule post');
    }
  };

  const handleMonthPostDropped = async (postId: string, date: Date, originalPost: any) => {
    // Try to preserve the original hour when dragging to a new day
    let originalHour = 9; // default fallback
    if (originalPost && originalPost.scheduledAt) {
      const originalTime = convertPostTimeToViewingTimezone(originalPost, selectedTimezone);
      if (originalTime) {
        originalHour = originalTime.getHours();
      }
    }
    
    // Find the best available hour (preferring the original hour)
    const bestHour = findBestAvailableHour(date, originalHour);
    
    // Call the existing handlePostDropped with the calculated hour
    return handlePostDropped(postId, date, bestHour);
  };

  const handlePostSelected = async (post: Document) => {
    try {
      // Always check LinkedIn status before scheduling
      await checkLinkedInStatus();
      
      if (!isLinkedInConnected) {
        // If not connected to LinkedIn, just redirect to connect (don't schedule yet)
        const currentUrl = window.location.href;
        
        // Show a toast that we're connecting
        toast.success(`Redirecting to LinkedIn to connect. You can schedule after connecting.`);
        setIsDraftModalOpen(false);
        
        // Redirect to LinkedIn auth
        window.location.href = `/api/linkedin/auth?returnUrl=${encodeURIComponent(currentUrl)}`;
        return;
      }

      // If LinkedIn is connected, proceed with scheduling
      const response = await fetch(`/api/posts/${post.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'scheduled',
          scheduledAt: selectedDateTime.toISOString(),
          scheduledTimezone: selectedTimezone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule post');
      }

      toast.success(`Post scheduled for ${format(selectedDateTime, 'PPP p')}`);
      setIsDraftModalOpen(false);
      
      // Refresh calendar data to show the newly scheduled post
      await fetchScheduledPosts();
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error('Failed to schedule post');
    }
  };
  
  const weekStartOption = weekStartsOn === 'sunday' ? 0 : 1;
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: weekStartOption });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  return (
    <div className="relative flex h-screen w-full flex-row overflow-hidden">
      {/* Unscheduled Posts Sidebar */}
      <div className={`transition-all duration-300 ease-in-out h-full ${
        showUnscheduledPosts ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'
      }`}>
        {showUnscheduledPosts && (
          <UnscheduledPostsSidebar onPostsChange={fetchScheduledPosts} />
        )}
      </div>

      {/* Main Calendar */}
      <div className="relative flex h-screen w-full flex-col overflow-hidden flex-1 transition-all duration-300 ease-in-out">
        {/* Sticky calendar controls header */}
        <div className="sticky top-0 z-50 bg-white border-b border-divider hidden w-full shrink-0 flex-row items-center justify-between sm:flex px-4 py-3">
          <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:gap-4">
            <div className="order-3 col-span-2 flex w-full flex-row items-center justify-between gap-2 sm:order-2 sm:justify-start sm:gap-4">
              <p className="text-foreground col-span-2 flex w-fit flex-row items-center justify-start text-lg font-normal tracking-tight whitespace-pre">
                <span className="font-semibold">{format(viewType === 'week' ? currentWeek : currentMonth, 'MMMM ')} </span>
                <span className="text-foreground">{format(viewType === 'week' ? currentWeek : currentMonth, 'yyyy')}</span>
              </p>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleToday}
                className="bg-default/40 text-default-700 border-divider"
              >
                Today
              </Button>
              
              <div className="inline-flex">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handlePrevious}
                  className="rounded-r-none bg-transparent text-default-foreground hover:bg-default/40"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleNext}
                  className="rounded-l-none bg-transparent text-default-foreground hover:bg-default/40"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-row items-center gap-2">
            <Select value={viewType} onValueChange={(value: 'week' | 'month') => setViewType(value)}>
              <SelectTrigger className="w-24 bg-default/40 text-default-700 border-divider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleToggleUnscheduledPosts}
              className={`border-divider transition-colors ${
                showUnscheduledPosts 
                  ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' 
                  : 'bg-default/40 text-default-700 hover:bg-default/60'
              }`}
            >
              <CalendarDays className="size-3.5 mr-1.5" />
              {showUnscheduledPosts ? 'Hide' : 'Show'} Drafts
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsSettingsModalOpen(true)}
              className="bg-default/40 text-default-700 border-divider"
            >
              <Settings className="size-3.5 mr-1.5" />
              Settings
            </Button>
          </div>
        </div>

        {/* Calendar container */}
        <div className="border-divider bg-white flex flex-1 h-full min-h-0 flex-col items-center justify-between gap-3 overflow-hidden border-[0.5px]">
          <div className="relative flex size-full flex-1 flex-col overflow-hidden">
            {viewType === 'week' ? (
              <>
                {/* Sticky CalendarHeader */}
                <div className="sticky top-0 z-40">
                  <CalendarHeader 
                    currentWeek={currentWeek}
                    onPreviousWeek={handlePreviousWeek}
                    onNextWeek={handleNextWeek}
                    onToday={handleToday}
                    timezone={selectedTimezone}
                    weekStartsOn={weekStartsOn}
                  />
                </div>
                
                {/* Calendar content */}
                <div className="flex flex-1 flex-col overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  <div className="flex flex-row">
                    <TimeLegend timezone={selectedTimezone} />
                    
                    <div className="relative flex flex-1 flex-row overflow-x-auto" style={{ height: '1200px' }}>
                      <div className="bg-white flex flex-1 flex-row">
                        {days.map((day, index) => (
                          <DayColumn 
                            key={index} 
                            date={day} 
                            posts={scheduledPosts}
                            onTimeSlotClick={handleTimeSlotClick}
                            onPostDropped={handlePostDropped}
                            onPostUpdated={fetchScheduledPosts}
                            timezone={selectedTimezone}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Sticky MonthCalendarHeader */}
                <div className="sticky top-0 z-40">
                  <MonthCalendarHeader 
                    currentMonth={currentMonth}
                    timezone={selectedTimezone}
                    weekStartsOn={weekStartsOn}
                  />
                </div>
                
                {/* Month calendar content */}
                <div className="flex flex-1 flex-col overflow-y-auto">
                  <MonthGrid
                    currentMonth={currentMonth}
                    posts={scheduledPosts}
                    onDayClick={handleDayClick}
                    onPostDropped={handleMonthPostDropped}
                    onPostUpdated={fetchScheduledPosts}
                    timezone={selectedTimezone}
                    weekStartsOn={weekStartsOn}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <SelectDraftPostModal
          isOpen={isDraftModalOpen}
          onClose={() => setIsDraftModalOpen(false)}
          selectedDateTime={selectedDateTime}
          onPostSelected={handlePostSelected}
        />

        {/* Scheduling Settings Modal */}
        <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg leading-snug font-medium tracking-tight">
                Scheduling Settings
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-1 flex-col gap-8 px-1 py-4">
              {/* Timezone Section */}
              <div>
                <label className="mb-1 block text-base font-medium text-gray-900 dark:text-white">
                  Timezone
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Used for scheduling, queue, and calendar.
                </p>
                <div className="grid grid-cols-[2fr_1fr] items-center gap-2">
                  <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                    <SelectTrigger className="bg-gray-100 dark:bg-content4 border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700">
                      <SelectValue placeholder="Select or detect timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
                      <SelectItem value="Europe/Rome">Europe/Rome</SelectItem>
                      <SelectItem value="Europe/Moscow">Europe/Moscow</SelectItem>
                      <SelectItem value="Europe/Istanbul">Europe/Istanbul</SelectItem>
                      <SelectItem value="Europe/Helsinki">Europe/Helsinki</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="America/Chicago">America/Chicago</SelectItem>
                      <SelectItem value="America/Denver">America/Denver</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                      <SelectItem value="America/Phoenix">America/Phoenix</SelectItem>
                      <SelectItem value="America/Anchorage">America/Anchorage</SelectItem>
                      <SelectItem value="Pacific/Honolulu">Pacific/Honolulu</SelectItem>
                      <SelectItem value="America/Toronto">America/Toronto</SelectItem>
                      <SelectItem value="America/Vancouver">America/Vancouver</SelectItem>
                      <SelectItem value="America/Mexico_City">America/Mexico_City</SelectItem>
                      <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                      <SelectItem value="America/Buenos_Aires">America/Buenos_Aires</SelectItem>
                      <SelectItem value="America/Bogota">America/Bogota</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">Asia/Hong_Kong</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                      <SelectItem value="Asia/Seoul">Asia/Seoul</SelectItem>
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok</SelectItem>
                      <SelectItem value="Africa/Cairo">Africa/Cairo</SelectItem>
                      <SelectItem value="Africa/Johannesburg">Africa/Johannesburg</SelectItem>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                      <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
                      <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                      <SelectItem value="Australia/Melbourne">Australia/Melbourne</SelectItem>
                      <SelectItem value="Australia/Perth">Australia/Perth</SelectItem>
                      <SelectItem value="Pacific/Auckland">Pacific/Auckland</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    className="bg-default text-default-foreground border-divider"
                    onClick={() => {
                      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                      setSelectedTimezone(timezone);
                      toast.success(`Detected timezone: ${timezone}`);
                    }}
                  >
                    <MapPin className="size-4 mr-2" />
                    Detect
                  </Button>
                </div>
              </div>

              {/* Calendar Section */}
              <div>
                <h3 className="mb-2 text-base font-medium text-gray-900 dark:text-white">Calendar</h3>
                <div className="mb-3 flex items-center space-x-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Week starts on:
                  </label>
                  <div className="inline-flex items-center justify-center h-auto" role="group">
                    <Button
                      type="button"
                      size="sm"
                      variant={weekStartsOn === 'monday' ? 'default' : 'outline'}
                      onClick={() => setWeekStartsOn('monday')}
                      className={`rounded-r-none ${
                        weekStartsOn === 'monday' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-default/40 text-default-700'
                      }`}
                    >
                      Monday
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={weekStartsOn === 'sunday' ? 'default' : 'outline'}
                      onClick={() => setWeekStartsOn('sunday')}
                      className={`rounded-l-none ${
                        weekStartsOn === 'sunday' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-default/40 text-default-700'
                      }`}
                    >
                      Sunday
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsSettingsModalOpen(false)}
                className="bg-default/40 text-default-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  try {
                    // Save timezone preference
                    localStorage.setItem('schedule-calendar-timezone', selectedTimezone);
                    
                    // Save week start preference
                    localStorage.setItem('schedule-calendar-week-start', weekStartsOn);
                    
                    toast.success('Calendar settings saved successfully');
                    setIsSettingsModalOpen(false);
                  } catch (error) {
                    console.error('Error saving calendar preferences:', error);
                    toast.error('Failed to save settings');
                  }
                }}
                className="bg-primary text-primary-foreground"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function ScheduleCalendar() {
  return (
    <DndProvider backend={HTML5Backend}>
      <ScheduleCalendarContent />
    </DndProvider>
  );
} 