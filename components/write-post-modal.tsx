'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  template: string;
  image?: string | null;
  postUrl?: string | null;
}

interface WritePostModalProps {
  item: ContentItem | null;
  type: 'hook' | 'post';
  isOpen: boolean;
  onClose: () => void;
}

export function WritePostModal({ item, type, isOpen, onClose }: WritePostModalProps) {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item || !topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsLoading(true);

    try {
      const apiEndpoint = type === 'hook' ? '/api/hooks/create-chat' : '/api/posts/create-chat';
      const idKey = type === 'hook' ? 'hookId' : 'postId';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [idKey]: item.id,
          topic: topic.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const { chatId } = await response.json();

      // Navigate to the chat with the initial message as query parameter
      const templateType = type === 'hook' ? 'hook template' : 'post template';
      const initialMessage = `I want to write a LinkedIn post using this ${templateType}: "${item.title}"

Template: ${item.template}

Topic: ${topic.trim()}

Please help me create a compelling LinkedIn post using this template and topic. Follow the template.`;

      router.push(`/chat/${chatId}?query=${encodeURIComponent(initialMessage)}`);
      
      // Close modal and reset form
      onClose();
      setTopic('');
      
      toast.success('Chat created successfully!');
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setTopic('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-5" />
            Write a Post Like This
          </DialogTitle>
          <DialogDescription>
            Tell us what topic you&apos;d like to write about using the &quot;{item?.title}&quot; {type} template
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hook-template">Template</Label>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">{item?.title}</p>
              <div className="max-h-32 overflow-y-auto border border-border/50 rounded p-2 bg-background/50">
                <pre className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {item?.template}
                </pre>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic *</Label>
            <Textarea
              id="topic"
              placeholder="e.g., My experience transitioning to remote work, How I built my first SaaS product, Tips for effective team communication..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[100px]"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what you want to write about. This will help create a more targeted and engaging post.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !topic.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating Chat...
                </>
              ) : (
                <>
                  <MessageCircle className="size-4 mr-2" />
                  Start Writing
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 