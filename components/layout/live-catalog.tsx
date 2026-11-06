'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLive } from '@/lib/live';

// A phone can freeze a background tab without dropping the live connection, so missed changes are fetched on return.
const AWAY_MS = 60_000;

/** When the shop changes in /admin, re-renders the open page with fresh data (keeps scroll, cart and chosen sizes). */
export function LiveCatalog() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const refresh = () => {
    // Several saves in a row become one refresh.
    clearTimeout(timer.current);
    timer.current = setTimeout(() => router.refresh(), 300);
  };
  useLive('catalog', refresh);

  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > AWAY_MS) router.refresh();
    };
    // Back/forward from another site restores the old page from memory.
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) router.refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onShow);
    };
  }, [router]);
  return null;
}
