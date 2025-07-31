'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Clock, Info, AlertTriangle } from 'lucide-react';
import { LinkedInPostPreview } from './linkedin-post-preview';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  documentId?: string;
  userProfile?: {
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    headline?: string;
  };
  uploadedImages?: string[];
  uploadedVideos?: string[];
  uploadedDocuments?: Array<{ url: string; name: string }>;
  scheduledAt?: Date | null; // Add scheduled date for reschedule mode
  status?: string; // Add status to know if post is already scheduled
}

export function SchedulePostModal({
  isOpen,
  onClose,
  content,
  documentId,
  userProfile,
  uploadedImages = [],
  uploadedVideos = [],
  uploadedDocuments = [],
  scheduledAt = null,
  status = 'draft'
}: SchedulePostModalProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    // If rescheduling, use the current scheduled date, otherwise default to tomorrow at 9 AM
    if (scheduledAt) {
      return new Date(scheduledAt);
    }
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isCheckingLinkedIn, setIsCheckingLinkedIn] = useState(true);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  
  // Determine if we're in reschedule mode
  const isRescheduleMode = status === 'scheduled' && scheduledAt;

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateTime = new Date(e.target.value);
    setSelectedDate(newDateTime);
  };

  const findBestAvailableHour = (date: Date, preferredHour?: number): number => {
    // Get posts for the selected day, excluding the current post if rescheduling
    const dayPosts = scheduledPosts.filter(post => {
      if (!post.scheduledAt) return false;
      // Skip the current post if we're rescheduling it
      if (isRescheduleMode && post.id === documentId) return false;
      const scheduledDate = new Date(post.scheduledAt);
      return scheduledDate.toDateString() === date.toDateString();
    });

    // Get hours that are already taken
    const takenHours = new Set(dayPosts.map(post => {
      const scheduledDate = new Date(post.scheduledAt);
      return scheduledDate.getHours();
    }));

    // If a preferred hour is provided and it's available, use it
    if (preferredHour !== undefined && !takenHours.has(preferredHour)) {
      return preferredHour;
    }

    // Find the next available hour starting from the preferred hour or 9 AM
    const startHour = preferredHour !== undefined ? preferredHour : 9;
    
    // First, try from the preferred hour onwards
    for (let hour = startHour; hour < 24; hour++) {
      if (!takenHours.has(hour)) {
        return hour;
      }
    }

    // If no slots available after preferred hour, try from 9 AM onwards
    for (let hour = 9; hour < startHour; hour++) {
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

  const checkTimeConflict = (date: Date): { hasConflict: boolean; suggestedTime?: Date } => {
    const requestedHour = date.getHours();
    const bestAvailableHour = findBestAvailableHour(date, requestedHour);
    
    const hasConflict = bestAvailableHour !== requestedHour;
    
    if (hasConflict) {
      const suggestedTime = new Date(date);
      suggestedTime.setHours(bestAvailableHour, date.getMinutes(), 0, 0);
      return { hasConflict: true, suggestedTime };
    }
    
    return { hasConflict: false };
  };

  const conflictInfo = checkTimeConflict(selectedDate);

  // Check LinkedIn connection status and fetch scheduled posts when modal opens
  useEffect(() => {
    if (isOpen) {
      checkLinkedInStatus();
      fetchScheduledPosts();
    }
  }, [isOpen]);

  const checkLinkedInStatus = async () => {
    setIsCheckingLinkedIn(true);
    try {
      const response = await fetch('/api/linkedin/status');
      if (response.ok) {
        const data = await response.json();
        setIsLinkedInConnected(data.isConnected);
      }
    } catch (error) {
      console.error('Failed to check LinkedIn status:', error);
    } finally {
      setIsCheckingLinkedIn(false);
    }
  };

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/posts?status=scheduled');
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled posts');
      }
      const data = await response.json();
      setScheduledPosts(data);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    }
  };

  const updateDocumentStatus = async (status: 'scheduled' | 'draft', scheduledAt?: Date) => {
    if (!documentId) {
      toast.error('Document ID not found');
      return false;
    }

    try {
      const response = await fetch(`/api/posts/${documentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          scheduledAt: scheduledAt?.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      return true;
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update post status');
      return false;
    }
  };

  const handleSchedulePost = async () => {
    setIsScheduling(true);
    try {
      // Check for conflicts and find the best available time
      const requestedHour = selectedDate.getHours();
      const requestedDate = new Date(selectedDate);
      const bestAvailableHour = findBestAvailableHour(requestedDate, requestedHour);
      
      // Create the final scheduled date with the best available hour
      const finalScheduledDate = new Date(requestedDate);
      finalScheduledDate.setHours(bestAvailableHour, selectedDate.getMinutes(), 0, 0);
      
      const success = await updateDocumentStatus('scheduled', finalScheduledDate);
      if (success) {
        // Schedule the post for automatic publishing via Inngest
        try {
          const response = await fetch('/api/posts/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentId,
              scheduledAt: finalScheduledDate.toISOString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to schedule post for automatic publishing');
          }
        } catch (scheduleError) {
          console.error('Failed to schedule automatic publishing:', scheduleError);
          // Still show success for the database update, but warn about auto-publishing
          toast.error('Post scheduled but automatic publishing may not work. Please check your LinkedIn connection.');
        }

        // Check if time was adjusted due to conflict
        const actionWord = isRescheduleMode ? 'rescheduled' : 'scheduled';
        if (bestAvailableHour !== requestedHour) {
          toast.success(
            `Time slot conflict detected. Post ${actionWord} for ${format(finalScheduledDate, 'PPP p')} (next available time)`
          );
        } else {
          toast.success(`Post ${actionWord} for ${format(finalScheduledDate, 'PPP p')}`);
        }
        onClose();
      }
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error('Failed to schedule post');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    setIsScheduling(true);
    try {
      // Save current URL to return after OAuth
      const currentUrl = window.location.href;
      
      // Show a toast that we're connecting
      toast.success(`Redirecting to LinkedIn to connect. You can schedule after connecting.`);
      
      // Redirect to LinkedIn auth
      window.location.href = `/api/linkedin/auth?returnUrl=${encodeURIComponent(currentUrl)}`;
    } catch (error) {
      console.error('Error connecting LinkedIn:', error);
      toast.error('Failed to connect LinkedIn');
      setIsScheduling(false);
    }
  };



  const formatDateTime = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Plan your post</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Post Preview */}
          <div className="flex-1 overflow-y-auto bg-[#f4f2ee] dark:bg-content2 py-6">
            <div className="max-w-2xl w-full mx-auto px-6">
              <LinkedInPostPreview
                content={content}
                userProfile={userProfile}
                uploadedImages={uploadedImages}
                uploadedVideos={uploadedVideos}
                uploadedDocuments={uploadedDocuments}
                showHeader={false}
                showDeviceToggle={false}
                showShareButton={false}
                showScheduleButton={false}
                isModal={true}
              />
            </div>
          </div>

          {/* Scheduling Controls */}
          <div className="flex flex-col gap-4 pt-6">
            <div className="flex flex-col items-start gap-1">
              <p className="text-muted-foreground mb-1 text-sm">
                {isRescheduleMode 
                  ? 'Update the date and time for your scheduled post.'
                  : 'Update the date and time for your draft post.'
                }
              </p>
              <div className="flex w-full flex-col items-center gap-2">
                <div className="group flex flex-col gap-y-1.5 w-full">
                  <div className="relative flex items-center">
                    <Input
                      type="datetime-local"
                      value={formatDateTime(selectedDate)}
                      onChange={handleDateTimeChange}
                      className="w-full pr-10"
                    />
                    <CalendarIcon className="absolute right-3 size-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* Conflict Warning */}
              {conflictInfo.hasConflict && conflictInfo.suggestedTime && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="text-amber-800 font-medium">Time slot conflict detected</p>
                      <p className="text-amber-700 mt-1">
                        Another post is scheduled at this time. Your post will be automatically scheduled for{' '}
                        <span className="font-medium">{format(conflictInfo.suggestedTime, 'h:mm a')}</span> instead.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex flex-col items-center w-full">
                <div className="relative flex items-center w-full">
                                <Button 
                onClick={isLinkedInConnected ? handleSchedulePost : handleConnectLinkedIn}
                disabled={isScheduling || isCheckingLinkedIn}
                className="w-full h-12 bg-primary text-primary-foreground hover:opacity-hover gap-2"
              >
                {isScheduling ? (
                  <>
                    <Clock className="size-5 animate-spin" />
                    {isLinkedInConnected ? (isRescheduleMode ? 'Rescheduling post...' : 'Scheduling post...') : 'Connecting...'}
                  </>
                ) : isCheckingLinkedIn ? (
                  <>
                    <Clock className="size-5 animate-spin" />
                    Checking connection...
                  </>
                ) : isLinkedInConnected ? (
                  <>
                    {isRescheduleMode ? 'Reschedule' : 'Schedule'} post for {format(selectedDate, 'MMM d')} at {format(selectedDate, 'h:mm a')}
                    <Clock className="size-5" />
                  </>
                ) : (
                  <>
                    Connect to LinkedIn
                    <Clock className="size-5" />
                  </>
                )}
              </Button>
                  <Info className="text-foreground absolute -right-8 size-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 