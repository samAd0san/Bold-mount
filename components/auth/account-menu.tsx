'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Popover from '@radix-ui/react-popover';
import { LogOut, PackageSearch, UserRound } from 'lucide-react';
import { Avatar } from '@/components/auth/avatar';
import { signInHref, signOut, useAccount } from '@/components/auth/use-account';
import { cn } from '@/lib/utils';

const ROUND = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-cream';

/** Header account control: a sign-in icon when signed out (hidden if Google isn't set up), an avatar menu when signed in. */
export function AccountMenu({ className }: { className?: string }) {
  const { ready, user, google } = useAccount();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Keeps the header from jumping while we find out who is signed in.
  if (!ready) return <span aria-hidden className={cn(ROUND, 'invisible', className)} />;

  if (!user) {
    if (!google) return null;
    return (
      <a href={signInHref(pathname)} aria-label="Sign in" title="Sign in with Google" className={cn(ROUND, 'text-ink', className)}>
        <UserRound size={22} />
      </a>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" aria-label={`Account: ${user.name || user.email}`} className={cn(ROUND, className)}>
          <Avatar user={user} size={32} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-[90] w-64 rounded-2xl bg-pearl p-2 shadow-2xl ring-1 ring-line outline-none"
        >
          <div className="flex items-center gap-3 px-2.5 pt-2 pb-3">
            <Avatar user={user} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name || 'Your account'}</p>
              <p className="truncate text-xs text-ink-soft">{user.email}</p>
            </div>
          </div>
          <div className="border-t border-line pt-1">
            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-sm font-medium text-ink hover:bg-cream"
            >
              <PackageSearch size={17} className="text-gold-ink" /> Your orders
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-sm font-medium text-ink hover:bg-cream"
            >
              <LogOut size={17} className="text-gold-ink" /> Sign out
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
