'use client';

import * as React from 'react';
import { Card, CardTitle, InfoTip } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

// Small building blocks for the dashboard cards, so every card reads the same way.

/** Indian digit grouping: 1,24,999. */
export const n = (v: number) => v.toLocaleString('en-IN');

/** A titled card: heading with an "i" tip, a one-line plain explanation, then the content (or a grey placeholder while loading). */
export function Panel({ title, tip, blurb, children, className }: { title: string; tip: React.ReactNode; blurb: string; children?: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardTitle tip={tip}>{title}</CardTitle>
      <p className="mt-1 mb-4 text-[13px] text-ink-soft">{blurb}</p>
      {children ?? <div className="h-24 animate-pulse rounded-xl bg-ink/[0.06]" />}
    </Card>
  );
}

export function Stat({ label, value, sub, info, live }: { label: string; value: React.ReactNode; sub: React.ReactNode; info: string; live?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border bg-pearl p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
        {live && (
          <span className="relative flex size-2.5 items-center justify-center" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-50" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
        )}
        <span className="truncate">{label}</span>
        <span className="ml-auto"><InfoTip label={`What ${label} counts`}>{info}</InfoTip></span>
      </div>
      <div className="mt-2.5 text-[28px] leading-none font-semibold tracking-tight text-navy tabular-nums sm:text-[32px]">{value}</div>
      <div className="mt-2 min-h-4 text-xs text-ink-soft">{sub}</div>
    </div>
  );
}

/** One row of a plain bar list: label (with a grey line under it), the number, and a bar showing its share. */
export function BarRow({ icon, label, sub, value, of, tone = 'gold' }: { icon?: React.ReactNode; label: string; sub?: string; value: number; of: number; tone?: 'gold' | 'navy' }) {
  const pct = of > 0 ? Math.round((value / of) * 100) : 0;
  return (
    <li>
      <div className="flex items-center gap-2.5 text-sm">
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-ink">{label}</span>
          {sub && <span className="block truncate text-xs text-ink-soft">{sub}</span>}
        </span>
        <span className="font-semibold text-ink tabular-nums">{n(value)}</span>
        <span className="w-10 text-right text-[13px] text-ink-soft tabular-nums">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy/[0.08]" aria-hidden>
        <div className={cn('h-full rounded-full', tone === 'gold' ? 'bg-gold' : 'bg-navy')} style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%` }} />
      </div>
    </li>
  );
}
