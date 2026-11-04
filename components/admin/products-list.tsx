'use client';

import * as React from 'react';
import Link from 'next/link';
import { Pencil, Plus, Search } from 'lucide-react';
import { adminFetch, useFetch } from '@/components/admin/api';
import { Badge, btn, Empty, ErrorNote, Input, PageHead, Select, Skeleton, Switch, Thumb } from '@/components/admin/ui';
import { formatINR } from '@/lib/format';
import type { Category, Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useLive } from '@/lib/live';

const priceText = (p: Product) => {
  if (!p.variants.length) return '—';
  const prices = p.variants.map((v) => v.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  return lo === hi ? formatINR(lo) : `${formatINR(lo)} – ${formatINR(hi)}`;
};

export function ProductsList() {
  const products = useFetch<{ products: Product[] }>('/api/admin/products');
  const cats = useFetch<{ categories: Category[] }>('/api/admin/categories');
  useLive('catalog', () => { products.reload(); cats.reload(); });
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('');
  const [problem, setProblem] = React.useState<string | null>(null);

  const catName = (slug: string) => cats.data?.categories.find((c) => c.slug === slug)?.name ?? slug;
  const list = (products.data?.products ?? []).filter((p) => {
    if (cat && p.category !== cat) return false;
    const needle = q.trim().toLowerCase();
    return !needle || p.name.toLowerCase().includes(needle) || p.slug.includes(needle);
  });

  const toggle = async (p: Product, active: boolean) => {
    setProblem(null);
    products.mutate((d) => ({ ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, active } : x)) }));
    try {
      await adminFetch(`/api/admin/products/${p.id}`, { method: 'PATCH', body: JSON.stringify({ active }) });
    } catch (e) {
      setProblem((e as Error).message);
      products.reload();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHead
        title="Products"
        sub={products.data ? `${products.data.products.length} products` : undefined}
        action={<Link href="/admin/products/new" className={btn('gold', 'sm', 'py-2')}><Plus className="size-4" />Add product</Link>}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-soft" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" aria-label="Search products" className="pl-10" />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category" className="sm:w-56">
          <option value="">All categories</option>
          {cats.data?.categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </Select>
      </div>

      {(products.error || problem) && <ErrorNote onRetry={products.error ? products.reload : undefined}>{products.error ?? problem}</ErrorNote>}

      {!products.data ? (
        products.error ? null : <Skeleton rows={6} className="h-[4.5rem]" />
      ) : list.length === 0 ? (
        <Empty>{products.data.products.length ? 'No products match.' : 'No products yet. Add your first one.'}</Empty>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-pearl shadow-card">
          {list.map((p) => (
            <li key={p.id} className={cn('flex items-center gap-3 border-b px-3 py-3 last:border-0 sm:gap-4 sm:px-4', !p.active && 'bg-ink/[0.03]')}>
              <Thumb src={p.images[0]?.src} alt={p.images[0]?.alt || p.name} size={56} cover={p.images[0]?.cover} className={cn(!p.active && 'opacity-50')} />
              <div className="min-w-0 flex-1">
                <p className={cn('line-clamp-2 leading-snug font-semibold text-ink', !p.active && 'text-ink-soft')}>{p.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-soft">
                  <span>{catName(p.category)}</span>
                  <span className="font-semibold text-navy">{priceText(p)}</span>
                  {!p.active && <Badge>Hidden</Badge>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Switch checked={p.active} onChange={(v) => void toggle(p, v)} label={`${p.name} is shown in the shop`} />
                <Link href={`/admin/products/${p.id}`} className={btn('outline', 'sm')} aria-label={`Edit ${p.name}`}>
                  <Pencil className="size-3.5" /><span className="hidden sm:inline">Edit</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
