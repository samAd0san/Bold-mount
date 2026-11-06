'use client';

import { createContext, useContext } from 'react';
import type { DeliverySettings } from '@/lib/delivery';

const Ctx = createContext<DeliverySettings | null>(null);

/** Hands the saved delivery rule (loaded once in SiteChrome, refreshed on live updates) to client components such as the cart and checkout. */
export function DeliveryProvider({ delivery, children }: { delivery: DeliverySettings; children: React.ReactNode }) {
  return <Ctx value={delivery}>{children}</Ctx>;
}

export function useDelivery(): DeliverySettings {
  const d = useContext(Ctx);
  if (!d) throw new Error('useDelivery must be used inside the storefront layout');
  return d;
}
