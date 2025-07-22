import type { Chat } from '@/lib/db/schema';
import Link from 'next/link';
import { memo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  MoreHorizontalIcon,
} from './icons';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  onRename,
  onPin,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  onRename: (chatId: string, newTitle: string) => void;
  onPin: (chatId: string, pinned: boolean) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (open) {
      setButtonVisible(true);
    } else {
      const timer = setTimeout(() => {
        setButtonVisible(false);
      }, 150); // Delay to match animation duration
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleRename = async () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a valid title');
      return;
    }

    const trimmedTitle = newTitle.trim();
    
    const renamePromise = fetch(`/api/chat?id=${chat.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: trimmedTitle }),
    });

    toast.promise(renamePromise, {
      loading: 'Renaming chat...',
      success: () => {
        onRename(chat.id, trimmedTitle);
        setShowRenameDialog(false);
        setNewTitle('');
        return 'Chat renamed successfully';
      },
      error: 'Failed to rename chat',
    });
  };

  const openRenameDialog = () => {
    setNewTitle(chat.title);
    setShowRenameDialog(true);
    setOpen(false);
  };

  const handlePin = async () => {
    const newPinnedStatus = !chat.pinned;
    
    // Optimistically update the UI immediately
    onPin(chat.id, newPinnedStatus);
    setOpen(false);
    
    const pinPromise = fetch(`/api/chat?id=${chat.id}`, {
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
        onPin(chat.id, !newPinnedStatus);
        return newPinnedStatus ? 'Failed to pin chat' : 'Failed to unpin chat';
      },
    });
  };

  return (
    <div style={{ opacity: 1 }}>
      <Link 
        href={`/chat/${chat.id}`} 
        onClick={() => setOpenMobile(false)}
        className="peer/menu-button flex items-center gap-2 overflow-hidden rounded-xl text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-1 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 [&>span:last-child]:truncate [&>svg]:shrink-0 hover:text-primary text-sm h-[36px] border-transparent hover:bg-muted/50 data-[state=open]:hover:bg-muted/50 active:bg-muted data-[active=true]:bg-muted aria-expanded:bg-muted/50 group/conversation-item pl-3 pr-1.5 py-1 text-sm w-full flex flex-row text-muted-foreground"
        data-sidebar="menu-button"
        data-active={isActive}
        tabIndex={-1}
        data-state="closed"
      >
        <span 
          className="flex-1 select-none text-nowrap max-w-full overflow-hidden inline-block" 
          style={{ maskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}
        >
          {chat.title}
        </span>
        
        <DropdownMenu open={open} onOpenChange={setOpen} modal={true}>
          <DropdownMenuTrigger asChild>
            <button
              className={`items-center justify-center gap-2 whitespace-nowrap text-sm font-medium leading-[normal] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-100 [&_svg]:shrink-0 select-none hover:bg-muted/50 disabled:hover:bg-transparent border border-transparent size-6 rounded-full text-muted-foreground ${buttonVisible ? 'flex' : 'hidden group-hover/conversation-item:flex'}`}
              type="button"
              aria-haspopup="menu"
              aria-expanded="false"
              data-state="closed"
            >
              <MoreHorizontalIcon size={14} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent 
            side="right" 
            align="start"
            className="z-50 rounded-2xl bg-white border border-border-l1 text-primary p-1 shadow-sm shadow-black/5 min-w-36 space-y-0.5"
          >
            <DropdownMenuItem 
              className="relative flex select-none items-center cursor-pointer px-3 py-2 rounded-xl text-sm outline-none focus:bg-button-ghost-hover text-fg-secondary"
              onSelect={openRenameDialog}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-[2] me-2">
                <path d="M18.25 5.75C16.8693 4.36929 14.6307 4.36929 13.25 5.75L10.125 8.875L5.52404 13.476C4.86236 14.1376 4.45361 15.0104 4.36889 15.9423L4 20.0001L8.0578 19.6311C8.98967 19.5464 9.86234 19.1377 10.524 18.476L18.25 10.75C19.6307 9.36929 19.6307 7.13071 18.25 5.75V5.75Z" stroke="currentColor"></path>
                <path d="M12.5 7.5L16.5 11.5" stroke="currentColor"></path>
              </svg>
              Rename
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="relative flex select-none items-center cursor-pointer px-3 py-2 rounded-xl text-sm outline-none focus:bg-button-ghost-hover text-fg-secondary"
              onSelect={handlePin}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-[2] me-2">
                <path d="M4 20L8.5 15.5M14 20L4 10L5 9L9.06551 8.32242C10.2858 8.11904 11.3433 7.36248 11.9298 6.27324L13.2256 3.86676C13.8608 2.68717 15.4534 2.45342 16.4007 3.40075L20.5993 7.59926C21.5466 8.54658 21.3128 10.1392 20.1332 10.7744L17.7268 12.0702C16.6375 12.6567 15.881 13.7142 15.6776 14.9345L15 19L14 20Z" stroke="currentColor" strokeLinecap="square"></path>
              </svg>
              {chat.pinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="relative flex select-none items-center cursor-pointer px-3 py-2 rounded-xl text-sm outline-none focus:bg-button-ghost-hover text-fg-secondary"
              onSelect={() => onDelete(chat.id)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-[2] me-2">
                <path d="M2.99561 7H20.9956" stroke="currentColor"></path>
                <path d="M9.99561 11V17M13.9956 11V17" stroke="currentColor"></path>
                <path d="M8 6.5L8.68917 4.08792C8.87315 3.44397 9.46173 3 10.1315 3H13.8685C14.5383 3 15.1268 3.44397 15.3108 4.08792L16 6.5" stroke="currentColor"></path>
                <path d="M5 7L5.80098 18.2137C5.91312 19.7837 7.21944 21 8.79336 21H15.2066C16.7806 21 18.0869 19.7837 18.199 18.2137L19 7" stroke="currentColor"></path>
              </svg>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter new chat title..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRename();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false);
                setNewTitle('');
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleRename}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});
