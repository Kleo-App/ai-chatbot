'use client';

import Image from 'next/image';
import { useUser, useClerk } from '@clerk/nextjs';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from './toast';
import { LoaderIcon } from './icons';

export function SidebarUserNav() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-10">
        <div className="size-8 bg-zinc-500/30 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center justify-center h-10 cursor-pointer">
          <Image
            src={user.imageUrl || `https://avatar.vercel.sh/${user.emailAddresses[0]?.emailAddress}`}
            alt={user.emailAddresses[0]?.emailAddress ?? 'User Avatar'}
            width={32}
            height={32}
            className="rounded-full hover:opacity-80 transition-opacity"
            data-testid="user-nav-button"
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-testid="user-nav-menu"
        side="top"
        align="center"
        className="w-56"
      >
        <DropdownMenuItem asChild data-testid="user-nav-item-auth">
          <button
            type="button"
            className="w-full cursor-pointer"
            onClick={() => {
              signOut(() => router.push('/'));
            }}
          >
            Sign out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
