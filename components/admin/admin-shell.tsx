'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, LogOut } from 'lucide-react';
import { useAdmin } from '@/components/admin/admin-gate';
import { adminFetch, SignedOut } from '@/components/admin/api';
import { BRAND } from '@/lib/media';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/forms', label: 'Forms' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { logout, unread, setUnread } = useAdmin();
  const [leaving, setLeaving] = React.useState(false);

  // The Forms page keeps the count fresh itself; everywhere else we ask once per page.
  React.useEffect(() => {
    if (path.startsWith('/admin/forms')) return;
    adminFetch<{ unread: number }>('/api/admin/forms')
      .then((d) => setUnread(d.unread))
      .catch((e) => { if (!(e instanceof SignedOut)) setUnread(0); });
  }, [path, setUnread]);

  // On phones the tab row scrolls sideways; keep the current tab in view.
  React.useEffect(() => {
    document.querySelector('nav[aria-label="Admin sections"] [aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [path]);

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-40 bg-navy text-on-night">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="Admin home">
            <Image src={BRAND.logoIvorySm} alt="Bold Mount" width={294} height={160} unoptimized priority className="h-9 w-auto" />
            <span className="rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-night uppercase">Admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <Link href="/" target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-on-night-soft transition hover:bg-white/10 hover:text-on-night">
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">View site</span>
              <span className="sm:hidden">Site</span>
            </Link>
            <button
              type="button"
              disabled={leaving}
              onClick={() => { setLeaving(true); void logout(); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-on-night-soft transition hover:bg-white/10 hover:text-on-night disabled:opacity-50"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </div>
        <nav aria-label="Admin sections" className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5">
          {TABS.map(({ href, label }) => {
            const active = href === '/admin' ? path === '/admin' : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition',
                  active ? 'bg-gold text-night' : 'text-on-night-soft hover:bg-white/10 hover:text-on-night',
                )}
              >
                {label}
                {label === 'Forms' && unread > 0 && (
                  <span className={cn('grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-5 font-bold', active ? 'bg-night text-gold' : 'bg-gold text-night')}>{unread}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8">{children}</main>
    </div>
  );
}
