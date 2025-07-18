'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import useSWRInfinite from 'swr/infinite';
import { Search, MessageSquare, Plus } from 'lucide-react';

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

  // Flatten all chat data
  const allChats = paginatedChatHistories?.flatMap(page => page.chats) || [];
  
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
          </CommandItem>
        </CommandGroup>

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