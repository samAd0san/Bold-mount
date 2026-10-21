'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// On phones the row scrolls sideways; this keeps the chosen tile (e.g. Gift Boxes) in view after a click or reload.
export function ShopTileScroller({ activeKey, children }: { activeKey: string; children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const row = ref.current;
    const on = row?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!row || !on) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollTo({ left: on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2, behavior: calm ? 'auto' : 'smooth' });
  }, [activeKey]);

  return (
    <ul
      ref={ref}
      className="no-scrollbar relative -mx-5 mt-4 flex snap-x snap-proximity gap-3 overflow-x-auto scroll-px-5 px-5 py-2 md:mx-0 md:gap-8 md:overflow-visible md:px-0"
    >
      {children}
    </ul>
  );
}
