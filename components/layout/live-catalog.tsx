'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLive } from '@/lib/live';

/** When the shop changes in /admin, re-renders the open page with fresh data (keeps scroll, cart and chosen sizes). */
export function LiveCatalog() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useLive('catalog', () => {
    // Several saves in a row become one refresh.
    clearTimeout(timer.current);
    timer.current = setTimeout(() => router.refresh(), 300);
  });
  return null;
}
