import Link from 'next/link';
import { SearchX, X } from 'lucide-react';
import { buttonClass } from '@/components/ui/button-styles';
import { PRODUCTS, giftProducts, lowestPrice, productsBySection } from '@/lib/products';
import { discountPct } from '@/lib/format';
import type { Product } from '@/lib/types';
import { PRICE_OPTIONS, clearFilters, shopHref, type ShopPrice, type ShopQuery, type ShopSort } from './shop-query';

const inPrice = (p: Product, price: ShopPrice) => {
  const low = lowestPrice(p);
  if (price === 'under-500') return low < 500;
  if (price === '500-1000') return low >= 500 && low <= 1000;
  if (price === 'above-1000') return low > 1000;
  return true;
};

const onSale = (p: Product) => p.variants.some((v) => v.compareAt && v.compareAt > v.price);

// Discount of the first pack, the same one the product card shows.
const discountOf = (p: Product) => discountPct(p.variants[0].price, p.variants[0].compareAt) ?? 0;

const SORTERS: Record<ShopSort, ((a: Product, b: Product) => number) | null> = {
  featured: null,
  'price-asc': (a, b) => lowestPrice(a) - lowestPrice(b),
  'price-desc': (a, b) => lowestPrice(b) - lowestPrice(a),
  discount: (a, b) => discountOf(b) - discountOf(a),
  newest: (a, b) => Number(b.tags.includes('new')) - Number(a.tags.includes('new')),
};

// Every search word must appear somewhere in the product's name, tagline, origin, section or description.
const matchesSearch = (p: Product, text?: string) => {
  if (!text) return true;
  const hay = `${p.name} ${p.tagline} ${p.origin ?? ''} ${p.section} ${p.description}`.toLowerCase();
  return text.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
};

/** Search and category first, then price / sale / gift, then sort. Ties keep catalogue order (sort is stable). */
export function applyShopQuery(q: ShopQuery): Product[] {
  const base = !q.filter ? PRODUCTS : q.filter === 'gifts' ? giftProducts() : productsBySection(q.filter);
  const list = base.filter(
    (p) => matchesSearch(p, q.q) && inPrice(p, q.price) && (!q.sale || onSale(p)) && (!q.gift || p.tags.includes('gift')),
  );
  const sorter = SORTERS[q.sort];
  return sorter ? [...list].sort(sorter) : list;
}

/** One removable chip per active drawer filter, plus "Clear all". Plain links, so no JS needed. */
export function ShopActiveFilters({ query }: { query: ShopQuery }) {
  const chips: { key: string; label: string; href: string }[] = [];
  if (query.q) chips.push({ key: 'q', label: `“${query.q}”`, href: shopHref({ ...query, q: undefined }) });
  if (query.price !== 'any') {
    const label = PRICE_OPTIONS.find((o) => o.value === query.price)?.label ?? query.price;
    chips.push({ key: 'price', label, href: shopHref({ ...query, price: 'any' }) });
  }
  if (query.sale) chips.push({ key: 'sale', label: 'On sale', href: shopHref({ ...query, sale: false }) });
  if (query.gift) chips.push({ key: 'gift', label: 'Gift boxes only', href: shopHref({ ...query, gift: false }) });

  if (!chips.length) return null;
  return (
    <ul aria-label="Active filters" className="mt-4 flex flex-wrap items-center gap-x-2">
      {chips.map((c) => (
        <li key={c.key}>
          <Link href={c.href} scroll={false} aria-label={`Remove filter: ${c.label}`} className="group inline-flex min-h-11 items-center">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-pearl pr-2.5 pl-3.5 text-sm font-medium text-ink transition-colors group-hover:border-navy">
              {c.label}
              <X size={14} aria-hidden className="text-ink-soft" />
            </span>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={shopHref(clearFilters(query))}
          scroll={false}
          className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-navy underline-offset-4 hover:underline"
        >
          Clear all
        </Link>
      </li>
    </ul>
  );
}

export function ShopEmptyState({ query }: { query: ShopQuery }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-pearl px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-navy">
        <SearchX size={24} aria-hidden />
      </span>
      <h3 className="mt-5 text-xl text-ink">No products match these filters</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">Try a wider price range, or clear the filters to see everything in this category.</p>
      <Link href={shopHref(clearFilters(query))} scroll={false} className={buttonClass('navy', 'mt-6')}>
        Clear filters
      </Link>
    </div>
  );
}
