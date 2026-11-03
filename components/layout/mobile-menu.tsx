'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ChevronRight, LogOut, PackageSearch, Phone, X } from 'lucide-react';
import { BRAND } from '@/lib/media';
import { SERVE_SECTIONS, shopSections, type Section } from '@/lib/sections';
import type { Category } from '@/lib/types';
import { Avatar } from '@/components/auth/avatar';
import { signInHref, signOut, useAccount } from '@/components/auth/use-account';
import { GoogleMark } from '@/components/auth/google-button';
import { SITE } from '@/lib/site';
import { cn } from '@/lib/utils';

function Group({ title, items, onClose }: { title: string; items: Section[]; onClose: () => void }) {
  return (
    <div>
      <p className="eyebrow mb-2 text-gold">{title}</p>
      <ul className="divide-y divide-white/10">
        {items.map((s) => (
          <li key={s.slug}>
            <Link href={s.href} onClick={onClose} className="flex items-center gap-3 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-gold">
                <s.icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.95rem] text-on-night">{s.title}</span>
                <span className="block truncate text-xs text-on-night-soft">{s.tagline}</span>
              </span>
              <ChevronRight size={16} className="text-on-night-soft" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Sign in with Google, or the signed-in customer's name with "Your orders" / "Sign out". Hidden if Google isn't set up. */
function Account({ onClose }: { onClose: () => void }) {
  const { ready, user, google } = useAccount();
  const pathname = usePathname();
  if (!ready || (!user && !google)) return null;
  if (!user) {
    return (
      <a
        href={signInHref(pathname)}
        className="flex items-center justify-center gap-3 rounded-full bg-white py-3 text-sm font-semibold text-[#1f1f1f]"
      >
        <GoogleMark /> Sign in with Google
      </a>
    );
  }
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <Avatar user={user} size={40} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-on-night">{user.name || 'Your account'}</p>
          <p className="truncate text-xs text-on-night-soft">{user.email}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link href="/orders" onClick={onClose} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 text-sm text-on-night hover:border-gold hover:text-gold">
          <PackageSearch size={16} /> Your orders
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 text-sm text-on-night hover:border-gold hover:text-gold"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}

export function MobileMenu({
  open,
  onClose,
  links,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
  categories: Category[];
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={cn('fixed inset-0 z-[60] overflow-hidden lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={cn('absolute inset-0 bg-night/60 backdrop-blur-sm transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
      />
      <aside
        role="dialog"
        aria-label="Menu"
        className={cn(
          'absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-night text-on-night transition-transform duration-500 ease-expo',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <Image src={BRAND.logoIvorySm} alt="Bold Mount" width={294} height={160} unoptimized className="h-10 w-auto" />
          <button type="button" onClick={onClose} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10">
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
          <nav className="flex flex-wrap gap-2">
            {links.map((l) => (
              <Link key={l.label} href={l.href} onClick={onClose} className="rounded-full border border-white/15 px-4 py-2 text-sm text-on-night hover:border-gold hover:text-gold">
                {l.label}
              </Link>
            ))}
          </nav>
          <Account onClose={onClose} />
          <Group title="Shop" items={shopSections(categories)} onClose={onClose} />
          <Group title="Serve & Give" items={SERVE_SECTIONS} onClose={onClose} />
        </div>

        <div className="border-t border-white/10 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <a href={`tel:+${SITE.whatsapp}`} className="flex items-center justify-center gap-2 text-sm text-on-night-soft">
            <Phone size={15} /> {SITE.phoneDisplay}
          </a>
        </div>
      </aside>
    </div>
  );
}
