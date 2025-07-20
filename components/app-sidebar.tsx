'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { Search, MessageSquare, History, ChevronRight, BookOpen, FileText } from 'lucide-react';
import Link from 'next/link';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { CommandMenu } from '@/components/command-menu';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  useSidebar,
  SidebarGroup,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';
import { useCommandMenu } from '@/hooks/use-command-menu';
import { useArtifact, initialArtifactData } from '@/hooks/use-artifact';

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile, open } = useSidebar();
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [historyHovered, setHistoryHovered] = useState(false);
  const { user } = useUser();
  const commandMenu = useCommandMenu();
  const { setArtifact } = useArtifact();

  // Check if we're on a chat-related page (homepage or chat pages)
  const isChatActive = pathname === '/' || pathname.startsWith('/chat');

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0 bg-sidebar border-r border-border">
      <SidebarHeader className="h-12 flex flex-row items-center shrink-0 group-data-[collapsible=icon]:pt-2 relative mb-4 z-10 pointer-events-none [&>*]:pointer-events-auto">
        <Link
          href="/"
          onClick={() => {
            setOpenMobile(false);
            // Clear any visible artifacts to ensure clean home state
            setArtifact({ ...initialArtifactData, status: 'idle' });
          }}
          className="flex items-center justify-center hover:bg-muted/50 rounded-xl cursor-pointer size-10 p-1 transition-colors shrink-0 -ml-0.5"
        >
          <Image
            src="/images/kleo_square.svg"
            alt="Kleo"
            width={28}
            height={28}
            className="size-7 opacity-90 hover:opacity-100 shrink-0"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex min-h-0 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden relative z-10 pointer-events-none [&>*]:pointer-events-auto">
        <SidebarGroup className="px-1.5 py-0">
          <SidebarMenu className="space-y-0.5">
            <SidebarMenuItem className="mx-1 whitespace-nowrap font-semibold">
              <SidebarMenuButton
                asChild
                className="w-full flex flex-row gap-2 p-1.5 text-sm transition-colors rounded-full h-[36px] border border-border bg-muted/50 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              >
                <button aria-label="Search" onClick={commandMenu.toggle}>
                  <div className="size-6 group-data-[collapsible=icon]:size-4 flex items-center justify-center shrink-0">
                    <Search className="size-4" />
                  </div>
                  <span className="group-data-[collapsible=icon]:hidden space-x-1 align-baseline">
                    <span>Search</span>
                    <span className="text-xs text-muted-foreground">⌘K</span>
                  </span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="px-1.5 py-0">
          <SidebarMenu className="space-y-0.5">
            <SidebarMenuItem className="mx-1 whitespace-nowrap font-semibold">
              <SidebarMenuButton
                asChild
                className={`w-full flex flex-row gap-2 p-1.5 text-sm transition-colors rounded-xl h-[36px] border-transparent ${
                  isChatActive 
                    ? 'bg-muted text-foreground' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Link href="/" onClick={() => setOpenMobile(false)}>
                  <div className="size-6 group-data-[collapsible=icon]:size-4 flex items-center justify-center shrink-0">
                    <MessageSquare className="size-4" />
                  </div>
                  <span className="group-data-[collapsible=icon]:hidden">Chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="mx-1 whitespace-nowrap font-semibold">
              <SidebarMenuButton
                asChild
                className={`w-full flex flex-row gap-2 p-1.5 text-sm transition-colors rounded-xl h-[36px] border-transparent ${
                  pathname.startsWith('/posts')
                    ? 'bg-muted text-foreground' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Link href="/posts" onClick={() => setOpenMobile(false)}>
                  <div className="size-6 group-data-[collapsible=icon]:size-4 flex items-center justify-center shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <span className="group-data-[collapsible=icon]:hidden">Posts</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="mx-1 whitespace-nowrap font-semibold">
              <SidebarMenuButton
                asChild
                className={`w-full flex flex-row gap-2 p-1.5 text-sm transition-colors rounded-xl h-[36px] border-transparent ${
                  pathname.startsWith('/knowledgebase')
                    ? 'bg-muted text-foreground' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Link href="/knowledgebase" onClick={() => setOpenMobile(false)}>
                  <div className="size-6 group-data-[collapsible=icon]:size-4 flex items-center justify-center shrink-0">
                    <BookOpen className="size-4" />
                  </div>
                  <span className="group-data-[collapsible=icon]:hidden">Knowledge</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem className="group/menu-item whitespace-nowrap font-semibold mx-1 relative">
              <div 
                role="button" 
                tabIndex={0} 
                aria-label="History"
                className="peer/menu-button flex items-center gap-2 overflow-hidden rounded-xl text-left outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-1 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 [&>span:last-child]:truncate [&>svg]:shrink-0 text-sm h-[36px] border-transparent data-[state=open]:hover:bg-muted/50 data-[active=true]:bg-muted aria-expanded:bg-muted/50 hover:bg-transparent active:bg-transparent cursor-default hover:text-muted-foreground w-full flex flex-row justify-start bg-background text-muted-foreground p-1.5"
                data-sidebar="menu-button"
                data-active="false"
                onClick={() => setHistoryExpanded(!historyExpanded)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setHistoryExpanded(!historyExpanded);
                  }
                }}
              >
                <div data-sidebar="icon" className="size-6 group-data-[collapsible=icon]:size-4 flex items-center justify-center shrink-0 group-data-[collapsible=icon]:ml-0.5">
                  <button
                    className="inline-flex items-center justify-center gap-2 group-data-[collapsible=icon]:gap-0 whitespace-nowrap text-sm font-medium leading-[normal] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-100 [&_svg]:shrink-0 select-none text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:hover:text-muted-foreground disabled:hover:bg-transparent [&_svg]:hover:text-foreground size-6 group-data-[collapsible=icon]:size-4 rounded-full"
                    type="button"
                    aria-label="Toggle Menu"
                    onMouseEnter={() => setHistoryHovered(true)}
                    onMouseLeave={() => setHistoryHovered(false)}
                  >
                    <History className={`size-4 stroke-[2] ${open && historyHovered ? 'group-hover/menu-item:hidden' : ''}`} />
                    <ChevronRight className={`size-3 stroke-[2] ${open && historyHovered ? 'group-hover/menu-item:block' : 'hidden'} transition-transform duration-100 ${historyExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
                <span className="group-data-[collapsible=icon]:hidden" style={{ opacity: 1 }}>History</span>
              </div>
              <div style={{ overflow: 'hidden', height: historyExpanded ? 'auto' : '0', opacity: historyExpanded ? 1 : 0 }}>
                <div className="flex flex-row mt-1 mx-1">
                  <div className="cursor-pointer ms-[8px] me-[2px] py-1">
                    <div className="border-l border-border h-full ms-[10px] me-[4px]"></div>
                  </div>
                  <div className="flex flex-col gap-1 w-full min-w-0">
                    <SidebarHistory commandMenu={commandMenu} />
                  </div>
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className={`flex flex-col gap-2 mt-auto relative shrink-0 z-10 ${open ? 'h-[56px]' : 'h-[96px]'}`}>
        {user && (
          <>
            <div 
              className="absolute bottom-3 start-[.5rem]" 
              style={{ 
                transform: open ? 'translateY(0px)' : 'translateY(-44px)', 
                transitionProperty: 'transform', 
                transitionDuration: '300ms' 
              }}
            >
              <SidebarUserNav />
            </div>
            <div className={open ? "cursor-w-resize grow" : "cursor-e-resize grow"}>
              <SidebarToggle className="absolute end-2 bottom-3" />
            </div>
          </>
        )}
      </SidebarFooter>
      <SidebarRail className="bg-transparent hover:bg-transparent w-[calc(var(--sidebar-width)+12px)] group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+12px)] group-data-[state=collapsed]:w-[calc(var(--sidebar-width-icon)+12px)] left-0 right-auto translate-x-0 group-data-[collapsible=icon]:left-0 group-data-[collapsible=icon]:right-auto group-data-[collapsible=icon]:translate-x-0 group-data-[state=collapsed]:left-0 group-data-[state=collapsed]:right-auto group-data-[state=collapsed]:translate-x-0 after:hidden z-0 pointer-events-auto" />
      <CommandMenu 
        open={commandMenu.open} 
        onOpenChange={commandMenu.setOpen} 
      />
    </Sidebar>
  );
}
