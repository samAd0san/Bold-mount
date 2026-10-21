'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/** False during SSR and hydration, true after — gate persisted-cart UI on it to avoid hydration mismatches. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
