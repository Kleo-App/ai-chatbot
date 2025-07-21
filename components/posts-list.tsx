'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { Button } from './ui/button';
import { FileIcon, PlusIcon, LoaderIcon } from './icons';
import { fetcher, generateUUID } from '@/lib/utils';
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
  const truncateContent = (content: string, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  const getPreviewContent = (content: string | null) => {
    if (!content) return 'No content';
    
    // Remove HTML tags for preview
    const textContent = content.replace(/<[^>]*>/g, '');
    return truncateContent(textContent);
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

  const handleRowClick = () => {
    // Generate a new chat ID and navigate to it with the document
    const chatId = generateUUID();
    window.location.href = `/chat/${chatId}?documentId=${document.id}`;
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
        <h3 className="font-medium text-sm line-clamp-1 mb-1">
          {document.title}
        </h3>
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
    </div>
  );
} 