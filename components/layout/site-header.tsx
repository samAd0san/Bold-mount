'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Phone, ShoppingBag } from 'lucide-react';
import { BRAND } from '@/lib/media';
import { SECTIONS } from '@/lib/sections';
import { SITE } from '@/lib/site';
import { useCart, cartCount } from '@/store/cart';
import { useHydrated } from '@/lib/use-hydrated';
import { cn } from '@/lib/utils';
import { MobileMenu } from './mobile-menu';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Shop All', href: '/shop' },
  { label: 'Gift Boxes', href: '/shop?filter=gifts' },
  { label: 'Our Story', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const count = useCart((s) => cartCount(s.items));
  const openCart = useCart((s) => s.setOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0]));

  return (
    <>
      <header className={cn('sticky top-0 z-50 bg-navy text-on-night transition-shadow', scrolled && 'shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)]')}>
        {/* Main bar */}
        <div className="mx-auto flex h-16 max-w-site items-center gap-6 px-5 md:h-[72px] md:px-8 lg:px-12">
          <Link href="/" aria-label="Bold Mount home" className="shrink-0">
            <Image src={BRAND.logoIvory} alt="Bold Mount" width={120} height={66} priority className="h-11 w-auto md:h-12" />
          </Link>

          <nav className="ml-4 hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className={cn(
                  'relative py-2 text-[0.95rem] transition-colors hover:text-gold',
                  isActive(n.href) && n.href !== '/shop?filter=gifts' ? 'text-gold' : 'text-on-night',
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <a
              href={`tel:+${SITE.whatsapp}`}
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-on-night transition-colors hover:text-gold xl:flex"
            >
              <Phone size={17} /> {SITE.phoneDisplay}
            </a>
            <button
              type="button"
              onClick={() => openCart(true)}
              aria-label={`Open cart${hydrated && count ? `, ${count} items` : ''}`}
              className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            >
              <ShoppingBag size={21} />
              {hydrated && count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.7rem] font-bold text-night">
                  {count}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 lg:hidden"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Category rail — every section one tap away, on every page. */}
        <div className="bg-azure">
          <nav className="no-scrollbar mx-auto flex max-w-site gap-2 overflow-x-auto px-5 py-2 md:px-8 lg:justify-between lg:gap-1 lg:px-12">
            {SECTIONS.map((s) => {
              const active = pathname.startsWith(s.href);
              return (
                <Link
                  key={s.slug}
                  href={s.href}
                  className={cn(
                    'flex shrink-0 items-center rounded-full border px-4 py-1.5 text-[0.95rem] font-medium whitespace-nowrap text-white transition-colors lg:border-transparent lg:px-3.5 lg:text-base',
                    active ? 'border-white bg-white text-navy' : 'border-white/30 hover:bg-white/15',
                  )}
                >
                  {s.short}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={NAV} />
    </>
  );
}
