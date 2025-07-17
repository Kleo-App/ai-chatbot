import type { ComponentProps } from 'react';
import { ChevronsRight } from 'lucide-react';

import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function SidebarToggle({
  className,
}: ComponentProps<typeof Button>) {
  const { open, toggleSidebar } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-sidebar="trigger"
          variant="ghost"
          size="icon"
          className={cn('inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium leading-[normal] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-100 [&_svg]:shrink-0 select-none text-muted-foreground hover:text-foreground hover:bg-muted disabled:hover:text-muted-foreground disabled:hover:bg-transparent [&_svg]:hover:text-foreground h-10 w-10 rounded-full', className)}
          onClick={toggleSidebar}
          data-testid="sidebar-toggle-button"
        >
          <ChevronsRight 
            size={18} 
            className={cn('transition-transform duration-200', open && 'rotate-180')}
          />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Toggle Sidebar</TooltipContent>
    </Tooltip>
  );
}
