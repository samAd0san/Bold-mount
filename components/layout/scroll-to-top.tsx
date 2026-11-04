'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Back/forward should land where the visitor was, so remember when the browser itself changed the page.
let fromHistory = false;
if (typeof window !== 'undefined') window.addEventListener('popstate', () => { fromHistory = true; });

/** Opens every new page at the very top: Next.js skips its scroll when the page's top edge counts as "on screen", but ours hides under the sticky header. */
export function ScrollToTop() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (fromHistory) {
      fromHistory = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [path]);
  return null;
}
