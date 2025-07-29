'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings, Plus } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { PostStatusBadge } from './post-status-badge';
import { SelectDraftPostModal } from './select-draft-post-modal';
import { PostPreviewPopover } from './post-preview-popover';
import { toast } from 'sonner';
import type { Document } from '@/lib/db/schema';

interface ScheduledPost {
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

const StatusIcon = ({ status }: { status: ScheduledPost['status'] }) => {
  if (status === 'published') {
    return (
      <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary">
        <g>
          <circle cx="9" cy="9" fill="none" r="7.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></circle>
          <path d="M5.5,9c.863,.867,1.537,1.868,2.1,2.962,1.307-2.491,2.94-4.466,4.9-5.923" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
        </g>
      </svg>
    );
  }
  
  return (
    <svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-foreground">
      <g>
        <circle cx="6" cy="6" fill="none" r="5.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"></circle>
      </g>
    </svg>
  );
};

// Helper function to extract text content from post
const getPostContent = (post: ScheduledPost) => {
  if (!post.content) return post.title;
  
  try {
    const parsed = JSON.parse(post.content);
    if (parsed && typeof parsed === 'object' && parsed.text) {
      return parsed.text;
    }
    return post.content;
  } catch (e) {
    return post.content;
  }
};

const PostCard = ({ post }: { post: ScheduledPost }) => {
  const content = getPostContent(post);
  
  return (
    <PostPreviewPopover post={post}>
      <div className="bg-white border-divider ease flex flex-col items-center justify-between gap-1.5 rounded-lg border transition-all duration-200 hover:border-foreground/30 p-2 relative z-50">
        <div className="w-full">
          <div className="flex w-full flex-row items-start justify-between gap-2">
            <div className="flex h-4 w-4 flex-shrink-0 items-center justify-start">
              <StatusIcon status={post.status} />
            </div>
            <p className="text-foreground w-full text-[13px] leading-snug font-medium tracking-tight line-clamp-2">
              {content}
            </p>
          </div>
        </div>
      </div>
    </PostPreviewPopover>
  );
};

const TimeSlot = ({ 
  hour, 
  posts, 
  date, 
  onTimeSlotClick 
}: { 
  hour: number; 
  posts: ScheduledPost[]; 
  date: Date; 
  onTimeSlotClick: (date: Date, hour: number) => void; 
}) => {
  const isEmpty = posts.length === 0;
  
  return (
    <div className="group border-divider/50 ease relative border-b-[0.5px] transition-all duration-300" style={{ height: '50px' }}>
      <div 
        className={`subpixel-antialiased relative h-full w-full p-1 transition-all duration-200 ${
          isEmpty 
            ? 'z-10 cursor-pointer group-hover:bg-primary/10 group-hover:border-primary/70' 
            : 'z-0'
        }`}
        onClick={isEmpty ? () => onTimeSlotClick(date, hour) : undefined}
      >
        {isEmpty ? (
          <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Plus className="w-4 h-4 text-primary" />
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

const DayColumn = ({ 
  date, 
  posts, 
  onTimeSlotClick 
}: { 
  date: Date; 
  posts: ScheduledPost[]; 
  onTimeSlotClick: (date: Date, hour: number) => void; 
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i); // Revert to 24 hours (0-23)
  const isToday = isSameDay(date, new Date());
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  useEffect(() => {
    // Set the current time for all days to position the red line correctly
    setCurrentTime(new Date());
    
    // Update time every 30 seconds
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // More precise time calculation - each hour block is 50px tall
  // Remove offset to align with TimeLegend time indicator
  const currentTimePosition = currentTime 
    ? (currentTime.getHours() * 50) + (currentTime.getMinutes() / 60 * 50)
    : 0;
  
  return (
    <div className="border-divider min-w-[100px] flex-1 border-r last:border-r-0">
      <div className="relative flex h-full w-full flex-col">
        {/* Current time indicator - only render on client side when we have current time */}
        {currentTime && (
          <>
            {isToday ? (
              <>
                <div 
                  className="pointer-events-none absolute right-0 left-0 z-[15] bg-red-500 opacity-100" 
                  style={{ top: `${currentTimePosition}px`, height: '2px' }}
                ></div>
                <div 
                  className="pointer-events-none absolute z-[16] bg-red-500" 
                  style={{ top: `${currentTimePosition - 2}px`, left: '0px', width: '3px', height: '6px' }}
                ></div>
              </>
            ) : (
              <div 
                className="pointer-events-none absolute right-0 left-0 z-[15] bg-red-500 opacity-30" 
                style={{ top: `${currentTimePosition}px`, height: '2px' }}
              ></div>
            )}
          </>
        )}
        
        <div className="relative flex-1" style={{ minHeight: '1200px' }}>
          {hours.map(hour => {
            const hourPosts = posts.filter(post => {
              if (!post.scheduledAt) return false;
              return isSameDay(post.scheduledAt, date) && post.scheduledAt.getHours() === hour;
            });
            
            return (
              <TimeSlot 
                key={hour} 
                hour={hour} 
                posts={hourPosts} 
                date={date} 
                onTimeSlotClick={onTimeSlotClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TimeLegend = () => {
  const hours = Array.from({ length: 24 }, (_, i) => i); // Revert to  24 hours (0-23)
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  useEffect(() => {
    // Set the current time only on the client side to avoid hydration mismatch
    setCurrentTime(new Date());
    
    // Update time every 30 seconds
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
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
          // Show the END time of each hour block
          // Hour 0 (12-1am) should show "1:00 AM"
          // Hour 1 (1-2am) should show "2:00 AM", etc.
          // Hour 23 (11pm-12am) should show "12:00 AM"
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

const CalendarHeader = ({ currentWeek, onPreviousWeek, onNextWeek, onToday }: {
  currentWeek: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}) => {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  return (
    <div className="border-divider z-50 flex flex-row border-b select-none" style={{ backgroundColor: '#f9f8f6' }}>
      <div className="text-muted-foreground border-divider flex items-center justify-center border-r text-xs" style={{ width: '64px', minWidth: '64px' }}>
        GMT-5
      </div>
      
      {days.map((day, index) => {
        const isToday = isSameDay(day, new Date());
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

export function ScheduleCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

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

  useEffect(() => {
    fetchScheduledPosts();
  }, [currentWeek]); // Refresh when week changes

  useEffect(() => {
    const interval = setInterval(fetchScheduledPosts, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);
  
  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };
  
  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };
  
  const handleToday = () => {
    setCurrentWeek(new Date());
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const dateTime = new Date(date);
    dateTime.setHours(hour, 0, 0, 0);
    setSelectedDateTime(dateTime);
    setIsDraftModalOpen(true);
  };

  const handlePostSelected = async (post: Document) => {
    try {
      const response = await fetch(`/api/posts/${post.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'scheduled',
          scheduledAt: selectedDateTime.toISOString(),
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
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Sticky calendar controls header */}
      <div className="sticky top-0 z-50 bg-white border-b border-divider hidden w-full shrink-0 flex-row items-center justify-between sm:flex px-4 py-3">
        <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:gap-4">
          <div className="order-3 col-span-2 flex w-full flex-row items-center justify-between gap-2 sm:order-2 sm:justify-start sm:gap-4">
            <p className="text-foreground col-span-2 flex w-fit flex-row items-center justify-start text-lg font-normal tracking-tight whitespace-pre">
              <span className="font-semibold">{format(currentWeek, 'MMMM ')} </span>
              <span className="text-foreground">{format(currentWeek, 'yyyy')}</span>
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
                onClick={handlePreviousWeek}
                className="rounded-r-none bg-transparent text-default-foreground hover:bg-default/40"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleNextWeek}
                className="rounded-l-none bg-transparent text-default-foreground hover:bg-default/40"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-row items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="bg-default/40 text-default-700 border-divider"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Settings
          </Button>
        </div>
      </div>

      {/* Calendar container */}
      <div className="border-divider bg-white flex flex-1 h-full min-h-0 flex-col items-center justify-between gap-3 overflow-hidden border-[0.5px]">
        <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
          {/* Sticky CalendarHeader */}
          <div className="sticky top-0 z-40">
            <CalendarHeader 
              currentWeek={currentWeek}
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
              onToday={handleToday}
            />
          </div>
          
          {/* Calendar content */}
          <div className="flex flex-1 flex-col overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex flex-row">
              <TimeLegend />
              
              <div className="relative flex flex-1 flex-row overflow-x-auto" style={{ minHeight: '1200px' }}>
                <div className="bg-white flex flex-1 flex-row">
                  {days.map((day, index) => (
                    <DayColumn 
                      key={index} 
                      date={day} 
                      posts={scheduledPosts}
                      onTimeSlotClick={handleTimeSlotClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SelectDraftPostModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        selectedDateTime={selectedDateTime}
        onPostSelected={handlePostSelected}
      />
    </div>
  );
} 