'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import cx from 'classnames';

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
    <div className="relative w-full flex flex-col gap-4">
      <div className="relative bg-white border border-blue-100 rounded-2xl shadow-xl transition-all duration-150 ease-in-out">
        <Textarea
          ref={textareaRef}
          placeholder="Ask Kleo to create amazing LinkedIn content..."
          value={input}
          onChange={handleInput}
          className={cx(
            'min-h-[56px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-transparent border-none px-4 py-4 pb-12 focus:ring-0 focus:ring-offset-0',
            className,
          )}
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
      <div className="flex flex-wrap gap-2 justify-center mt-6">
        {[
          'Career update post',
          'Industry insights',
          'Professional tips',
          'Company announcement'
        ].map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-sm bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => setInput(`Write a ${suggestion.toLowerCase()}`)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
} 