'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { LinkedInPostPreview } from './linkedin-post-preview';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LinkedInPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  userProfile?: {
    fullName?: string;
    profileImage?: string;
  };
}

export function LinkedInPublishModal({
  isOpen,
  onClose,
  content,
  userProfile,
}: LinkedInPublishModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check LinkedIn connection status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkLinkedInStatus();
    }
  }, [isOpen]);

  const checkLinkedInStatus = async () => {
    try {
      const response = await fetch('/api/linkedin/status');
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.isConnected);
      }
    } catch (error) {
      console.error('Failed to check LinkedIn status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    setIsConnecting(true);
    try {
      window.location.href = '/api/linkedin/auth';
    } catch (error) {
      toast.error('Failed to connect LinkedIn');
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePublishPost = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch('/api/linkedin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish post');
      }

      toast.success('Post published to LinkedIn!');
      onClose();
    } catch (error) {
      toast.error('Failed to publish post');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Publish post</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Post Preview */}
          <div className="flex-1 overflow-y-auto bg-[#f4f2ee] dark:bg-content2 py-6">
            <div className="max-w-2xl w-full mx-auto px-6">
              <LinkedInPostPreview
                content={content}
                userProfile={userProfile}
                deviceType="desktop"
                showHeader={false}
                showShareButton={false}
                showDeviceToggle={false}
                isModal={true}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 pt-6">
            {isLoading ? (
              <Button disabled className="w-full h-12 gap-2">
                <Loader2 className="size-5 animate-spin" />
                Checking LinkedIn connection...
              </Button>
            ) : !isConnected ? (
              <Button
                onClick={handleConnectLinkedIn}
                disabled={isConnecting}
                className="w-full h-12 bg-[#0077B5] hover:bg-[#005885] text-white gap-2"
              >
                {isConnecting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    Connect LinkedIn to post
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handlePublishPost}
                disabled={isPublishing}
                className="w-full h-12 bg-[#0077B5] hover:bg-[#005885] text-white gap-2"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish to LinkedIn
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 