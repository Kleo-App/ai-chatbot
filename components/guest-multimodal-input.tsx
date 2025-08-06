'use client';

import { useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import cx from 'classnames';
import { Blocks, Search, GraduationCap, Images } from 'lucide-react';

import { ArrowUpIcon, PaperclipIcon } from './icons';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface GuestMultimodalInputProps {
  onTriggerAuth: () => void;
  className?: string;
}

export function GuestMultimodalInput({ onTriggerAuth, className }: GuestMultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const handleSubmit = useCallback(() => {
    if (input.trim()) {
      onTriggerAuth();
    } else {
      toast.error('Please enter a message');
    }
  }, [input, onTriggerAuth]);

  const handleAttachment = useCallback(() => {
    onTriggerAuth();
  }, [onTriggerAuth]);

  return (
    <div className={cx("relative w-full flex flex-col gap-4", className)}>
      <div className="relative bg-white border border-gray-200 rounded-2xl shadow-lg transition-all duration-150 ease-in-out ring-2 ring-black focus-within:ring-2 focus-within:ring-black">
        <Textarea
          ref={textareaRef}
          placeholder="Ask Kleo to create amazing content..."
          value={input}
          onChange={handleInput}
          className="min-h-[56px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-transparent border-none p-4 pb-12 focus:ring-0 focus:ring-offset-0"
          rows={2}
          autoFocus
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              handleSubmit();
            }
          }}
        />

        {/* Attachment button */}
        <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
          <Button
            className="rounded-full bg-transparent text-gray-400 hover:bg-gray-100 transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleAttachment}
            disabled={false}
          >
            <PaperclipIcon size={18} />
          </Button>
        </div>

        {/* Send button */}
        <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
          <Button
            className="rounded-full size-8 p-0 transition-colors"
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            <ArrowUpIcon size={14} />
          </Button>
        </div>
      </div>

      {/* Suggested actions */}
      <div className="flex flex-wrap gap-2 justify-center mt-3">
        {[
          { text: 'Smart post builder', icon: Blocks },
          { text: 'Research topics', icon: Search },
          { text: 'Write an educational post', icon: GraduationCap },
          { text: 'Create a carousel', icon: Images }
        ].map((suggestion) => (
          <Button
            key={`suggestion-${suggestion.text}`}
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-sm bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
            onClick={onTriggerAuth}
          >
            <suggestion.icon size={14} />
            {suggestion.text}
          </Button>
        ))}
      </div>
    </div>
  );
} 