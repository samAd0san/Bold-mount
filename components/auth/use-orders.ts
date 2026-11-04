'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useLive } from '@/lib/live';
import type { Order } from '@/lib/types';

type Snapshot = { orders: Order[] | null; failed: boolean; updatedAt: number };

// One shared copy for the whole tab, so the header strip and the orders pages agree and share a single fetch.
const SERVER: Snapshot = { orders: null, failed: false, updatedAt: 0 };
let snap: Snapshot = SERVER;
let inflight: Promise<void> | null = null;
let lastFetch = 0;
const listeners = new Set<() => void>();

function emit(patch: Partial<Snapshot>) {
  snap = { ...snap, ...patch };
  listeners.forEach((l) => l());
}

/** Loads /api/orders/mine (newest first); a call within `minGap` ms of the last one is skipped. */
export function refreshOrders(minGap = 0): Promise<void> {
  if (inflight) return inflight;
  if (Date.now() - lastFetch < minGap) return Promise.resolve();
  inflight = fetch('/api/orders/mine', { cache: 'no-store', credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((b: { orders: Order[] }) => emit({ orders: b.orders, failed: false, updatedAt: Date.now() }))
    .catch(() => emit({ failed: true }))
    .finally(() => {
      inflight = null;
      lastFetch = Date.now();
    });
  return inflight;
}

/** Puts an order the server just returned (after cancel / refund request) into the shared list. */
export function replaceOrder(next: Order) {
  if (snap.orders) emit({ orders: snap.orders.map((o) => (o.id === next.id ? next : o)) });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!snap.orders && !inflight) void refreshOrders();
  return () => {
    listeners.delete(cb);
  };
}

/**
 * The signed-in customer's orders, kept in step with the admin: refetched the moment the shop changes one (live),
 * when the tab comes back into view, and, with `watch`, on mount and every 30s as a fallback. `orders` is null until the first load.
 */
export function useOrders(watch = false): Snapshot {
  const state = useSyncExternalStore(subscribe, () => snap, () => SERVER);
  useLive('orders', () => void refreshOrders());
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState === 'visible') void refreshOrders(2000);
    };
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    const timer = watch ? setInterval(sync, 30_000) : undefined;
    if (watch) void refreshOrders();
    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
      clearInterval(timer);
    };
  }, [watch]);
  return state;
}
