'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { default as StarterKit } from '@tiptap/starter-kit';
import { Button } from './ui/button';
import { memo, useEffect, useState, useRef } from 'react';
import { LinkedInHookSelector } from './linkedin-hook-selector';
import { useArtifact } from '@/hooks/use-artifact';
import { Eraser, Smile } from 'lucide-react';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';


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
  const lastExternalContentRef = useRef(content);
  const lastCursorPositionRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { artifact } = useArtifact();
  const [selectedHook, setSelectedHook] = useState<number | null>(null);
  const [hasValidSelection, setHasValidSelection] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
   
  // Simple content processing that matches LinkedIn post preview exactly
  const processContentForEditor = (inputContent: string) => {
    if (!inputContent) return '';
    
    // Try to parse JSON content first (like LinkedIn preview does)
    let processedText = inputContent;
    try {
      if (inputContent.trim().startsWith('{"text":')) {
        const parsedContent = JSON.parse(inputContent);
        if (parsedContent && typeof parsedContent === 'object' && 'text' in parsedContent) {
          processedText = parsedContent.text;
        }
      }
    } catch (e) {
      // If parsing fails, use the original content
      processedText = inputContent;
    }
    
    // Check if content is HTML or plain text
    const isHTML = /<[^>]*>/.test(processedText);
    
    if (isHTML) {
      // For HTML content, clean up any existing mb-2 classes before returning
      const cleanedHTML = processedText
        .replace(/class="mb-2"/g, '')
        .replace(/class="[^"]*mb-2[^"]*"/g, (match) => {
          // Remove mb-2 from class lists like "class="some-class mb-2 other-class""
          return match.replace(/\s*mb-2\s*/g, ' ').replace(/class="\s*"/g, '').replace(/class="\s+/g, 'class="').replace(/\s+"/g, '"');
        });
      return cleanedHTML;
    } else {
      // For plain text, convert each line to a separate paragraph (like LinkedIn preview)
      const paragraphs = processedText
        .split(/\n/) // Split on single line breaks to preserve empty lines
        .map(line => {
          const trimmed = line.trim();
          if (trimmed.length === 0) {
            // Preserve empty lines as empty p tags
            return '<p></p>';
          }
          // Convert markdown formatting
          const formatted = trimmed
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
          return `<p>${formatted}</p>`;
        })
        .join('');
      
      return paragraphs;
    }
  };
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: '',
          },
        },
        hardBreak: false,
      }),
    ],
    content: processContentForEditor(content),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      
      // Mark that this update is from user typing
      isInternalUpdateRef.current = true;
      isTypingRef.current = true;
      
      // Clear any existing timeout to extend typing detection
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a timeout to detect when user stops typing
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        isInternalUpdateRef.current = false; // Reset both flags together
      }, 500); // Longer timeout to ensure we catch the feedback loop
      
      // Store cursor position for potential restoration
      const { from } = editor.state.selection;
      lastCursorPositionRef.current = from;
      
      // Store the content we're about to send to prevent feedback loops
      lastExternalContentRef.current = newContent;
      
      onContentChange(newContent);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const { doc } = editor.state;
      
      const paragraphs: any[] = [];
      doc.nodesBetween(from, to, (node) => {
        if (node.type.name === 'paragraph') {
          paragraphs.push(node);
        }
      });
      
      setHasValidSelection(paragraphs.length >= 2);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[400px] text-sm text-black bg-white [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:mb-1 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:mb-2',
      },
    },
  });

  useEffect(() => {
    // Skip ALL updates if user is currently typing - this prevents feedback loops
    if (isTypingRef.current || isInternalUpdateRef.current) {
      return;
    }
    
    // Only update if content has actually changed from external source
    if (editor && content !== lastExternalContentRef.current) {
      const currentText = editor.getText();
      const processedContent = processContentForEditor(content);
      
      // Get the text from processed content for comparison
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = processedContent;
      const newContentText = tempDiv.textContent || tempDiv.innerText || '';
      
      // Only update if the actual text content is significantly different
      const textIsDifferent = currentText.trim() !== newContentText.trim();
      
      if (textIsDifferent || currentText.length === 0) {
        // This is a real external update (like AI generation)
        editor.commands.setContent(processedContent, {
          emitUpdate: false,
        });
        
        // Move cursor to end for external updates
        editor.commands.focus('end');
        
        // Update our reference to the new external content
        lastExternalContentRef.current = content;
      }
    }
  }, [content, editor]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle click outside emoji picker to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  if (!editor) {
    return null;
  }

  // Helper function to reorder paragraphs by length
  const reorderParagraphsByLength = (pattern: 'short-to-long' | 'long-to-short' | 'short-long-short' | 'long-short-long') => {
    const { from, to } = editor.state.selection;
    const { state } = editor;
    const { doc } = state;
    
    const paragraphs: { pos: number; node: any; content: string }[] = [];
    doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'paragraph') {
        paragraphs.push({ pos, node, content: node.textContent });
      }
    });
    
    if (paragraphs.length < 2) return;
    
    const sortedByLength = [...paragraphs].sort((a, b) => a.content.length - b.content.length);
    
    let reorderedContent: string[];
    
    switch (pattern) {
      case 'short-to-long':
        reorderedContent = sortedByLength.map(p => p.content);
        break;
      case 'long-to-short':
        reorderedContent = sortedByLength.reverse().map(p => p.content);
        break;
      case 'short-long-short':
        const shorts = sortedByLength.slice(0, Math.ceil(sortedByLength.length / 2));
        const longs = sortedByLength.slice(Math.ceil(sortedByLength.length / 2));
        reorderedContent = [
          ...shorts.slice(0, Math.ceil(shorts.length / 2)),
          ...longs,
          ...shorts.slice(Math.ceil(shorts.length / 2))
        ].map(p => p.content);
        break;
      case 'long-short-long':
        const shortParagraphs = sortedByLength.slice(0, Math.floor(sortedByLength.length / 2));
        const longParagraphs = sortedByLength.slice(Math.floor(sortedByLength.length / 2));
        reorderedContent = [
          ...longParagraphs.slice(0, Math.ceil(longParagraphs.length / 2)),
          ...shortParagraphs,
          ...longParagraphs.slice(Math.ceil(longParagraphs.length / 2))
        ].map(p => p.content);
        break;
    }
    
    let currentOffset = 0;
    paragraphs.forEach((paragraph, index) => {
      const startPos = paragraph.pos + 1;
      const endPos = startPos + paragraph.content.length;
      const adjustedStartPos = startPos + currentOffset;
      const adjustedEndPos = endPos + currentOffset;
      
      const newContent = reorderedContent[index];
      const lengthDiff = newContent.length - paragraph.content.length;
      
      editor.chain().focus()
        .setTextSelection({ from: adjustedStartPos, to: adjustedEndPos })
        .insertContent(newContent)
        .run();
      
      currentOffset += lengthDiff;
    });
  };

  // Helper function to add list symbols to paragraphs
  const addListSymbolToParagraphs = (symbol: string, isNumbered = false) => {
    const { from, to } = editor.state.selection;
    const { state } = editor;
    const { doc } = state;
    
    const paragraphs: { pos: number; node: any }[] = [];
    doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'paragraph') {
        paragraphs.push({ pos, node });
      }
    });
    
    if (paragraphs.length === 0) {
      const currentNode = doc.nodeAt(from);
      if (currentNode && currentNode.type.name === 'paragraph') {
        const text = currentNode.textContent;
        const existingSymbol = text.match(/^[•\-→]\s|^\d+\.\s/);
        
        if (existingSymbol) {
          // Check if it's the same symbol we're trying to add
          const currentSymbol = existingSymbol[0];
          const targetSymbol = isNumbered ? /^\d+\.\s/ : new RegExp(`^\\${symbol.replace(/\s/g, '\\s')}`);
          const isSameSymbol = isNumbered ? /^\d+\.\s/.test(currentSymbol) : targetSymbol.test(currentSymbol);
          
          if (isSameSymbol) {
            // Same symbol - remove it (toggle off)
            const symbolLength = existingSymbol[0].length;
            editor.chain().focus().setTextSelection(from).deleteRange({ from, to: from + symbolLength }).run();
          } else {
            // Different symbol - replace it
            const symbolLength = existingSymbol[0].length;
            const insertSymbol = isNumbered ? '1. ' : symbol;
            editor.chain().focus().setTextSelection(from).deleteRange({ from, to: from + symbolLength }).insertContent(insertSymbol).run();
          }
        } else {
          // No symbol - add new one
          const insertSymbol = isNumbered ? '1. ' : symbol;
          editor.chain().focus().setTextSelection(from).insertContent(insertSymbol).run();
        }
      } else {
        const insertSymbol = isNumbered ? '1. ' : symbol;
        editor.chain().focus().insertContent(insertSymbol).run();
      }
    } else {
      // Check if all paragraphs have the SAME symbol we're trying to add
      let allHaveSameSymbol = true;
      
      paragraphs.forEach(({ node }) => {
        const text = node.textContent;
        const existingSymbol = text.match(/^[•\-→]\s|^\d+\.\s/);
        
        if (!existingSymbol) {
          allHaveSameSymbol = false;
        } else {
          const currentSymbol = existingSymbol[0];
          const targetSymbol = isNumbered ? /^\d+\.\s/ : new RegExp(`^\\${symbol.replace(/\s/g, '\\s')}`);
          const isSameSymbol = isNumbered ? /^\d+\.\s/.test(currentSymbol) : targetSymbol.test(currentSymbol);
          
          if (!isSameSymbol) {
            allHaveSameSymbol = false;
          }
        }
      });
      
      paragraphs.reverse().forEach(({ pos, node }, index) => {
        const text = node.textContent;
        const startPos = pos + 1;
        const existingSymbol = text.match(/^[•\-→]\s|^\d+\.\s/);
        
        if (allHaveSameSymbol && existingSymbol) {
          // All have the same symbol we're clicking - remove it (toggle off)
          const symbolLength = existingSymbol[0].length;
          editor.chain().focus().setTextSelection(startPos).deleteRange({ from: startPos, to: startPos + symbolLength }).run();
        } else {
          // Either no symbol or different symbol - replace/add the new one
          let insertSymbol = symbol;
          if (isNumbered) {
            const originalIndex = paragraphs.length - 1 - index;
            insertSymbol = `${originalIndex + 1}. `;
          }
          
          if (existingSymbol) {
            // Replace existing symbol
            const symbolLength = existingSymbol[0].length;
            editor.chain().focus().setTextSelection(startPos).deleteRange({ from: startPos, to: startPos + symbolLength }).insertContent(insertSymbol).run();
          } else {
            // Add new symbol
            editor.chain().focus().setTextSelection(startPos).insertContent(insertSymbol).run();
          }
        }
      });
    }
  };

  // Helper function to clear all formatting from selected paragraphs
  const clearFormatting = () => {
    const { from, to } = editor.state.selection;
    const { state } = editor;
    const { doc } = state;
    
    const paragraphs: { pos: number; node: any }[] = [];
    doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === 'paragraph') {
        paragraphs.push({ pos, node });
      }
    });
    
    if (paragraphs.length === 0) {
      // Single paragraph at cursor
      const currentNode = doc.nodeAt(from);
      if (currentNode && currentNode.type.name === 'paragraph') {
        const text = currentNode.textContent;
        const existingSymbol = text.match(/^[•\-→]\s|^\d+\.\s/);
        
        if (existingSymbol) {
          const symbolLength = existingSymbol[0].length;
          editor.chain().focus().setTextSelection(from).deleteRange({ from, to: from + symbolLength }).run();
        }
      }
    } else {
      // Multiple paragraphs selected
      paragraphs.reverse().forEach(({ pos, node }) => {
        const text = node.textContent;
        const startPos = pos + 1;
        const existingSymbol = text.match(/^[•\-→]\s|^\d+\.\s/);
        
        if (existingSymbol) {
          const symbolLength = existingSymbol[0].length;
          editor.chain().focus().setTextSelection(startPos).deleteRange({ from: startPos, to: startPos + symbolLength }).run();
        }
      });
    }
  };

  // Helper function to insert emoji at cursor position
  const insertEmoji = (emoji: string) => {
    if (editor) {
      editor.chain().focus().insertContent(emoji).run();
      setShowEmojiPicker(false);
    }
  };

  // Handle hook selection
  const handleHookSelect = (hook: { id: number, source: string, content: string }) => {
    setSelectedHook(hook.id);
    
    if (editor) {
      editor.commands.clearContent();
      editor.commands.setContent(`<p>${hook.content}</p><p></p>`);
      editor.commands.focus('end');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background ml-2">
      {/* LinkedIn Hook Selector */}
      {artifact.linkedInHooks && artifact.linkedInHooks.length > 0 && !selectedHook && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold mb-2">Choose a hook for your LinkedIn post</h3>
          <p className="text-gray-600 text-sm mb-4">The hook is the first thing your audience will see.</p>
          <LinkedInHookSelector
            hooks={artifact.linkedInHooks}
            onHookSelect={handleHookSelect}
            isReadonly={false}
          />
        </div>
      )}
      
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-6 py-2 border-b bg-muted/30">
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

        <div className="w-px h-6 bg-border mx-1" />

        {/* List Formatting Buttons */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addListSymbolToParagraphs('• ')}
          className="size-8 p-0"
          title="Bullet list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" className="size-4">
            <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="black">
              <path d="M3.75 10.5C4.57843 10.5 5.25 9.82843 5.25 9C5.25 8.17157 4.57843 7.5 3.75 7.5C2.92157 7.5 2.25 8.17157 2.25 9C2.25 9.82843 2.92157 10.5 3.75 10.5Z" fill="black" stroke="none" />
              <path d="M3.75 5.25C4.57843 5.25 5.25 4.57843 5.25 3.75C5.25 2.92157 4.57843 2.25 3.75 2.25C2.92157 2.25 2.25 2.92157 2.25 3.75C2.25 4.57843 2.92157 5.25 3.75 5.25Z" fill="black" stroke="none" />
              <path d="M3.75 15.75C4.57843 15.75 5.25 15.0784 5.25 14.25C5.25 13.4216 4.57843 12.75 3.75 12.75C2.92157 12.75 2.25 13.4216 2.25 14.25C2.25 15.0784 2.92157 15.75 3.75 15.75Z" fill="black" stroke="none" />
              <path d="M8.25 9H15.75" stroke="black" />
              <path d="M8.25 3.75H15.75" stroke="black" />
              <path d="M8.25 14.25H15.75" stroke="black" />
            </g>
          </svg>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addListSymbolToParagraphs('- ')}
          className="size-8 p-0"
          title="Dashed list"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="size-4">
            <path d="M5.5 7.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.5 11.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 11.5H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 7.5H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 3.5H3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.5 3.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addListSymbolToParagraphs('', true)}
          className="size-8 p-0"
          title="Numbered list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="size-4">
            <path d="M6.5 7H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 3H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 11H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 9.5C2.2 8.8 2.9 8.4 3.6 8.4C4.3 8.4 5 8.7 5 9.5C5 10.3 4.3 10.8 3.5 11.1C2.7 11.4 2.1 11.7 2 12.5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.5 6V2C3.5 2 3 2.8 2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => addListSymbolToParagraphs('→ ')}
          className="size-8 p-0"
          title="Arrow list"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="size-4">
            <path d="M6.5 7H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 3H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.5 11H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.8 5.5H1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.6 4L4.8 5.5L3.6 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.8 9.5H1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.6 8L4.8 9.5L3.6 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
        
        {/* Clear Formatting Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFormatting}
          className="size-8 p-0"
          title="Clear formatting (remove all list symbols)"
        >
          <Eraser className="size-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Staircase Formatting Buttons */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => reorderParagraphsByLength('short-to-long')}
          className="size-8 p-0"
          title={hasValidSelection ? "Reorder paragraphs: Shortest to Longest" : "Select multiple paragraphs to reorder"}
          disabled={!hasValidSelection}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="size-4">
            <path d="m1.5508 1.0996v1.8008h3.0996v4h4v4h4v4h4v4h4v2.1992h-19.1v1.8008h20.898v-5.8008h-4v-4h-4v-4h-4v-4h-4v-4z" />
          </svg>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => reorderParagraphsByLength('long-to-short')}
          className="size-8 p-0"
          title={hasValidSelection ? "Reorder paragraphs: Longest to Shortest" : "Select multiple paragraphs to reorder"}
          disabled={!hasValidSelection}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="size-4">
            <path d="m1.5508 22.9v-1.8008h3.0996v-4h4v-4h4v-4h4v-4h4v-2.1992h-19.1v-1.8008h20.898v5.8008h-4v4h-4v4h-4v4h-4v4z" />
          </svg>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => reorderParagraphsByLength('short-long-short')}
          className="size-8 p-0"
          title={hasValidSelection ? "Reorder paragraphs: Short-Long-Short pattern" : "Select multiple paragraphs to reorder"}
          disabled={!hasValidSelection}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="size-4">
            <path d="m3.5508 1.0996v1.8008h7.0996v4h4v4h4v2.1992h-4v4h-4v4h-7.0996v1.8008h8.8984v-4h4v-4h4v-5.8008h-4v-4h-4v-4z" />
          </svg>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => reorderParagraphsByLength('long-short-long')}
          className="size-8 p-0"
          title={hasValidSelection ? "Reorder paragraphs: Long-Short-Long pattern" : "Select multiple paragraphs to reorder"}
          disabled={!hasValidSelection}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="size-4">
            <path d="m3.5498 1.0996v1.8008h15.1v2.1992h-4v4h-4v5.8008h4v4h4v2.1992h-15.1v1.8008h16.9v-5.8008h-4v-4h-4v-2.1992h4v-4h4v-5.8008z" />
          </svg>
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Emoji Picker */}
        <div className="relative" ref={emojiPickerRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="size-8 p-0"
            title="Add emoji"
          >
            <Smile className="size-4" />
          </Button>
          
          {showEmojiPicker && (
            <div className="absolute top-10 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-80 max-h-96">
              <EmojiPicker
                onEmojiClick={({ emoji }) => insertEmoji(emoji)}
                emojiStyle={EmojiStyle.NATIVE}
                width={300}
                height={350}
                searchPlaceholder="Search emojis..."
                skinTonesDisabled={true}
                previewConfig={{
                  showPreview: false,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="relative px-6 pt-4 pb-4 bg-white">
          <EditorContent 
            editor={editor} 
            className="h-full bg-white"
          />
        </div>
      </div>
    </div>
  );
}); 