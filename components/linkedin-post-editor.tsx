'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { default as StarterKit } from '@tiptap/starter-kit';
import { Button } from './ui/button';
import { memo, useEffect, useRef } from 'react';

interface LinkedInPostEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onToggleView: () => void;
}

export const LinkedInPostEditor = memo(function LinkedInPostEditor({
  content,
  onContentChange,
  onToggleView,
}: LinkedInPostEditorProps) {
  const isInternalUpdateRef = useRef(false);
  const contentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure paragraph to remove default margins that might conflict
        paragraph: {
          HTMLAttributes: {
            class: 'mb-2',
          },
        },
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      
      // Mark this as an internal update to prevent circular updates
      isInternalUpdateRef.current = true;
      contentRef.current = newContent;
      
      onContentChange(newContent);

    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[400px] text-sm leading-relaxed text-[#000000E9] [&_p]:mb-2 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2',
      },
    },
    // Add these options to ensure consistent styling
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });

  useEffect(() => {
    // Only update if:
    // 1. Editor exists
    // 2. Content is different from what's currently in the editor
    // 3. This is not an internal update (from user typing)
    // 4. Content is different from our last known content
    if (
      editor && 
      content !== editor.getHTML() && 
      !isInternalUpdateRef.current &&
      content !== contentRef.current
    ) {
      // Update our content reference
      contentRef.current = content;
      
      // Convert content to proper HTML structure for TipTap
      const convertToEditorFormat = (inputContent: string) => {
        console.log('External content update:', inputContent);
        
        // Handle HTML content with spans/br structure (from preview)
        if (inputContent.includes('<span>') && inputContent.includes('<br>')) {
          return inputContent
            .replace(/<span>(.*?)<br><\/span>/g, '$1\n')
            .replace(/<span><br><\/span>/g, '\n')
            .replace(/<span>(.*?)<\/span>/g, '$1\n')
            .split(/\n\s*\n/)
            .map(paragraph => {
              const trimmed = paragraph.trim();
              if (!trimmed) return '';
              const withFormatting = trimmed
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
              return `<p>${withFormatting}</p>`;
            })
            .filter(p => p !== '')
            .join('');
        }
        
        // Handle plain text content (from AI generation)
        if (!inputContent.includes('<') || !inputContent.includes('>')) {
          // Plain text - convert to proper paragraph structure
          return inputContent
            .split(/\n\s*\n/) // Split on double line breaks for paragraphs
            .map(paragraph => {
              const trimmed = paragraph.trim();
              if (!trimmed) return '';
              // Convert markdown formatting and preserve single line breaks
              const withFormatting = trimmed
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>'); // Convert single line breaks to <br>
              return `<p>${withFormatting}</p>`;
            })
            .filter(p => p !== '')
            .join('');
        }
        
        // Already formatted HTML
        return inputContent;
      };
      
      const formattedContent = convertToEditorFormat(content);
      console.log('Setting content from external source:', formattedContent);
      
      // Use emitUpdate: false to prevent triggering onUpdate during external content set
      editor.commands.setContent(formattedContent, {
        emitUpdate: false,
        parseOptions: {
          preserveWhitespace: 'full',
        },
      });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        {/* Clear Content */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().clearContent().run()}
          className="size-8 p-0"
          title="Clear all content"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="size-4">
            <path d="M8.586 8.858l-4.95 4.95 5.194 5.194H10V19h1.172l3.778-3.778-6.364-6.364zM10 7.444l6.364 6.364 2.828-2.829-6.364-6.364L10 7.444zM14 19h7v2h-9l-3.998.002-6.487-6.487a1 1 0 0 1 0-1.414L12.12 2.494a1 1 0 0 1 1.415 0l7.778 7.778a1 1 0 0 1 0 1.414L14 19z" />
          </svg>
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`size-8 p-0 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
          title="Bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="size-4">
            <path d="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8z" />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`size-8 p-0 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
          title="Italic"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="size-4">
            <path d="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15z" />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`size-8 p-0 ${editor.isActive('strike') ? 'bg-accent' : ''}`}
          title="Strikethrough"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="size-4">
            <path d="M17.1538 14C17.3846 14.5161 17.5 15.0893 17.5 15.7196C17.5 17.0625 16.9762 18.1116 15.9286 18.867C14.8809 19.6223 13.4335 20 11.5862 20C9.94674 20 8.32335 19.6185 6.71592 18.8555V16.6009C8.23538 17.4783 9.7908 17.917 11.3822 17.917C13.9333 17.917 15.2128 17.1846 15.2208 15.7196C15.2208 15.0939 15.0049 14.5598 14.5731 14.1173C14.5339 14.0772 14.4939 14.0381 14.4531 14H3V12H21V14H17.1538ZM13.076 11H7.62908C7.4566 10.8433 7.29616 10.6692 7.14776 10.4778C6.71592 9.92084 6.5 9.24559 6.5 8.45207C6.5 7.21602 6.96583 6.165 7.89749 5.299C8.82916 4.43299 10.2706 4 12.2219 4C13.6934 4 15.1009 4.32808 16.4444 4.98426V7.13591C15.2448 6.44921 13.9293 6.10587 12.4978 6.10587C10.0187 6.10587 8.77917 6.88793 8.77917 8.45207C8.77917 8.87172 8.99709 9.23796 9.43293 9.55079C9.86878 9.86362 10.4066 10.1135 11.0463 10.3004C11.6665 10.4816 12.3431 10.7148 13.076 11H13.076Z" />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`size-8 p-0 ${editor.isActive('code') ? 'bg-accent' : ''}`}
          title="Code"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="size-4">
            <path d="M23 12l-7.071 7.071-1.414-1.414L20.172 12l-5.657-5.657 1.414-1.414L23 12zM3.828 12l5.657 5.657-1.414 1.414L1 12l7.071-7.071 1.414 1.414L3.828 12z" />
          </svg>
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`size-8 p-0 ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}
          title="Bullet list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" className="size-4">
            <path d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`size-8 p-0 ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}
          title="Numbered list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" className="size-4">
            <path d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM2.5 4.5A.5.5 0 0 1 3 4h.5v1.5H3a.5.5 0 0 1 0-1zM3 8a.5.5 0 0 1-.5-.5V7h.5a.5.5 0 0 1 0 1zM2.5 11.5A.5.5 0 0 1 3 11h.5v1.5H3a.5.5 0 0 1-.5-.5z"/>
            <path d="M2 1a1 1 0 0 1 1-1h.5a.5.5 0 0 1 0 1H3v1.5a.5.5 0 0 1-1 0V1zm0 3a1 1 0 0 1 1-1h.5a.5.5 0 0 1 0 1H3v1.5a.5.5 0 0 1-1 0V4zm0 3a1 1 0 0 1 1-1h.5a.5.5 0 0 1 0 1H3v1.5a.5.5 0 0 1-1 0V7z"/>
          </svg>
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Emoji Placeholder */}
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          title="Insert emoji"
          onClick={() => {
            // Placeholder for emoji functionality
            editor.chain().focus().insertContent('😊').run();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="size-4">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-5-7h2a3 3 0 0 0 6 0h2a5 5 0 0 1-10 0zm1-2a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm8 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
          </svg>
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative px-4 pb-4">
          <EditorContent 
            editor={editor} 
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}); 