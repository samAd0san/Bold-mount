import type { ShopSection } from '@/lib/types';

// The shop's whole state lives in the URL (?filter=&sort=&price=&sale=1&gift=1) so links are shareable.
export type ShopFilter = ShopSection | 'gifts';
export type ShopSort = 'featured' | 'price-asc' | 'price-desc' | 'discount' | 'newest';
export type ShopPrice = 'any' | 'under-500' | '500-1000' | 'above-1000';

export interface ShopQuery {
  filter?: ShopFilter; // undefined = All
  sort: ShopSort;
  price: ShopPrice;
  sale: boolean;
  gift: boolean;
}

export type ShopSearchParams = Record<string, string | string[] | undefined>;

export const SORT_OPTIONS: { value: ShopSort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
  { value: 'newest', label: 'Newest' },
];

export const PRICE_OPTIONS: { value: ShopPrice; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'under-500', label: 'Under ₹500' },
  { value: '500-1000', label: '₹500–₹1,000' },
  { value: 'above-1000', label: 'Above ₹1,000' },
];

const FILTERS: ShopFilter[] = ['talbeenah', 'dates', 'honey', 'wearings', 'gifts'];

const first = (raw: string | string[] | undefined) => (Array.isArray(raw) ? raw[0] : raw);
const pick = <T extends string>(allowed: readonly T[], raw: string | string[] | undefined): T | undefined =>
  allowed.find((a) => a === first(raw));

/** Reads the URL params into a clean query; anything unknown falls back to the default. */
export function parseShopQuery(sp: ShopSearchParams): ShopQuery {
  return {
    filter: pick(FILTERS, sp.filter),
    sort: pick(SORT_OPTIONS.map((o) => o.value), sp.sort) ?? 'featured',
    price: pick(PRICE_OPTIONS.map((o) => o.value), sp.price) ?? 'any',
    sale: first(sp.sale) === '1',
    gift: first(sp.gift) === '1',
  };
}

/** Builds the /shop URL for a query, leaving defaults out so links stay short. */
export function shopHref(q: ShopQuery): string {
  const p = new URLSearchParams();
  if (q.filter) p.set('filter', q.filter);
  if (q.sort !== 'featured') p.set('sort', q.sort);
  if (q.price !== 'any') p.set('price', q.price);
  if (q.sale) p.set('sale', '1');
  if (q.gift) p.set('gift', '1');
  const qs = p.toString();
  return qs ? `/shop?${qs}` : '/shop';
}

/** How many drawer filters (price / sale / gift) are on — category and sort don't count. */
export const activeFilterCount = (q: ShopQuery) => (q.price !== 'any' ? 1 : 0) + (q.sale ? 1 : 0) + (q.gift ? 1 : 0);

export const clearFilters = (q: ShopQuery): ShopQuery => ({ ...q, price: 'any', sale: false, gift: false });
