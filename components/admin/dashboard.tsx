'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCw } from 'lucide-react';
import { BarRow, n, Panel, Stat } from '@/components/admin/dash-parts';
import { PeriodBar, usePeriod, usePolled, type PeriodControl } from '@/components/admin/period';
import { DEVICES, VisitorList, type VisitorPage } from '@/components/admin/visitors';
import { Badge, Empty, ErrorNote, PageHead } from '@/components/admin/ui';
import type { AdminStats } from '@/lib/server/admin-stats';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useLive } from '@/lib/live';

const GRID = 'grid gap-5 sm:gap-6 lg:grid-cols-2';
const ROW = 'flex items-center gap-2.5 border-b border-line/60 py-2.5 text-sm last:border-0';
const plural = (v: number, one: string, many: string) => `${n(v)} ${v === 1 ? one : many}`;

export function Dashboard() {
  const p = usePeriod();
  const stats = usePolled<AdminStats>(`/api/admin/stats?${p.query}`);
  const recent = usePolled<VisitorPage>(`/api/admin/stats/visitors?${p.query}&page=0&size=6`);
  const reload = () => { stats.reload(); recent.reload(); };
  useLive('admin', (name) => { if (name !== 'form') reload(); });
  const data = stats.data;
  const busy = stats.loading || recent.loading;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <PageHead
        title="Dashboard"
        sub="How the store is doing."
        action={
          <button type="button" onClick={reload} aria-label="Refresh" className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-navy/10 hover:text-navy">
            <RotateCw className={cn('size-4', busy && 'animate-spin')} />
          </button>
        }
      />

      <PeriodBar p={p} range={data && !stats.loading ? data.range : undefined} />

      {stats.error && !data && <ErrorNote onRetry={reload}>{stats.error}</ErrorNote>}

      <div className={cn('flex flex-col gap-5 transition-opacity sm:gap-6', busy && data && 'opacity-55')}>
        <Cards data={data} />
        <Panel
          title="Recent visitors"
          blurb="The latest people to visit, and what each one did. Tap a visitor to see the pages they opened."
          tip="Each row is one person (a phone, tablet or computer). Tap it to see their steps in order: the pages they opened, what they searched, whether they added to the cart or ordered. If they were signed in you see their name; otherwise they are numbered Visitor 1, 2, 3… in the order they arrived."
        >
          {recent.data && <RecentVisitors page={recent.data} p={p} />}
        </Panel>
        <Panel
          title="From visit to order"
          blurb="How many people went from looking around to buying."
          tip="Each step counts the people who got at least that far. Looking, adding to the cart and reaching checkout are noted from the visitor's phone or computer; ‘placed an order’ and ‘paid’ come from your saved orders, so they are exact. Cash-on-delivery orders count as paid once you mark them paid."
        >
          {data && <Funnel data={data} p={p} />}
        </Panel>
        <div className={GRID}>
          <Panel
            title="Where visitors came from"
            blurb="How people found your shop."
            tip="Counted once per person, by the first way they arrived in this period. Links shared on WhatsApp often arrive without a source; add ?utm_source=whatsapp to the end of the link you share and they will be counted as WhatsApp."
          >
            {data && <Sources data={data} p={p} />}
          </Panel>
          <Panel title="Devices" blurb="What people used to visit." tip="Each person is counted once, by the device they used last in this period.">
            {data && <Devices data={data} p={p} />}
          </Panel>
          <Panel title="Most visited pages" blurb="The pages people opened most." tip="‘Times opened’ counts every visit to the page, repeats included; ‘People’ counts each person once. Shop searches are listed separately below.">
            {data && <TopPages data={data} p={p} />}
          </Panel>
          <Panel title="Most viewed products" blurb="The products people looked at most." tip="Views are the times a product page was opened. ‘Added to cart’ is how many times people put that product in their cart.">
            {data && <TopProducts data={data} p={p} />}
          </Panel>
          <Panel title="What people searched for" blurb="Words typed into the shop’s search box." tip="The most common searches, with how many products each one found. Capital letters are ignored.">
            {data && <Searches data={data} p={p} />}
          </Panel>
          <Panel
            title="People searched for these but found nothing"
            blurb="Products customers wanted that you do not have yet."
            tip="Words people searched for that matched no product. If it is something you can sell, adding it means the next person finds it. A word leaves this list once a product matches it."
            className="border-amber-300/70 bg-amber-50"
          >
            {data && <NothingFound data={data} p={p} />}
          </Panel>
          {data?.trend ? (
            <Panel
              title={data.trend.unit === 'week' ? 'Visitors each week' : 'Visitors each day'}
              blurb={data.trend.unit === 'week' ? 'How many people visited in each week (Monday to Sunday).' : 'How many people visited on each day.'}
              tip="Each person is counted once per bar. A person who comes on two days appears in both days."
            >
              <Trend trend={data.trend} />
            </Panel>
          ) : null}
          <Panel
            title="Busiest time of day"
            blurb="When people visit, in India time."
            tip="Counts people by the hour they were on the site. The bars group the day into six parts; the busiest single hour is shown above them."
            className={data?.trend ? undefined : 'lg:col-span-2'}
          >
            {data && <Busiest data={data} p={p} />}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Cards({ data }: { data: AdminStats | null }) {
  const dash = <span className="text-ink-soft/50">—</span>;
  const d = data;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      <Stat label="Visitors" info="Different people who opened the shop, counted once each however often they came back. Bots and your own visits are not counted." value={d ? n(d.visitors) : dash} sub="people who opened the shop" />
      <Stat label="Pages opened" info="Every time a page was opened, including repeat visits by the same person." value={d ? n(d.pagesOpened) : dash} sub="every page, repeats too" />
      <Stat label="Orders" info="All orders placed in this period, paid online or cash on delivery. The first number is the orders that are paid (even if refunded later), the second is every order placed." value={d ? <>{n(d.paidOrders)} <span className="text-base font-medium text-ink-soft">of {n(d.orders)}</span></> : dash} sub="paid of all placed" />
      <Stat label="Revenue" info="Money received for orders placed in this period: online payments, plus cash-on-delivery orders once you mark them paid, minus any refunds you sent back." value={d ? formatINR(d.revenue) : dash} sub="money received" />
      <Stat label="Sign-ups" info="New customer accounts created in this period." value={d ? n(d.signups) : dash} sub="new customer accounts" />
      <Stat label="Active now" live={!!d?.activeNow} info="People who opened a page in the last 5 minutes. This one ignores the period buttons." value={d ? n(d.activeNow) : dash} sub="in the last 5 minutes" />
    </div>
  );
}

function RecentVisitors({ page, p }: { page: VisitorPage; p: PeriodControl }) {
  if (!page.visitors.length) return <Empty>No visitors {p.word}. When someone opens your shop, they will appear here with the pages they looked at.</Empty>;
  return (
    <>
      <VisitorList rows={page.visitors} query={p.query} />
      <div className="mt-3 flex items-center justify-between gap-3 text-[13px] text-ink-soft">
        <span>Showing {n(page.visitors.length)} of {n(page.total)}</span>
        <Link href="/admin/visitors" className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-navy underline-offset-4 hover:underline">
          See all visitors <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </>
  );
}

const STEPS = [
  { key: 'looked', label: 'Looked at a product', say: 'looked at a product' },
  { key: 'carted', label: 'Added to cart', say: 'added to cart' },
  { key: 'checkout', label: 'Reached checkout', say: 'reached checkout' },
  { key: 'placed', label: 'Placed an order', say: 'placed an order' },
  { key: 'paid', label: 'Paid', say: 'paid' },
] as const;

function Funnel({ data, p }: { data: AdminStats; p: PeriodControl }) {
  const f = data.funnel;
  if (!f.visitors) return <Empty>No visitors {p.word}. When people visit, you will see how many looked at a product, added to the cart and ordered.</Empty>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-relaxed text-ink">
        Of <strong>{n(f.visitors)}</strong> {f.visitors === 1 ? 'visitor' : 'visitors'}:{' '}
        {STEPS.map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 && ' → '}
            <strong>{n(f[s.key])}</strong> {s.say}
          </React.Fragment>
        ))}
      </p>
      <ul className="flex flex-col gap-3.5">
        {STEPS.map((s) => <BarRow key={s.key} label={s.label} value={f[s.key]} of={f.visitors} tone={s.key === 'paid' ? 'navy' : 'gold'} />)}
      </ul>
    </div>
  );
}

function Sources({ data, p }: { data: AdminStats; p: PeriodControl }) {
  if (!data.sources.length) return <Empty>No visitors {p.word}. When people arrive from WhatsApp, Instagram, Google or by typing your address, you will see them here.</Empty>;
  return (
    <ul className="flex flex-col gap-3.5">
      {data.sources.map((s) => <BarRow key={s.key} label={s.label} sub={s.other ? 'Other website' : undefined} value={s.visitors} of={data.visitors} />)}
    </ul>
  );
}

function Devices({ data, p }: { data: AdminStats; p: PeriodControl }) {
  const total = data.devices.mobile + data.devices.tablet + data.devices.desktop;
  if (!total) return <Empty>No visitors {p.word}. You will see how many used a phone, a tablet or a computer.</Empty>;
  return (
    <ul className="flex flex-col gap-3.5">
      {(Object.keys(DEVICES) as (keyof typeof DEVICES)[]).map((k) => {
        const Icon = DEVICES[k].icon;
        return <BarRow key={k} icon={<Icon className="size-4 text-ink-soft" aria-hidden />} label={DEVICES[k].label} value={data.devices[k]} of={total} />;
      })}
    </ul>
  );
}

function TopPages({ data, p }: { data: AdminStats; p: PeriodControl }) {
  if (!data.topPages.length) return <Empty>No pages opened {p.word}. The pages people open most will be listed here by their plain names.</Empty>;
  return (
    <div className="text-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_4rem_3.5rem] gap-3 border-b pb-2 text-xs font-semibold text-ink-soft">
        <span>Page</span>
        <span className="text-right">Times opened</span>
        <span className="text-right">People</span>
      </div>
      <ol>
        {data.topPages.map((pg, i) => (
          <li key={pg.path} className="grid grid-cols-[minmax(0,1fr)_4rem_3.5rem] items-center gap-3 border-b border-line/60 py-2.5 last:border-0">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="w-4 shrink-0 text-xs text-ink-soft tabular-nums">{i + 1}</span>
              <span className="min-w-0">
                <span className="line-clamp-2 text-ink">{pg.label}</span>
                <span className="block truncate text-xs text-ink-soft/80">{pg.path}</span>
              </span>
            </span>
            <span className="text-right font-semibold text-ink tabular-nums">{n(pg.views)}</span>
            <span className="text-right text-ink-soft tabular-nums">{n(pg.visitors)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TopProducts({ data, p }: { data: AdminStats; p: PeriodControl }) {
  if (!data.topProducts.length) return <Empty>No product pages opened {p.word}. The products people look at most will be listed here by name.</Empty>;
  return (
    <ol className="text-sm">
      {data.topProducts.map((pr, i) => (
        <li key={pr.slug} className={ROW}>
          <span className="w-4 shrink-0 text-xs text-ink-soft tabular-nums">{i + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-ink">{pr.name}</span>
            <span className="block truncate text-xs text-ink-soft">{pr.carts ? `Added to cart ${plural(pr.carts, 'time', 'times')}` : 'Not added to a cart yet'}</span>
          </span>
          <span className="text-right">
            <span className="font-semibold text-ink tabular-nums">{n(pr.views)}</span>
            <span className="block text-xs text-ink-soft">{pr.views === 1 ? 'view' : 'views'}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Searches({ data, p }: { data: AdminStats; p: PeriodControl }) {
  if (!data.searches.length) return <Empty>No searches {p.word}. When people search the shop, their words and how many products they found will be listed here.</Empty>;
  return (
    <ul className="text-sm">
      {data.searches.map((s) => (
        <li key={s.term} className={ROW}>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-ink">‘{s.term}’</span>
            <span className="block text-xs text-ink-soft">Searched {plural(s.times, 'time', 'times')}</span>
          </span>
          {s.results !== null && <Badge tone={s.results ? 'gray' : 'amber'}>{s.results ? `${plural(s.results, 'product', 'products')} found` : 'Found nothing'}</Badge>}
        </li>
      ))}
    </ul>
  );
}

function NothingFound({ data, p }: { data: AdminStats; p: PeriodControl }) {
  if (!data.noResults.length) return <p className="rounded-2xl border border-dashed border-amber-300 px-4 py-8 text-center text-sm text-ink-soft">Nothing missed {p.word}. Words that people search for but do not find will be listed here, so you know what to add.</p>;
  return (
    <ul className="text-sm">
      {data.noResults.map((s) => (
        <li key={s.term} className={cn(ROW, 'border-amber-200')}>
          <span className="min-w-0 flex-1 truncate font-semibold text-ink">‘{s.term}’</span>
          <span className="text-xs text-ink-soft">searched {plural(s.times, 'time', 'times')}</span>
        </li>
      ))}
    </ul>
  );
}

function Trend({ trend }: { trend: NonNullable<AdminStats['trend']> }) {
  const bars = trend.bars;
  const max = Math.max(...bars.map((b) => b.visitors), 1);
  const best = bars.reduce((a, b) => (b.visitors > a.visitors ? b : a));
  // Few bars get a number on top (many: only the busiest) and a label only every few bars, so nothing is squeezed.
  const counts = bars.length <= 14;
  const every = Math.max(1, Math.ceil(bars.length / 7));
  return (
    <>
      <p className="mb-3 text-sm text-ink">
        {best.visitors ? <>Busiest {trend.unit}: <strong>{best.full}</strong> · {plural(best.visitors, 'visitor', 'visitors')}</> : `No visitors in these ${trend.unit === 'week' ? 'weeks' : 'days'}.`}
      </p>
      <ol className="flex h-44 items-stretch gap-1 sm:gap-1.5">
        {bars.map((b, i) => (
          <li key={b.key} aria-label={`${b.full}: ${plural(b.visitors, 'visitor', 'visitors')}`} title={`${b.full}: ${plural(b.visitors, 'visitor', 'visitors')}`} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full flex-1 flex-col items-center justify-end gap-1">
              {(counts || b === best) && <span className="text-[11px] text-ink-soft tabular-nums">{b.visitors || ''}</span>}
              <div
                className={cn('w-full max-w-10 rounded-t-md', b.visitors ? (b === best ? 'bg-gold-deep' : 'bg-gold') : 'bg-navy/10')}
                style={{ height: b.visitors ? `max(${(b.visitors / max) * 82}%, 4px)` : '2px' }}
              />
            </div>
            <span className="mt-1.5 h-4 text-[11px] whitespace-nowrap text-ink-soft">{i % every === 0 ? b.label : ''}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

function Busiest({ data, p }: { data: AdminStats; p: PeriodControl }) {
  if (!data.busiest) return <Empty>No visitors {p.word}. You will see which part of the day is busiest.</Empty>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink">
        Busiest hour: <strong>{data.busiest.label}</strong> · {plural(data.busiest.visitors, 'visitor', 'visitors')}
      </p>
      <ul className="flex flex-col gap-3.5">
        {data.dayParts.map((d) => <BarRow key={d.label} label={d.label} sub={d.hours} value={d.visitors} of={data.visitors} />)}
      </ul>
    </div>
  );
}
