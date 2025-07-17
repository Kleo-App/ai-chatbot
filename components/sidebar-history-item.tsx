import type { Chat } from '@/lib/db/schema';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  MoreHorizontalIcon,
  TrashIcon,
} from './icons';
import { memo, useState, useEffect } from 'react';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

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

  return (
    <div style={{ opacity: 1 }}>
      <Link 
        href={`/chat/${chat.id}`} 
        onClick={() => setOpenMobile(false)}
        className="peer/menu-button flex items-center gap-2 overflow-hidden rounded-xl text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-1 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 [&>span:last-child]:truncate [&>svg]:shrink-0 hover:text-primary text-sm h-[36px] border-transparent hover:bg-muted/50 data-[state=open]:hover:bg-muted/50 active:bg-muted data-[active=true]:bg-muted aria-expanded:bg-muted/50 group/conversation-item pl-3 pr-1.5 py-1 text-sm w-full flex flex-row gap-2 text-muted-foreground"
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
              className={`items-center justify-center gap-2 whitespace-nowrap text-sm font-medium leading-[normal] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-100 [&_svg]:shrink-0 select-none hover:bg-muted/50 disabled:hover:bg-transparent border border-transparent h-6 w-6 rounded-full text-muted-foreground ${buttonVisible ? 'flex' : 'hidden group-hover/conversation-item:flex'}`}
              type="button"
              aria-haspopup="menu"
              aria-expanded="false"
              data-state="closed"
            >
              <MoreHorizontalIcon size={14} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
              onSelect={() => onDelete(chat.id)}
            >
              <TrashIcon />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Link>
    </div>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});
