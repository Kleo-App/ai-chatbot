'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import type { Chat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { ChatItem } from './sidebar-history-item';
import useSWRInfinite from 'swr/infinite';
import { LoaderIcon } from './icons';

type GroupedChats = {
  pinned: Chat[];
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  const { pinned, unpinned } = chats.reduce<{ pinned: Chat[]; unpinned: Chat[] }>(
    (acc, chat) => {
      if (chat.pinned) {
        acc.pinned.push(chat);
      } else {
        acc.unpinned.push(chat);
      }
      return acc;
    },
    { pinned: [], unpinned: [] }
  );

  const groupedUnpinned = unpinned.reduce(
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
      today: [] as Chat[],
      yesterday: [] as Chat[],
      lastWeek: [] as Chat[],
      lastMonth: [] as Chat[],
      older: [] as Chat[],
    },
  );

  return {
    pinned,
    ...groupedUnpinned,
  };
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory | null,
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`;

  if (!previousPageData) return null;

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) return null;

  return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

interface SidebarHistoryProps {
  commandMenu: {
    open: boolean;
    setOpen: (open: boolean) => void;
    toggle: () => void;
    close: () => void;
  };
}

export function SidebarHistory({ commandMenu }: SidebarHistoryProps) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const { user } = useUser();

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
  });

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        mutate((chatHistories) => {
          if (chatHistories) {
            return chatHistories.map((chatHistory) => ({
              ...chatHistory,
              chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
            }));
          }
        });

        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/');
    }
  };

  const handleRename = (chatId: string, newTitle: string) => {
    mutate((chatHistories) => {
      if (chatHistories) {
        return chatHistories.map((chatHistory) => ({
          ...chatHistory,
          chats: chatHistory.chats.map((chat) =>
            chat.id === chatId ? { ...chat, title: newTitle } : chat
          ),
        }));
      }
    }, false);
  };

  const handlePin = (chatId: string, pinned: boolean) => {
    mutate((chatHistories) => {
      if (chatHistories) {
        return chatHistories.map((chatHistory) => ({
          ...chatHistory,
          chats: chatHistory.chats.map((chat) =>
            chat.id === chatId ? { ...chat, pinned } : chat
          ),
        }));
      }
    }, false);
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden py-2">
        <div className="py-1 pl-3 text-xs text-foreground sticky top-0 z-20 text-nowrap">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col gap-1">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-xl h-9 flex gap-2 px-3 items-center mx-1"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden py-2">
        <SidebarGroupContent>
          <div className="px-3 text-sidebar-foreground/60 w-full flex flex-row justify-center items-center text-sm gap-2">
            No history
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden py-2">
        <SidebarGroupContent>
          <SidebarMenu className="gap-1">
            {paginatedChatHistories &&
              (() => {
                const chatsFromHistory = paginatedChatHistories.flatMap(
                  (paginatedChatHistory) => paginatedChatHistory.chats,
                );

                // Filter out document edit chats (those starting with "Edit:")
                const filteredChats = chatsFromHistory.filter(
                  (chat) => !chat.title.startsWith('Edit:')
                );

                const groupedChats = groupChatsByDate(filteredChats);

                return (
                  <div className="flex flex-col gap-4">
                    {groupedChats.pinned.length > 0 && (
                      <div>
                        <div className="py-1 pl-3 text-xs text-foreground sticky top-0 z-20 text-nowrap">
                          Pinned
                        </div>
                        <div className="flex flex-col gap-1">
                          {groupedChats.pinned.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={handleRename}
                              onPin={handlePin}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {groupedChats.today.length > 0 && (
                      <div>
                        <div className="py-1 pl-3 text-xs text-foreground sticky top-0 z-20 text-nowrap">
                          Today
                        </div>
                        <div className="flex flex-col gap-1">
                          {groupedChats.today.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={handleRename}
                              onPin={handlePin}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {groupedChats.yesterday.length > 0 && (
                      <div>
                        <div className="py-1 pl-3 text-xs text-foreground sticky top-0 z-20 text-nowrap">
                          Yesterday
                        </div>
                        <div className="flex flex-col gap-1">
                          {groupedChats.yesterday.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={handleRename}
                              onPin={handlePin}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {groupedChats.lastWeek.length > 0 && (
                      <div>
                        <div className="py-1 pl-3 text-xs text-foreground sticky top-0 z-20 text-nowrap">
                          Last 7 days
                        </div>
                        <div className="flex flex-col gap-1">
                          {groupedChats.lastWeek.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={handleRename}
                              onPin={handlePin}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {groupedChats.lastMonth.length > 0 && (
                      <div>
                        <div className="py-1 pl-3 text-xs text-foreground sticky top-0 z-20 text-nowrap">
                          Last 30 days
                        </div>
                        <div className="flex flex-col gap-1">
                          {groupedChats.lastMonth.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={handleRename}
                              onPin={handlePin}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {groupedChats.older.length > 0 && (
                      <div>
                        <div className="py-1 pl-3 text-xs text-foreground sticky top-0 z-20 text-nowrap">
                          Older than last month
                        </div>
                        <div className="flex flex-col gap-1">
                          {groupedChats.older.map((chat) => (
                            <ChatItem
                              key={chat.id}
                              chat={chat}
                              isActive={chat.id === id}
                              onDelete={(chatId) => {
                                setDeleteId(chatId);
                                setShowDeleteDialog(true);
                              }}
                              onRename={handleRename}
                              onPin={handlePin}
                              setOpenMobile={setOpenMobile}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {/* See all button */}
                    <button
                      className="inline-flex items-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-100 [&_svg]:shrink-0 select-none text-muted-foreground bg-transparent hover:text-foreground disabled:hover:text-muted-foreground w-full justify-start px-3 text-xs font-semibold no-wrap pb-6 mt-1"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        commandMenu.toggle();
                      }}
                    >
                      See all
                    </button>
                  </div>
                );
              })()}
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isValidating && !hasReachedEnd) {
                setSize((size) => size + 1);
              }
            }}
          />

          {!hasReachedEnd && (
            <div className="p-3 text-sidebar-foreground/60 flex flex-row gap-2 items-center mt-8">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div>Loading Chats...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
