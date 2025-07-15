'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';
import { Search, MessageSquare, History, ChevronRight, BookOpen, FileText } from 'lucide-react';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
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
import Link from 'next/link';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile, open } = useSidebar();
  const [historyExpanded, setHistoryExpanded] = useState(true);

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0 bg-sidebar border-r border-border">
      <SidebarHeader className="h-12 flex flex-row items-center shrink-0 group-data-[collapsible=icon]:pt-2 relative">
        <Link
          href="/"
          onClick={() => {
            setOpenMobile(false);
          }}
          className="flex items-center justify-center hover:bg-muted/50 rounded-xl cursor-pointer h-10 w-10 p-1 transition-colors flex-shrink-0 -ml-0.5"
        >
          <Image
            src="/images/kleo_square.svg"
            alt="Kleo"
            width={28}
            height={28}
            className="h-7 w-7 opacity-90 hover:opacity-100 flex-shrink-0"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex min-h-0 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden px-1.5">
        <SidebarGroup className="px-0 py-1">
          <SidebarMenuButton
            asChild
            className="flex-1 ps-[10px] pe-[10px] rounded-full border border-border bg-muted/50 justify-start text-muted-foreground h-[2.5rem] mx-[.125rem] hover:bg-muted/70 hover:text-foreground transition-colors"
          >
            <button aria-label="Search">
              <Search className="h-4 w-4" />
              <span className="space-x-1 align-baseline group-data-[collapsible=icon]:hidden">
                <span>Search</span>
                <span className="text-xs text-muted-foreground">⌘K</span>
              </span>
            </button>
          </SidebarMenuButton>
        </SidebarGroup>

        <SidebarGroup className="px-0 py-[2px]">
          <SidebarMenu>
            <SidebarMenuItem className="mx-1">
              <SidebarMenuButton
                asChild
                className="w-full flex flex-row gap-1 p-[0.375rem] text-sm text-muted-foreground bg-muted/30 hover:bg-muted/50 hover:text-foreground transition-colors rounded-xl h-[36px] border-transparent"
              >
                <Link href="/" onClick={() => setOpenMobile(false)}>
                  <div className="size-6 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="group-data-[collapsible=icon]:hidden">Chat</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="px-0 py-[2px]">
          <SidebarMenu>
            <SidebarMenuItem className="mx-1">
              <SidebarMenuButton
                asChild
                className="w-full flex flex-row gap-1 p-[0.375rem] text-sm text-muted-foreground bg-muted/30 hover:bg-muted/50 hover:text-foreground transition-colors rounded-xl h-[36px] border-transparent"
              >
                <Link href="/posts" onClick={() => setOpenMobile(false)}>
                  <div className="size-6 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="group-data-[collapsible=icon]:hidden">Posts</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="px-0 py-[2px]">
          <SidebarMenu>
            <SidebarMenuItem className="mx-1">
              <SidebarMenuButton
                asChild
                className="w-full flex flex-row gap-1 p-[0.375rem] text-sm text-muted-foreground bg-muted/30 hover:bg-muted/50 hover:text-foreground transition-colors rounded-xl h-[36px] border-transparent"
              >
                <Link href="/knowledgebase" onClick={() => setOpenMobile(false)}>
                  <div className="size-6 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="group-data-[collapsible=icon]:hidden">Knowledgebase</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="px-0 py-[2px]">
          <SidebarMenu>
            <SidebarMenuItem className="mx-1">
              <div className="w-full flex flex-row justify-start gap-1 bg-background text-muted-foreground text-sm rounded-xl p-[0.375rem] h-[36px] border-transparent">
                <div className="size-6 flex items-center justify-center shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => setHistoryExpanded(!historyExpanded)}
                    aria-label="Toggle History"
                  >
                    <History className="h-4 w-4 group-hover:hidden" />
                    <ChevronRight className={`h-3 w-3 hidden group-hover:block transition-transform duration-100 ${historyExpanded ? 'rotate-90' : ''}`} />
                  </Button>
                </div>
                <span className="group-data-[collapsible=icon]:hidden">History</span>
              </div>
              {historyExpanded && (
                <div className="mt-1 mx-1">
                  <div className="cursor-pointer ms-[8px] me-[2px] py-1">
                    <div className="border-l border-border h-full ms-[10px] me-[4px]"></div>
                  </div>
                  <div className="flex flex-col gap-1 w-full min-w-0">
                    <SidebarHistory user={user} />
                  </div>
                </div>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2 mt-auto relative shrink-0 px-2 pb-3">
        {user && (
          <div className={`transition-all duration-200 ease-linear ${open ? 'flex items-start justify-between w-full' : 'flex flex-col gap-2'}`}>
            <div className={`transform transition-all duration-200 ease-linear ${open ? 'translate-y-1' : 'translate-y-0'} ${open ? 'self-start' : ''}`}>
              <SidebarUserNav user={user} />
            </div>
            <div className={`transform transition-all duration-200 ease-linear ${open ? 'translate-x-1' : 'translate-x-0'} ${open ? 'self-start' : ''}`}>
              <SidebarToggle />
            </div>
          </div>
        )}
        {!user && (
          <div className="">
            <SidebarToggle />
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
