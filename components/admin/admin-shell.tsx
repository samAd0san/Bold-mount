'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Footprints,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  Tags,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAdmin } from '@/components/admin/admin-gate';
import { adminFetch, SignedOut } from '@/components/admin/api';
import { BRAND } from '@/lib/media';
import { cn } from '@/lib/utils';
import { useLive } from '@/lib/live';

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/visitors', label: 'Visitors', icon: Footprints },
  { href: '/admin/orders', label: 'Orders', icon: ReceiptText },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/forms', label: 'Forms', icon: Inbox },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const COLLAPSED_KEY = 'bm-admin-sidebar-collapsed';

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

const ROW = 'relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition';
const IDLE = 'text-on-night-soft hover:bg-white/10 hover:text-on-night';

/** Left sidebar: icons + names, or icons only when collapsed (desktop). On phones it slides in from the menu button. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { logout, unread, setUnread, attention, refreshAttention } = useAdmin();
  const [leaving, setLeaving] = React.useState(false);
  // The shell only renders in the browser (after the PIN check), so reading storage here is safe.
  const [collapsed, setCollapsed] = React.useState(readCollapsed);
  const [openPath, setOpenPath] = React.useState<string | null>(null);
  const open = openPath === path; // the phone menu closes itself on navigation

  // Badges follow new orders and messages live.
  useLive('admin', (name) => {
    if (name === 'order' || name === 'resync') refreshAttention();
    if ((name === 'form' || name === 'resync') && !path.startsWith('/admin/forms')) {
      adminFetch<{ unread: number }>('/api/admin/forms').then((d) => setUnread(d.unread)).catch(() => {});
    }
  });

  // The Forms page keeps its count fresh itself; everywhere else we ask once per page. Same for orders needing attention.
  React.useEffect(() => {
    refreshAttention();
    if (path.startsWith('/admin/forms')) return;
    adminFetch<{ unread: number }>('/api/admin/forms')
      .then((d) => setUnread(d.unread))
      .catch((e) => { if (!(e instanceof SignedOut)) setUnread(0); });
  }, [path, setUnread, refreshAttention]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenPath(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSED_KEY, c ? '0' : '1'); } catch {}
      return !c;
    });
  };

  // Collapsed only applies from md up; the phone menu always shows names.
  const label = cn('truncate', collapsed && 'md:sr-only');

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-navy px-2 text-on-night md:hidden">
        <button type="button" onClick={() => setOpenPath(path)} aria-label="Open menu" aria-expanded={open} className="grid size-11 place-items-center rounded-full hover:bg-white/10">
          <Menu className="size-6" />
        </button>
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image src={BRAND.logoIvorySm} alt="Bold Mount" width={294} height={160} unoptimized priority className="h-8 w-auto" />
          <span className="rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-night uppercase">Admin</span>
        </Link>
      </header>

      <div
        onClick={() => setOpenPath(null)}
        aria-hidden
        className={cn('fixed inset-0 z-40 bg-night/60 transition-opacity md:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy text-on-night transition-[transform,width,visibility] duration-300',
          open ? 'translate-x-0' : 'max-md:invisible max-md:-translate-x-full',
          collapsed ? 'md:w-[4.5rem]' : 'md:w-60',
        )}
      >
        <div className={cn('flex h-16 shrink-0 items-center gap-2 px-4', collapsed && 'md:gap-0 md:px-2')}>
          <Link href="/admin" aria-label="Admin home" className="flex min-w-0 items-center gap-2.5">
            <Image src={BRAND.logoIvorySm} alt="Bold Mount" width={294} height={160} unoptimized className={cn('h-9 w-auto', collapsed && 'md:h-auto md:w-9')} />
            <span className={cn('rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-bold tracking-wider text-night uppercase', collapsed && 'md:hidden')}>Admin</span>
          </Link>
          <button type="button" onClick={() => setOpenPath(null)} aria-label="Close menu" className="ml-auto grid size-10 place-items-center rounded-full hover:bg-white/10 md:hidden">
            <X className="size-5" />
          </button>
          {/* Desktop only: collapse/expand arrow beside the logo. */}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'ml-auto hidden place-items-center rounded-lg text-on-night-soft transition hover:bg-white/10 hover:text-on-night md:grid',
              collapsed ? 'h-8 w-5' : 'size-8',
            )}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-5" />}
          </button>
        </div>

        <nav aria-label="Admin sections" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {TABS.map(({ href, label: name, icon: Icon }) => {
            const active = href === '/admin' ? path === '/admin' : path.startsWith(href);
            const count = name === 'Forms' ? unread : name === 'Orders' ? attention : 0;
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? name : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn(ROW, active ? 'bg-gold text-night' : IDLE)}
              >
                <Icon className="size-5 shrink-0" />
                <span className={label}>{name}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'ml-auto grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-5 font-bold',
                      active ? 'bg-night text-gold' : 'bg-gold text-night',
                      collapsed && 'md:absolute md:top-0.5 md:right-0.5 md:min-w-4 md:px-1 md:text-[10px] md:leading-4',
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/10 px-3 py-3">
          <Link href="/" target="_blank" title={collapsed ? 'View site' : undefined} className={cn(ROW, IDLE)}>
            <ExternalLink className="size-5 shrink-0" />
            <span className={label}>View site</span>
          </Link>
          <button
            type="button"
            disabled={leaving}
            onClick={() => { setLeaving(true); void logout(); }}
            title={collapsed ? 'Log out' : undefined}
            className={cn(ROW, IDLE, 'disabled:opacity-50')}
          >
            <LogOut className="size-5 shrink-0" />
            <span className={label}>Log out</span>
          </button>
        </div>
      </aside>

      <div className={cn('transition-[padding] duration-300', collapsed ? 'md:pl-[4.5rem]' : 'md:pl-60')}>
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8">{children}</main>
      </div>
    </div>
  );
}
