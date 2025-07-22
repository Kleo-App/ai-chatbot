'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import useSWRInfinite from 'swr/infinite';
import { MessageSquare, } from 'lucide-react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Chat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { getChatHistoryPaginationKey, type ChatHistory } from './sidebar-history';

type GroupedChats = {
  pinned: Chat[];
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      // Handle pinned chats first
      if (chat.pinned) {
        groups.pinned.push(chat);
        return groups;
      }

      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      pinned: [],
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: paginatedChatHistories,
    setSize,
    isLoading,
  } = useSWRInfinite<ChatHistory>(
    user 
      ? getChatHistoryPaginationKey 
      : () => null,
    fetcher,
    {
      fallbackData: [],
    }
  );

  // Flatten all chat data and filter out document edit chats
  const allChats = paginatedChatHistories?.flatMap(page => page.chats).filter(
    chat => !chat.title.startsWith('Edit:')
  ) || [];
  
  // Filter chats based on search query
  const filteredChats = searchQuery
    ? allChats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allChats;

  const groupedChats = groupChatsByDate(filteredChats);

  const handleChatSelect = useCallback((chatId: string) => {
    router.push(`/chat/${chatId}`);
    onOpenChange(false);
  }, [router, onOpenChange]);

  const handleNewChat = useCallback(() => {
    router.push('/');
    onOpenChange(false);
  }, [router, onOpenChange]);

  // Load more chats when needed
  useEffect(() => {
    if (open && paginatedChatHistories && paginatedChatHistories.length === 1) {
      // Load additional pages when menu opens
      setSize(3);
    }
  }, [open, paginatedChatHistories, setSize]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-3xl">
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5">
          <CommandInput 
            placeholder="Search chats..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[460px] overflow-auto">
            <CommandEmpty>No chats found.</CommandEmpty>
        
        {/* Actions Group */}
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={handleNewChat}
            className="flex items-center gap-2 h-12 px-3"
          >
            <MessageSquare className="size-4 text-muted-foreground" />
            <span>Create New Chat</span>
            <span className="ml-auto text-xs text-muted-foreground">⌘J</span>
          </CommandItem>
        </CommandGroup>

        {/* Pinned */}
        {groupedChats.pinned && groupedChats.pinned.length > 0 && (
          <CommandGroup heading="Pinned">
            {groupedChats.pinned.slice(0, 10).map((chat) => (
              <CommandItem
                key={chat.id}
                value={`conversation:${chat.id}`}
                onSelect={() => handleChatSelect(chat.id)}
                className="flex items-center gap-2 h-12 px-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="truncate text-primary">{chat.title}</div>
                </div>
                <span className="text-muted-foreground text-sm whitespace-nowrap flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-[2]">
                    <path d="M4 20L8.5 15.5M14 20L4 10L5 9L9.06551 8.32242C10.2858 8.11904 11.3433 7.36248 11.9298 6.27324L13.2256 3.86676C13.8608 2.68717 15.4534 2.45342 16.4007 3.40075L20.5993 7.59926C21.5466 8.54658 21.3128 10.1392 20.1332 10.7744L17.7268 12.0702C16.6375 12.6567 15.881 13.7142 15.6776 14.9345L15 19L14 20Z" stroke="currentColor" strokeLinecap="square"></path>
                  </svg>
                  Pinned
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Today */}
        {groupedChats.today.length > 0 && (
          <CommandGroup heading="Today">
            {groupedChats.today.slice(0, 10).map((chat) => (
              <CommandItem
                key={chat.id}
                value={`conversation:${chat.id}`}
                onSelect={() => handleChatSelect(chat.id)}
                className="flex items-center gap-2 h-12 px-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="truncate text-primary">{chat.title}</div>
                </div>
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  {new Date(chat.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Yesterday */}
        {groupedChats.yesterday.length > 0 && (
          <CommandGroup heading="Yesterday">
            {groupedChats.yesterday.slice(0, 10).map((chat) => (
              <CommandItem
                key={chat.id}
                value={`conversation:${chat.id}`}
                onSelect={() => handleChatSelect(chat.id)}
                className="flex items-center gap-2 h-12 px-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="truncate text-primary">{chat.title}</div>
                </div>
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  Yesterday
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Last 7 Days */}
        {groupedChats.lastWeek.length > 0 && (
          <CommandGroup heading="Last 7 Days">
            {groupedChats.lastWeek.slice(0, 10).map((chat) => (
              <CommandItem
                key={chat.id}
                value={`conversation:${chat.id}`}
                onSelect={() => handleChatSelect(chat.id)}
                className="flex items-center gap-2 h-12 px-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="truncate text-primary">{chat.title}</div>
                </div>
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  {new Date(chat.createdAt).toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Last Month */}
        {groupedChats.lastMonth.length > 0 && (
          <CommandGroup heading="Last Month">
            {groupedChats.lastMonth.slice(0, 10).map((chat) => (
              <CommandItem
                key={chat.id}
                value={`conversation:${chat.id}`}
                onSelect={() => handleChatSelect(chat.id)}
                className="flex items-center gap-2 h-12 px-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="truncate text-primary">{chat.title}</div>
                </div>
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  {new Date(chat.createdAt).toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Older */}
        {groupedChats.older.length > 0 && (
          <CommandGroup heading="Older">
            {groupedChats.older.slice(0, 10).map((chat) => (
              <CommandItem
                key={chat.id}
                value={`conversation:${chat.id}`}
                onSelect={() => handleChatSelect(chat.id)}
                className="flex items-center gap-2 h-12 px-3"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="truncate text-primary">{chat.title}</div>
                </div>
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  {new Date(chat.createdAt).toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric',
                    year: new Date(chat.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  })}
                </span>
              </CommandItem>
            ))}
                     </CommandGroup>
         )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
} 