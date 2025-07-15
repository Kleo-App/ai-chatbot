import type { ComponentProps } from 'react';
import { ChevronsRight, ChevronsLeft } from 'lucide-react';

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
          className={cn('h-12 w-12 p-0 rounded-full hover:bg-muted/50 flex items-center justify-center -ml-1.5', className)}
          onClick={toggleSidebar}
          data-testid="sidebar-toggle-button"
        >
          {open ? (
            <ChevronsLeft size={20} style={{ width: '20px', height: '20px' }} />
          ) : (
            <ChevronsRight size={20} style={{ width: '20px', height: '20px' }} />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Toggle Sidebar</TooltipContent>
    </Tooltip>
  );
}
