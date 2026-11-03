'use client';

import { useSyncExternalStore } from 'react';
import type { Customer } from '@/lib/types';
import { postJson } from '@/lib/client-api';

type Snapshot = { ready: boolean; user: Customer | null; google: boolean };

// One shared copy for the whole tab, so the header, checkout and Your orders agree without refetching.
const SERVER: Snapshot = { ready: false, user: null, google: false };
let snap: Snapshot = SERVER;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(patch: Partial<Snapshot>) {
  snap = { ...snap, ...patch };
  listeners.forEach((l) => l());
}

function refreshAccount(): Promise<void> {
  inflight ??= fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((b: { user?: Customer | null; google?: boolean }) => emit({ ready: true, user: b.user ?? null, google: !!b.google }))
    .catch(() => emit({ ready: true }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!snap.ready) void refreshAccount();
  return () => {
    listeners.delete(cb);
  };
}

/** `{ ready, user, google }` — user is null when signed out; `google` = Google sign-in is configured. */
export function useAccount(): Snapshot {
  return useSyncExternalStore(subscribe, () => snap, () => SERVER);
}

export async function signOut() {
  await postJson('/api/auth/signout');
  emit({ user: null });
}

/** `/api/auth/google?next=<path>` — a full-page navigation (OAuth needs one), so use a plain <a>. */
export const signInHref = (next: string) => `/api/auth/google?next=${encodeURIComponent(next || '/')}`;

export const initials = (name: string, email: string) => {
  const parts = (name || email.split('@')[0]).trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
};
