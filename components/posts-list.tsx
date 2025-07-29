'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { FileIcon, PlusIcon, LoaderIcon, TrashIcon } from './icons';
import { PostStatusBadge } from './post-status-badge';
import { fetcher, generateUUID } from '@/lib/utils';
import { deletePost } from '@/app/actions/post-actions';
import type { Document } from '@/lib/db/schema';

export function PostsList() {
  const { data: documents, isLoading, error } = useSWR<Document[]>(
    '/api/posts',
    fetcher
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin">
          <LoaderIcon size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load posts.</p>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto size-12 text-muted-foreground/50 mb-4">
          <FileIcon size={48} />
        </div>
        <h3 className="text-lg font-medium mb-2">No posts yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your first post to get started
        </p>
        <Link href="/">
          <Button>
            <span className="mr-2">
              <PlusIcon size={16} />
            </span>
            Create New Post
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((document) => (
        <PostRow key={`${document.id}-${document.createdAt}`} document={document} />
      ))}
    </div>
  );
}

function PostRow({ document }: { document: Document }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const truncateContent = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  const getPreviewContent = (content: string | null) => {
    if (!content) return 'No content';
    
    try {
      // Parse the content as JSON
      const parsedContent = JSON.parse(content);
      
      // Extract the text field from the JSON object
      if (parsedContent && typeof parsedContent === 'object' && parsedContent.text) {
        return truncateContent(parsedContent.text);
      }
      
      // Fallback to original content if text field is not found
      return truncateContent(content);
    } catch (e) {
      // If parsing fails, return the original content
      return truncateContent(content);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleRowClick = async (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('[data-action-button]')) {
      return;
    }
    
    try {
      // Try to find the existing chat that created this document
      const response = await fetch(`/api/posts/${document.id}/chat`);
      
      if (response.ok) {
        const { chatId } = await response.json();
        if (chatId) {
          // Navigate to the existing chat with the document
          window.location.href = `/chat/${chatId}?documentId=${document.id}`;
          return;
        }
      }
    } catch (error) {
      console.error('Error finding chat for document:', error);
    }
    
    // Fallback: generate a new chat ID if we can't find the original
    const chatId = generateUUID();
    window.location.href = `/chat/${chatId}?documentId=${document.id}`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deletePost(document.id);
      if (result.success) {
        // Revalidate the posts list
        mutate('/api/posts');
      } else {
        console.error('Failed to delete post:', result.error);
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      // You could add a toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-lg border bg-card cursor-pointer transition-all hover:bg-muted/50 hover:shadow-sm"
      onClick={handleRowClick}
    >
      <div className="flex items-center justify-center size-10 rounded-lg bg-muted/50">
        <span className="text-muted-foreground">
          <FileIcon size={20} />
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-sm line-clamp-1">
            {document.title}
          </h3>
          <PostStatusBadge status={document.status || 'draft'} />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {getPreviewContent(document.content)}
        </p>
      </div>
      
      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
        <div className="font-medium">
          {formatDate(document.createdAt)}
        </div>
        <div>
          {formatDistance(new Date(document.createdAt), new Date(), { 
            addSuffix: true 
          })}
        </div>
      </div>

      <div 
        className="flex items-center gap-2" 
        data-action-button
        onClick={(e) => e.stopPropagation()}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="size-8 p-0 text-muted-foreground hover:text-destructive"
              disabled={isDeleting}
            >
              <TrashIcon size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{document.title}&rdquo;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 