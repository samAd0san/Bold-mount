import type { Product } from '@/lib/types';
import { SITE } from '@/lib/site';

// Small catalog helpers that are safe in client components too.

export const lowestPrice = (p: Product) => (p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0);

// These categories have their own hand-built pages; any category added from /admin uses /category/<slug>.
const DEDICATED = new Set(['talbeenah', 'dates', 'honey', 'dry-fruits', 'wearings']);
export const categoryHref = (slug: string) => (DEDICATED.has(slug) ? `/${slug}` : `/category/${slug}`);

/** Delivery charge for a cart subtotal: free at or above SITE.freeShippingAbove. */
export const deliveryFor = (subtotal: number) => (subtotal >= SITE.freeShippingAbove ? 0 : SITE.deliveryFee);
