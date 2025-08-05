'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ReschedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    title: string;
    content: string | null;
    scheduledAt: Date | null;
    status: 'scheduled' | 'published' | 'draft';
  };
  onPostUpdated?: () => void;
}

export function ReschedulePostModal({
  isOpen,
  onClose,
  post,
  onPostUpdated,
}: ReschedulePostModalProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    if (post.scheduledAt) {
      return format(post.scheduledAt, 'yyyy-MM-dd');
    }
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, 'yyyy-MM-dd');
  });
  
  const [selectedTime, setSelectedTime] = useState(() => {
    if (post.scheduledAt) {
      return format(post.scheduledAt, 'HH:mm');
    }
    return '09:00';
  });

  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isUnscheduling, setIsUnscheduling] = useState(false);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [isCheckingLinkedIn, setIsCheckingLinkedIn] = useState(true);

  // Check LinkedIn connection status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkLinkedInStatus();
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

  const getPreviewContent = (content: string | null) => {
    if (!content) return post.title;
    
    let textContent = content;
    
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && parsed.text) {
        textContent = parsed.text;
      }
    } catch (e) {
      textContent = content;
    }

    // Strip HTML tags and truncate
    const stripHtml = (html: string) => {
      return html
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const hasHtmlTags = /<[^>]*>/.test(textContent);
    const cleanContent = hasHtmlTags ? stripHtml(textContent) : textContent;
    
    return cleanContent.length > 50 ? `${cleanContent.substring(0, 50)}...` : cleanContent;
  };

  const handleReschedule = async () => {
    setIsRescheduling(true);
    try {
      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      
      if (!isLinkedInConnected) {
        // If not connected to LinkedIn, just redirect to connect (don't reschedule yet)
        const currentUrl = window.location.href;
        
        // Show a toast that we're connecting
        toast.success(`Redirecting to LinkedIn to connect. You can reschedule after connecting.`);
        onClose();
        
        // Redirect to LinkedIn auth
        window.location.href = `/api/linkedin/auth?returnUrl=${encodeURIComponent(currentUrl)}`;
        return;
      }

      // Update the database status first
      const response = await fetch(`/api/posts/${post.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'scheduled',
          scheduledAt: scheduledDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule post');
      }

      // Schedule the new job (API will automatically cancel existing job)
      try {
        await fetch('/api/posts/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: post.id,
            scheduledAt: scheduledDateTime.toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        });
      } catch (scheduleError) {
        console.error('Failed to schedule new job:', scheduleError);
        toast.error('Post rescheduled in database but automatic publishing may not work. Please check your LinkedIn connection.');
      }

      toast.success(`Post rescheduled for ${format(scheduledDateTime, 'PPP p')}`);
      onPostUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error rescheduling post:', error);
      toast.error('Failed to reschedule post');
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    setIsRescheduling(true);
    try {
      // Save current URL to return after OAuth
      const currentUrl = window.location.href;
      
      // Show a toast that we're connecting
      toast.success(`Redirecting to LinkedIn to connect. You can reschedule after connecting.`);
      onClose();
      
      // Redirect to LinkedIn auth
      window.location.href = `/api/linkedin/auth?returnUrl=${encodeURIComponent(currentUrl)}`;
    } catch (error) {
      console.error('Error connecting LinkedIn:', error);
      toast.error('Failed to connect LinkedIn');
      setIsRescheduling(false);
    }
  };

  const handleUnschedule = async () => {
    setIsUnscheduling(true);
    try {
      // First, cancel the scheduled job
      try {
        await fetch('/api/posts/schedule', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: post.id,
          }),
        });
      } catch (cancelError) {
        console.warn('Failed to cancel scheduled job:', cancelError);
        // Continue with unscheduling even if cancellation fails
      }

      const response = await fetch(`/api/posts/${post.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'draft',
          scheduledAt: null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unschedule post');
      }

      toast.success('Post unscheduled and moved to drafts');
      onPostUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error unscheduling post:', error);
      toast.error('Failed to unschedule post');
    } finally {
      setIsUnscheduling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-medium tracking-tight">
            Update Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div>
            <p className="text-muted-foreground mb-1">
              Scheduling post: <span className="font-semibold">{getPreviewContent(post.content)}</span>
            </p>
            {post.scheduledAt && (
              <p className="text-muted-foreground mb-3 text-sm">
                Currently scheduled for: <span className="font-medium">
                  {format(post.scheduledAt, 'PPP p')}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-col gap-2 w-full sm:w-2/3">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-1/3">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={handleUnschedule}
            disabled={isUnscheduling || isRescheduling}
            className="border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto"
          >
            <Trash2 className="mr-2 size-4" />
            {isUnscheduling ? 'Unscheduling...' : 'Unschedule'}
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isRescheduling || isUnscheduling}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={isLinkedInConnected ? handleReschedule : handleConnectLinkedIn}
              disabled={isRescheduling || isUnscheduling || isCheckingLinkedIn}
              className="w-full"
            >
              {isRescheduling ? (
                <>
                  <Clock className="size-4 mr-2 animate-spin" />
                  {isLinkedInConnected ? 'Rescheduling...' : 'Connecting...'}
                </>
              ) : isCheckingLinkedIn ? (
                <>
                  <Clock className="size-4 mr-2 animate-spin" />
                  Checking connection...
                </>
              ) : isLinkedInConnected ? (
                'Reschedule'
              ) : (
                'Connect to LinkedIn'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 