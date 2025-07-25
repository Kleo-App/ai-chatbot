'use client';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { Pin, MoreHorizontal, SquarePen, AlignJustify } from 'lucide-react';
import Link from 'next/link';
import { useState, memo } from 'react';
import { toast } from 'sonner';

import { ModelSelector } from '@/components/model-selector';
import { useSidebar } from './ui/sidebar';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

interface Session {
  user: {
    id: string;
    type: 'regular';
  };
}

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session,
  hasMessages,
  isPinned,
  onPin,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  hasMessages: boolean;
  isPinned?: boolean;
  onPin?: (pinned: boolean) => void;
}) {
  const router = useRouter();
  const { open, toggleSidebar } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${chatId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        router.push('/');
        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);
  };

  const handlePin = async () => {
    const newPinnedStatus = !isPinned;
    
    // Optimistically update the UI immediately
    onPin?.(newPinnedStatus);
    
    const pinPromise = fetch(`/api/chat?id=${chatId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pinned: newPinnedStatus }),
    });

    toast.promise(pinPromise, {
      loading: newPinnedStatus ? 'Pinning chat...' : 'Unpinning chat...',
      success: () => {
        return newPinnedStatus ? 'Chat pinned successfully' : 'Chat unpinned successfully';
      },
      error: (error) => {
        // Revert the optimistic update on error
        onPin?.(!newPinnedStatus);
        return newPinnedStatus ? 'Failed to pin chat' : 'Failed to unpin chat';
      },
    });
  };

  // If no messages, show minimal header with just hamburger menu on mobile
  if (!hasMessages) {
    return (
      <div className="h-12 top-0 sticky z-10 flex flex-row items-start justify-start w-full md:hidden">
        <div className="w-full flex flex-row items-center px-4 pt-2">
          {/* Mobile Sidebar Toggle - Only visible on mobile when no messages */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            aria-label="Toggle Sidebar"
            onClick={toggleSidebar}
          >
            <AlignJustify className="h-7 w-7" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-24 top-0 @[80rem]/nav:h-0 @[80rem]/nav:top-8 sticky z-10 flex flex-row items-start justify-center w-full bg-gradient-to-b from-white via-white via-60% to-transparent @[80rem]/nav:from-transparent @[80rem]/nav:via-transparent -mb-10">
      <div className="w-full flex flex-row items-center justify-between px-4 pt-2">
        {/* Mobile Sidebar Toggle - Left Side */}
        <div className="flex flex-row items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 rounded-full"
            aria-label="Toggle Sidebar"
            onClick={toggleSidebar}
          >
            <AlignJustify className="h-7 w-7" />
          </Button>
        </div>
        
        {/* Action Buttons - Right Side */}
        <div className="flex flex-row items-center gap-0.5">
          {/* New Chat Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-foreground hover:bg-muted border border-transparent"
                >
                  <Link href="/">
                    <SquarePen className="h-5 w-5 stroke-[2]" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New Chat (⌘J)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Pin Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-foreground hover:bg-muted border border-transparent"
            aria-label={isPinned ? 'Unpin' : 'Pin'}
            onClick={handlePin}
          >
            {isPinned ? (
              <svg width="18" height="18" viewBox="-0.5 -0.5 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                <path d="M7.23047 1.26183C7.86569 0.082389 9.45799 -0.151271 10.4053 0.796012L13.2041 3.59484C14.1514 4.54211 13.9177 6.1344 12.7383 6.76964L11.1338 7.6339C10.5893 7.9271 10.2112 8.45562 10.1094 9.06554L9.62207 11.9874L8.33301 13.2765L5 9.9425L2.1377 12.8019L1 13.0001L1.19824 11.8614L4.05664 9.00011L0.723633 5.66711L2.0127 4.37804L4.93359 3.89074C5.54368 3.78906 6.07294 3.41087 6.36621 2.86632L7.23047 1.26183Z" fill="currentColor" />
              </svg>
            ) : (
              <Pin className="h-[18px] w-[18px]" />
            )}
          </Button>

          {/* More Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-foreground hover:bg-muted border border-transparent"
                aria-label="More"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              className="z-50 rounded-2xl bg-white border border-border-l1 text-primary p-1 shadow-sm shadow-black/5 min-w-36 space-y-0.5"
            >
              <DropdownMenuItem 
                className="relative flex select-none items-center cursor-pointer px-3 py-2 rounded-xl text-sm outline-none focus:bg-button-ghost-hover text-fg-secondary"
                onSelect={() => setShowDeleteDialog(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-[2] me-2">
                  <path d="M2.99561 7H20.9956" stroke="currentColor" />
                  <path d="M9.99561 11V17M13.9956 11V17" stroke="currentColor" />
                  <path d="M8 6.5L8.68917 4.08792C8.87315 3.44397 9.46173 3 10.1315 3H13.8685C14.5383 3 15.1268 3.44397 15.3108 4.08792L16 6.5" stroke="currentColor" />
                  <path d="M5 7L5.80098 18.2137C5.91312 19.7837 7.21944 21 8.79336 21H15.2066C16.7806 21 18.0869 19.7837 18.199 18.2137L19 7" stroke="currentColor" />
                </svg>
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


        </div>
      </div>

      {/* Hidden Model and visibility selectors */}
      {false && (
        <ModelSelector
          session={session}
          selectedModelId={selectedModelId}
          className="order-1 md:order-2"
        />
      )}

      {false && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3"
        />
      )}
    </div>

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

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId && 
         prevProps.hasMessages === nextProps.hasMessages &&
         prevProps.isPinned === nextProps.isPinned;
});
