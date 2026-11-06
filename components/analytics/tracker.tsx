'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { sendTrack } from '@/components/analytics/send';
import { useCart } from '@/store/cart';
import { useConsent } from '@/store/consent';

const SEEN_KEY = 'bm_seen';
// Coming back after this long counts as a new visit, so we note where they came from again.
const NEW_VISIT_MS = 30 * 60 * 1000;

// Module-level so React strict-mode double effects and quick re-renders count once.
let last = { key: '', at: 0 };
// The page this load opened on: a visit that starts there keeps its referrer even if OK is pressed a moment later.
let entry = '';
let seenInMemory = 0;

function lastSeen() {
  try {
    return Number(localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return seenInMemory;
  }
}

function markSeen(t: number) {
  seenInMemory = t;
  try {
    localStorage.setItem(SEEN_KEY, String(t));
  } catch {
    // Private mode: the in-memory time still works for this page load.
  }
}

function forgetSeen() {
  seenInMemory = 0;
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    // Nothing stored.
  }
}

// A reload keeps the old referrer, but nobody just arrived.
const reloaded = () => (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'reload';

/** The other website that sent the visitor here (just its name), or undefined. */
function referringSite() {
  try {
    const u = new URL(document.referrer);
    return /^https?:$/.test(u.protocol) && u.hostname !== location.hostname ? u.hostname : undefined;
  } catch {
    return undefined;
  }
}

function Beacon() {
  const path = usePathname();
  const q = useSearchParams().get('q');
  // Not read below: pressing OK re-runs the effect so the page already on screen is counted.
  const choice = useConsent((s) => s.choice);
  useEffect(() => {
    if (!path || /^\/(admin|api)(\/|$)/.test(path)) return;
    if (choice === 'no') forgetSeen();
    const search = path === '/shop' ? q?.trim().slice(0, 60) || undefined : undefined;
    const key = `${path}?${search ?? ''}`;
    entry ||= key;
    const now = Date.now();
    if (key === last.key && now - last.at < 2000) return;

    // Where they came from is only known on the page the browser first loaded; later pages are in-site clicks.
    const fresh = key === entry && !reloaded();
    const params = new URLSearchParams(location.search);
    const host = fresh ? referringSite() : undefined;
    const utm = fresh ? params.get('utm_source') || undefined : undefined;
    const startsVisit = now - lastSeen() > NEW_VISIT_MS || !!host || !!utm;

    const sent = sendTrack({
      path,
      ...(search ? { q: search } : {}),
      ...(startsVisit ? { land: { host, utm, medium: fresh ? params.get('utm_medium') || undefined : undefined, campaign: fresh ? params.get('utm_campaign') || undefined : undefined } } : {}),
      // The cart page is where the checkout form lives, so opening it with something in the cart means they reached checkout.
      ...((path === '/cart' || path === '/checkout') && useCart.getState().items.length ? { checkout: true } : {}),
    });
    // Nothing is remembered (not even the time of this page) until the visitor has said OK.
    if (!sent) return;
    last = { key, at: now };
    markSeen(now);
  }, [path, q, choice]);
  return null;
}

/** Tells /api/track about each page the visitor opens once they have pressed OK on the cookie notice (never admin or API paths). */
export function Tracker() {
  return (
    <Suspense fallback={null}>
      <Beacon />
    </Suspense>
  );
}
