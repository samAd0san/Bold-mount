'use client';

import * as React from 'react';
import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { adminFetch, useFetch } from '@/components/admin/api';
import { Badge, btn, Empty, ErrorNote, PageHead, Skeleton, Switch, Thumb } from '@/components/admin/ui';
import type { Category } from '@/lib/types';
import { useLive } from '@/lib/live';
import { cn } from '@/lib/utils';

type Row = Category & { products: number };

export function CategoriesList() {
  const { data, error, reload, mutate } = useFetch<{ categories: Row[] }>('/api/admin/categories');
  useLive('catalog', reload);
  const [problem, setProblem] = React.useState<string | null>(null);

  const toggle = async (c: Row, active: boolean) => {
    setProblem(null);
    mutate((d) => ({ categories: d.categories.map((x) => (x.id === c.id ? { ...x, active } : x)) }));
    try {
      await adminFetch(`/api/admin/categories/${c.id}`, { method: 'PATCH', body: JSON.stringify({ active }) });
    } catch (e) {
      setProblem((e as Error).message);
      reload();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Categories" sub="The groups products live in." action={<Link href="/admin/categories/new" className={btn('gold', 'sm', 'py-2')}><Plus className="size-4" />Add category</Link>} />
      {(error || problem) && <ErrorNote onRetry={error ? reload : undefined}>{error ?? problem}</ErrorNote>}

      {!data ? (
        error ? null : <Skeleton rows={5} className="h-[4.5rem]" />
      ) : data.categories.length === 0 ? (
        <Empty>No categories yet.</Empty>
      ) : (
        <ul className="overflow-hidden rounded-2xl border bg-pearl shadow-card">
          {data.categories.map((c) => (
            <li key={c.id} className={cn('flex items-center gap-3 border-b px-3 py-3 last:border-0 sm:gap-4 sm:px-4', !c.active && 'bg-ink/[0.03]')}>
              <Thumb src={c.image} alt={c.name} size={56} cover className={cn(!c.active && 'opacity-50')} />
              <div className="min-w-0 flex-1">
                <p className={cn('truncate font-semibold text-ink', !c.active && 'text-ink-soft')}>{c.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-soft">
                  <span>/{c.slug}</span>
                  <span className="font-semibold text-navy">{c.products} product{c.products === 1 ? '' : 's'}</span>
                  <span>Sort {c.sort}</span>
                  {!c.active && <Badge>Hidden</Badge>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Switch checked={c.active} onChange={(v) => void toggle(c, v)} label={`${c.name} is shown in the shop`} />
                <Link href={`/admin/categories/${c.id}`} className={btn('outline', 'sm')} aria-label={`Edit ${c.name}`}><Pencil className="size-3.5" /><span className="hidden sm:inline">Edit</span></Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
