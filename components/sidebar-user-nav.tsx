'use client';

import Image from 'next/image';
import type { User } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from './toast';
import { LoaderIcon } from './icons';
import { guestRegex } from '@/lib/constants';

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data, status } = useSession();

  const isGuest = guestRegex.test(data?.user?.email ?? '');

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-10">
        <div className="size-8 bg-zinc-500/30 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center justify-center h-10 cursor-pointer">
          <Image
            src={`https://avatar.vercel.sh/${user.email}`}
            alt={user.email ?? 'User Avatar'}
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
              if (isGuest) {
                router.push('/login');
              } else {
                signOut({
                  redirectTo: '/',
                });
              }
            }}
          >
            {isGuest ? 'Login to your account' : 'Sign out'}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
