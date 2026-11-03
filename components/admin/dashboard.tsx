'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { CalendarDays, Monitor, RotateCw, Smartphone, Tablet, type LucideIcon } from 'lucide-react';
import { adminFetch, SignedOut } from '@/components/admin/api';
import { RangeCalendar, rangeText, type DayRange } from '@/components/admin/date-range';
import { Card, Empty, ErrorNote, InfoTip, PageHead } from '@/components/admin/ui';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

type Period = 'today' | 'yesterday' | 'week' | 'custom';
type Stats = {
  period: Period;
  range: DayRange;
  visitors: number;
  pageViews: number;
  activeNow: number;
  orders: number;
  paidOrders: number;
  revenue: number;
  signups: number;
  topPages: { path: string; views: number; visitors: number }[];
  topProducts: { slug: string; name: string; views: number }[];
  devices: { mobile: number; tablet: number; desktop: number };
};

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'custom', label: 'Custom' },
];
const WORDS: Record<Period, string> = { today: 'today', yesterday: 'yesterday', week: 'this week', custom: 'in these dates' };
const n = (v: number) => v.toLocaleString('en-IN');

/** Loads stats for a period and quietly refreshes them every 30s while the tab is visible. */
function useStats(query: string) {
  const [data, setData] = React.useState<(Stats & { query: string }) | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let live = true;
    const load = () =>
      adminFetch<Stats>(`/api/admin/stats?${query}`)
        .then((s) => { if (live) { setData({ ...s, query }); setError(null); } })
        .catch((e: Error) => { if (live && !(e instanceof SignedOut)) setError(e.message); });
    void load();
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 30_000);
    return () => { live = false; window.clearInterval(t); };
  }, [query, tick]);

  return { data, error, loading: !data || data.query !== query, reload: () => setTick((x) => x + 1) };
}

export function Dashboard() {
  const [period, setPeriod] = React.useState<Period>('today');
  const [custom, setCustom] = React.useState<DayRange | null>(null);
  const [picking, setPicking] = React.useState(false);
  const query = period === 'custom' && custom ? `period=custom&from=${custom.from}&to=${custom.to}` : `period=${period === 'custom' ? 'today' : period}`;
  const { data, error, loading, reload } = useStats(query);
  const word = WORDS[period === 'custom' && !custom ? 'today' : period];

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <PageHead
        title="Dashboard"
        sub="How the store is doing."
        action={
          <button type="button" onClick={reload} aria-label="Refresh" className="grid size-9 place-items-center rounded-full text-ink-soft transition hover:bg-navy/10 hover:text-navy">
            <RotateCw className={cn('size-4', loading && 'animate-spin')} />
          </button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Popover.Root open={picking} onOpenChange={setPicking}>
          <Popover.Anchor asChild>
            <div role="radiogroup" className="grid w-full grid-cols-4 gap-1 rounded-full bg-navy/[0.07] p-1 sm:inline-flex sm:w-auto">
              {PERIODS.map((o) => {
                const on = o.value === period;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => (o.value === 'custom' ? setPicking(true) : setPeriod(o.value))}
                    className={cn('inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-semibold whitespace-nowrap transition sm:px-4', on ? 'bg-navy text-on-night' : 'text-ink-soft hover:text-navy')}
                  >
                    {o.value === 'custom' ? (
                      <>
                        <CalendarDays className="size-3.5 shrink-0" />
                        <span className="truncate">{on && custom ? rangeText(custom) : 'Custom'}</span>
                      </>
                    ) : o.label}
                  </button>
                );
              })}
            </div>
          </Popover.Anchor>
          <Popover.Portal>
            <Popover.Content align="start" sideOffset={8} collisionPadding={12} className="z-50 rounded-2xl border bg-pearl p-3 shadow-card">
              <RangeCalendar
                value={custom}
                onCancel={() => setPicking(false)}
                onApply={(r) => { setCustom(r); setPeriod('custom'); setPicking(false); }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <p className="text-[13px] text-ink-soft">{data && !loading ? `${rangeText(data.range)} · India time` : ' '}</p>
      </div>

      {error && !data && <ErrorNote onRetry={reload}>{error}</ErrorNote>}

      <div className={cn('flex flex-col gap-5 transition-opacity sm:gap-6', loading && data && 'opacity-55')}>
        <Cards data={data} />
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
          <Panel title="Top pages">{data && <TopPages data={data} word={word} />}</Panel>
          <div className="flex flex-col gap-5 sm:gap-6">
            <Panel title="Top products">{data && <TopProducts data={data} word={word} />}</Panel>
            <Panel title="Devices">{data && <Devices data={data} word={word} />}</Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="mb-3 text-[15px] font-semibold text-navy">{title}</h2>
      {children ?? <div className="h-24 animate-pulse rounded-xl bg-ink/[0.06]" />}
    </Card>
  );
}

function Stat({ label, value, sub, info, live }: { label: string; value: React.ReactNode; sub?: React.ReactNode; info: string; live?: boolean }) {
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

function Cards({ data }: { data: Stats | null }) {
  const dash = <span className="text-ink-soft/50">—</span>;
  const d = data;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      <Stat label="Visitors" info="Different people who opened the site, counted once each however often they came back. Bots are not counted." value={d ? n(d.visitors) : dash} />
      <Stat label="Page views" info="Every time a page was opened, including repeat visits by the same person." value={d ? n(d.pageViews) : dash} />
      <Stat label="Orders" info="Orders placed in this period. The first number is orders paid online (even if refunded later), the second is all orders including WhatsApp ones." value={d ? <>{n(d.paidOrders)} <span className="text-base font-medium text-ink-soft">of {n(d.orders)}</span></> : dash} sub="paid of total" />
      <Stat label="Revenue" info="Total of the orders paid online in this period, minus any refunds you sent back. WhatsApp orders are not included until you handle them yourself." value={d ? formatINR(d.revenue) : dash} sub="paid orders" />
      <Stat label="Sign-ups" info="New customer accounts created in this period." value={d ? n(d.signups) : dash} />
      <Stat label="Active now" live={!!d?.activeNow} info="People who opened a page in the last 5 minutes. This one ignores the period buttons." value={d ? n(d.activeNow) : dash} sub="in the last 5 minutes" />
    </div>
  );
}

function TopPages({ data, word }: { data: Stats; word: string }) {
  if (!data.topPages.length) return <Empty>No visits {word}.</Empty>;
  return (
    <div className="text-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_4.25rem] gap-3 border-b pb-2 text-xs font-semibold text-ink-soft">
        <span>Page</span>
        <span className="text-right">Views</span>
        <span className="text-right">Visitors</span>
      </div>
      <ol>
        {data.topPages.map((p, i) => (
          <li key={p.path} className="grid grid-cols-[minmax(0,1fr)_3.5rem_4.25rem] items-center gap-3 border-b border-line/60 py-2.5 last:border-0">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="w-4 shrink-0 text-xs text-ink-soft tabular-nums">{i + 1}</span>
              <span className="truncate text-ink">{p.path}</span>
            </span>
            <span className="text-right font-semibold text-ink tabular-nums">{n(p.views)}</span>
            <span className="text-right text-ink-soft tabular-nums">{n(p.visitors)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function TopProducts({ data, word }: { data: Stats; word: string }) {
  if (!data.topProducts.length) return <Empty>No product views {word}.</Empty>;
  return (
    <ol className="text-sm">
      {data.topProducts.map((p, i) => (
        <li key={p.slug} className="flex items-center gap-2.5 border-b border-line/60 py-2.5 last:border-0">
          <span className="w-4 shrink-0 text-xs text-ink-soft tabular-nums">{i + 1}</span>
          <span className="min-w-0 flex-1 truncate text-ink">{p.name}</span>
          <span className="font-semibold text-ink tabular-nums">{n(p.views)}</span>
          <span className="w-10 text-xs text-ink-soft">views</span>
        </li>
      ))}
    </ol>
  );
}

const DEVICES: { key: keyof Stats['devices']; label: string; icon: LucideIcon }[] = [
  { key: 'mobile', label: 'Mobile', icon: Smartphone },
  { key: 'tablet', label: 'Tablet', icon: Tablet },
  { key: 'desktop', label: 'Desktop', icon: Monitor },
];

function Devices({ data, word }: { data: Stats; word: string }) {
  const total = DEVICES.reduce((s, d) => s + data.devices[d.key], 0);
  if (!total) return <Empty>No visits {word}.</Empty>;
  return (
    <ul className="flex flex-col gap-3.5">
      {DEVICES.map(({ key, label, icon: Icon }) => {
        const count = data.devices[key];
        const pct = Math.round((count / total) * 100);
        return (
          <li key={key}>
            <div className="flex items-center gap-2.5 text-sm">
              <Icon className="size-4 text-ink-soft" />
              <span className="flex-1 text-ink">{label}</span>
              <span className="font-semibold text-ink tabular-nums">{n(count)}</span>
              <span className="w-10 text-right text-[13px] text-ink-soft tabular-nums">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy/[0.08]">
              <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
