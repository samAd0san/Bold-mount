'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Module-level so React strict-mode double effects and quick re-renders count once.
let last = { path: '', at: 0 };

/** Sends one page view per pathname change to /api/track (never for admin or API paths). */
export function Tracker() {
  const path = usePathname();
  useEffect(() => {
    if (!path || /^\/(admin|api)(\/|$)/.test(path)) return;
    const now = Date.now();
    if (path === last.path && now - last.at < 2000) return;
    last = { path, at: now };
    const body = JSON.stringify({ path });
    try {
      if (navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) return;
    } catch {
      // Fall through to fetch.
    }
    fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'same-origin' }).catch(() => {});
  }, [path]);
  return null;
}
