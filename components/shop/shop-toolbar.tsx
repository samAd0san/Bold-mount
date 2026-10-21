'use client';

import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { ShopFilterDrawer } from './shop-filter-drawer';
import { SORT_OPTIONS, shopHref, type ShopQuery, type ShopSort } from './shop-query';

/** Right-corner controls: "Sort by" select + "Filter" button. Both just rewrite the URL. */
export function ShopToolbar({ query }: { query: ShopQuery }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sort, setSort] = useOptimistic(query.sort);

  const onSort = (next: ShopSort) =>
    startTransition(() => {
      setSort(next);
      router.replace(shopHref({ ...query, sort: next }), { scroll: false });
    });

  return (
    <div className="flex w-full items-center gap-2 md:w-auto md:gap-3" aria-busy={pending}>
      <div className="relative min-w-0 flex-1 md:flex-none">
        <label htmlFor="shop-sort" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xs text-ink-soft">
          Sort by
        </label>
        <select
          id="shop-sort"
          value={sort}
          onChange={(e) => onSort(e.target.value as ShopSort)}
          className="h-11 w-full cursor-pointer appearance-none rounded-full border border-line bg-pearl pr-10 pl-[4.25rem] text-base font-medium text-ink transition-colors hover:border-navy md:w-auto md:min-w-56 md:text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-soft" />
      </div>

      <ShopFilterDrawer query={query} />
    </div>
  );
}
