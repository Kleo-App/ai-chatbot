'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Clock, Info } from 'lucide-react';
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
}

export function SchedulePostModal({
  isOpen,
  onClose,
  content,
  documentId,
  userProfile,
  uploadedImages = []
}: SchedulePostModalProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to tomorrow at 9 AM
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateTime = new Date(e.target.value);
    setSelectedDate(newDateTime);
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
      const success = await updateDocumentStatus('scheduled', selectedDate);
      if (success) {
        toast.success(`Post scheduled for ${format(selectedDate, 'PPP p')}`);
        onClose();
      }
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error('Failed to schedule post');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSaveAsDraft = async () => {
    setIsSavingDraft(true);
    try {
      const success = await updateDocumentStatus('draft');
      if (success) {
        toast.success('Post saved as draft');
        onClose();
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save as draft');
    } finally {
      setIsSavingDraft(false);
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
                Update the date and time for your draft post.
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
                    <CalendarIcon className="absolute right-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex w-full justify-start mt-2">
                <span className="text-muted-foreground text-xs">
                  We've selected your next available slot from your content strategy.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex flex-col items-center w-full">
                <div className="relative flex items-center w-full">
                  <Button 
                    onClick={handleSchedulePost}
                    disabled={isScheduling || isSavingDraft}
                    className="w-full h-12 bg-primary text-primary-foreground hover:opacity-hover gap-2"
                  >
                    {isScheduling ? (
                      <>
                        <Clock className="w-5 h-5 animate-spin" />
                        Scheduling post...
                      </>
                    ) : (
                      <>
                        Schedule post for {format(selectedDate, 'MMM d')} at {format(selectedDate, 'h:mm a')}
                        <Clock className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                  <Info className="text-foreground absolute -right-8 w-4 h-4" />
                </div>
                
                <span className="text-muted-foreground mt-2 h-4 text-sm leading-4">
                  or
                </span>
                
                <Button 
                  variant="ghost"
                  onClick={handleSaveAsDraft}
                  disabled={isScheduling || isSavingDraft}
                  className="bg-transparent hover:bg-default/40 text-muted-foreground underline"
                >
                  {isSavingDraft ? 'Saving as draft...' : 'Save as draft in the calendar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 