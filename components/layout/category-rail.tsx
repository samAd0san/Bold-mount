'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SECTIONS } from '@/lib/sections';
import { cn } from '@/lib/utils';

/** All nine sections in one row; < > arrows over a soft fade appear only while there's more to scroll that way. */
export function CategoryRail() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  // Keep the current section visible when a page opens with it off to the side.
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);

  const nudge = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.6, behavior: 'smooth' });

  return (
    <div className="relative border-y border-line">
      <nav
        ref={ref}
        aria-label="Categories"
        className="no-scrollbar mx-auto flex max-w-site gap-7 overflow-x-auto scroll-px-10 px-5 md:px-8 lg:justify-center lg:gap-10 lg:px-12"
      >
        {SECTIONS.map((s) => {
          const active = pathname.startsWith(s.href);
          return (
            <Link
              key={s.slug}
              href={s.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative shrink-0 py-3 text-[0.95rem] font-medium whitespace-nowrap transition-colors lg:text-base',
                active ? 'text-navy' : 'text-ink hover:text-navy',
              )}
            >
              {s.short}
              <span
                className={cn(
                  'absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-gold transition-transform duration-300 ease-expo',
                  active ? 'scale-x-100' : 'scale-x-0',
                )}
              />
            </Link>
          );
        })}
      </nav>

      {([-1, 1] as const).map((dir) => {
        const show = dir < 0 ? edges.left : edges.right;
        return (
          <button
            key={dir}
            type="button"
            tabIndex={-1}
            aria-hidden={!show}
            aria-label={dir < 0 ? 'Scroll categories left' : 'Scroll categories right'}
            onClick={() => nudge(dir)}
            className={cn(
              'absolute inset-y-0 flex w-12 items-center text-ink transition-opacity duration-200',
              dir < 0
                ? 'left-0 justify-start bg-linear-to-r from-pearl via-pearl/90 to-transparent pl-2'
                : 'right-0 justify-end bg-linear-to-l from-pearl via-pearl/90 to-transparent pr-2',
              show ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            {dir < 0 ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        );
      })}
    </div>
  );
}
