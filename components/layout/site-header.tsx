'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { BRAND } from '@/lib/media';
import { whatsappGeneralLink } from '@/lib/whatsapp';
import { useCart, cartCount } from '@/store/cart';
import { useHydrated } from '@/lib/use-hydrated';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { cn } from '@/lib/utils';
import { MobileMenu } from './mobile-menu';
import { CategoryRail } from './category-rail';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Shop All', href: '/shop' },
  { label: 'Gift Boxes', href: '/shop?filter=gifts' },
  { label: 'Offers', href: '/shop?sale=1' },
  { label: 'Our Story', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

function SearchBox({ className, autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop');
    onDone?.();
  };
  return (
    <form role="search" onSubmit={submit} className={cn('relative', className)}>
      <Search size={17} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft" aria-hidden />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Search Talbeenah, Ajwa dates, honey…"
        aria-label="Search products"
        className="h-11 w-full rounded-full border border-line bg-cream pr-4 pl-11 text-base text-ink placeholder:text-ink-soft/80 transition-colors focus:border-navy focus:bg-pearl focus:outline-none md:text-sm"
      />
    </form>
  );
}

export function SiteHeader() {
  const hydrated = useHydrated();
  const count = useCart((s) => cartCount(s.items));
  const openCart = useCart((s) => s.setOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Main bar and category row share one white surface, split by a hairline (Pepperfry / Urban Ladder style). */}
      <header className={cn('sticky top-0 z-50 bg-pearl text-ink transition-shadow', scrolled && 'shadow-[0_8px_24px_-14px_rgb(11_27_43/0.35)]')}>
        <div className="mx-auto flex h-16 max-w-site items-center gap-6 px-5 md:h-[76px] md:px-8 lg:px-12">
          <Link href="/" aria-label="Bold Mount home" className="shrink-0">
            <Image src={BRAND.logoHeader} alt="Bold Mount" width={235} height={128} unoptimized priority className="h-11 w-auto md:h-[52px]" />
          </Link>

          <nav aria-label="Shop" className="hidden items-center gap-7 lg:flex">
            {NAV.slice(1, 4).map((n) => (
              <Link key={n.label} href={n.href} className="text-[0.95rem] font-semibold whitespace-nowrap text-ink transition-colors hover:text-navy">
                {n.label}
              </Link>
            ))}
          </nav>

          <SearchBox className="hidden flex-1 md:block lg:max-w-xl xl:max-w-2xl" />

          <div className="ml-auto flex items-center gap-1 sm:gap-2.5">
            <a
              href={whatsappGeneralLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-11 items-center gap-2 rounded-full bg-whatsapp px-5 text-sm font-semibold whitespace-nowrap text-white transition hover:brightness-105 md:flex"
            >
              <WhatsAppGlyph size={19} /> Order on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              aria-label={searchOpen ? 'Close search' : 'Search'}
              aria-expanded={searchOpen}
              className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream md:hidden"
            >
              {searchOpen ? <X size={21} /> : <Search size={21} />}
            </button>
            <button
              type="button"
              onClick={() => openCart(true)}
              aria-label={`Open cart${hydrated && count ? `, ${count} items` : ''}`}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream"
            >
              <ShoppingBag size={22} />
              {hydrated && count > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-navy px-1 text-[0.7rem] font-bold text-on-night">
                  {count}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream lg:hidden"
            >
              <Menu size={23} />
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-line px-5 py-3 md:hidden">
            <SearchBox autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        )}

        {/* Category row — all nine sections, one tap away on every page. */}
        <CategoryRail />
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={NAV} />
    </>
  );
}
