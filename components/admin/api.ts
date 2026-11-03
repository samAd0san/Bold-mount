'use client';

import * as React from 'react';

/** Fired when any admin call gets a 401, so the gate can show the PIN screen again. */
export const SIGNED_OUT = 'bm-admin-signed-out';

export class SignedOut extends Error {}
export type ApiError = Error & { status?: number; body?: Record<string, unknown> };

export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && !url.endsWith('/login')) {
    window.dispatchEvent(new Event(SIGNED_OUT));
    throw new SignedOut();
  }
  if (!res.ok) throw Object.assign(new Error(body.error || 'Something went wrong. Please try again.'), { status: res.status, body });
  return body as T;
}

/** Loads a GET url (pass null to skip). Keeps the old data on screen while a new url loads. */
export function useFetch<T>(url: string | null) {
  const [state, setState] = React.useState<{ url: string; data: T } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!url) return;
    let live = true;
    adminFetch<T>(url)
      .then((data) => { if (live) { setState({ url, data }); setError(null); } })
      .catch((e: Error) => { if (live && !(e instanceof SignedOut)) setError(e.message); });
    return () => { live = false; };
  }, [url, tick]);

  return {
    data: state?.data ?? null,
    loading: !!url && state?.url !== url && !error,
    error,
    reload: () => setTick((n) => n + 1),
    mutate: (fn: (d: T) => T) => setState((s) => (s ? { ...s, data: fn(s.data) } : s)),
  };
}

const TZ = 'Asia/Kolkata';

/** "3 Nov, 9:41 pm" in India time. */
export function clock(iso?: string, withTime = true) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : { year: 'numeric' }),
  });
}

const digitsOf = (s: string) => s.replace(/[^\d]/g, '');

/** True for things like "98765 43210" or "+91 98765 43210". */
export function looksLikePhone(value: string) {
  const v = value.trim();
  if (!/^\+?[\d\s\-()]+$/.test(v)) return false;
  const n = digitsOf(v).length;
  return n >= 10 && n <= 13;
}

export const telLink = (mobile: string) => `tel:+${waNumber(mobile)}`;

/** Digits for wa.me: a bare 10-digit Indian mobile gets 91 in front. */
export function waNumber(mobile: string) {
  const d = digitsOf(mobile);
  return d.length === 10 ? `91${d}` : d.replace(/^0+/, '');
}
export const waLink = (mobile: string) => `https://wa.me/${waNumber(mobile)}`;
