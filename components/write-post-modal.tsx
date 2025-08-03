'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Convert variable names to sentence case for display
  const toSentenceCase = (str: string) => {
    return str
      .split(/[\s_-]+/) // Split on spaces, underscores, or hyphens
      .map((word, index) => 
        index === 0 
          ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          : word.toLowerCase()
      )
      .join(' ');
  };

  // Extract variables from template
  const templateVariables = useMemo(() => {
    if (!item?.template) return [];
    
    const matches = item.template.match(/\[([^\]]+)\]/g);
    if (!matches) return [];
    
    // Remove duplicates and clean up the variable names
    const uniqueVariables = Array.from(new Set(matches.map(match => match.slice(1, -1))));
    return uniqueVariables;
  }, [item?.template]);

  // Create template preview with filled variables
  const templatePreview = useMemo(() => {
    if (!item?.template) return '';
    
    let preview = item.template;
    templateVariables.forEach(variable => {
      const value = variables[variable] || `[${variable}]`;
      preview = preview.replace(new RegExp(`\\[${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), value);
    });
    return preview;
  }, [item?.template, templateVariables, variables]);

  // Reset variables when item changes
  useEffect(() => {
    setVariables({});
  }, [item]);

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const areAllVariablesFilled = templateVariables.every(variable => variables[variable]?.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) {
      toast.error('No template selected');
      return;
    }

    if (!areAllVariablesFilled) {
      toast.error('Please fill in all template variables');
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
          variables: variables,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const { chatId } = await response.json();

      // Create filled template for the initial message
      let filledTemplate = item.template;
      templateVariables.forEach(variable => {
        const value = variables[variable];
        filledTemplate = filledTemplate.replace(new RegExp(`\\[${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), value);
      });

      // Navigate to the chat with the initial message as query parameter
      const templateType = type === 'hook' ? 'hook template' : 'post template';
      const variablesList = templateVariables.map(variable => `${variable}: ${variables[variable]}`).join('\n');
      
      const initialMessage = `I want to write a LinkedIn post using this ${templateType}: "${item.title}"

Template: ${item.template}

Variables filled in:
${variablesList}

Filled template: ${filledTemplate}

Please help me create a compelling LinkedIn post using this template with the provided variables. Follow the template structure.`;

      router.push(`/chat/${chatId}?query=${encodeURIComponent(initialMessage)}`);
      
      // Close modal and reset form
      onClose();
      setVariables({});
      
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
      setVariables({});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="size-5" />
            Write a Post Like This
          </DialogTitle>
          <DialogDescription>
            Fill in the template variables for the &quot;{item?.title}&quot; {type} template
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          <div className="space-y-2 shrink-0">
            <Label htmlFor="template-preview">Template Preview</Label>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">{item?.title}</p>
              <div className="max-h-32 overflow-y-auto border border-border/50 rounded p-2 bg-background/50">
                <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                  {templatePreview}
                </pre>
              </div>
            </div>
          </div>

          {templateVariables.length > 0 && (
            <div className="flex-1 flex flex-col space-y-2 min-h-0">
              <Label className="shrink-0">Template Variables *</Label>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-8">
                {templateVariables.map((variable, index) => (
                  <div key={variable} className="space-y-1 mx-3">
                    <Label htmlFor={`variable-${index}`} className="text-sm">
                      {toSentenceCase(variable)} *
                    </Label>
                    <Input
                      id={`variable-${index}`}
                      placeholder={`Enter ${variable.toLowerCase()}...`}
                      value={variables[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      disabled={isLoading}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mx-3 shrink-0">
                Fill in all variables to see how they appear in the template preview above.
              </p>
            </div>
          )}

          {templateVariables.length === 0 && (
            <div className="space-y-2">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This template doesn&apos;t contain any variables to fill in. You can start writing directly with this template.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || (templateVariables.length > 0 && !areAllVariablesFilled)}
          >
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
      </DialogContent>
    </Dialog>
  );
} 