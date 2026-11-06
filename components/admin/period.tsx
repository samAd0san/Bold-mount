'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { CalendarDays } from 'lucide-react';
import { adminFetch, SignedOut } from '@/components/admin/api';
import { RangeCalendar, rangeText, type DayRange } from '@/components/admin/date-range';
import { cn } from '@/lib/utils';

export type Period = 'today' | 'yesterday' | 'week' | 'custom';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This week' },
  { value: 'custom', label: 'Custom' },
];
const WORDS: Record<Period, string> = { today: 'today', yesterday: 'yesterday', week: 'this week', custom: 'in these dates' };
const KEY = 'bm-admin-period';
const DAY = /^\d{4}-\d{2}-\d{2}$/;

type State = { period: Period; custom: DayRange | null };

// The chosen period follows you between Dashboard and Visitors for this visit.
function read(): State {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as State | null;
    if (s && PERIODS.some((p) => p.value === s.period) && (s.period !== 'custom' || (s.custom && DAY.test(s.custom.from) && DAY.test(s.custom.to)))) return s;
  } catch {
    // Storage blocked or corrupt: start from Today.
  }
  return { period: 'today', custom: null };
}

export function usePeriod() {
  // The admin only renders in the browser after the PIN check, so reading storage here is safe.
  const [state, setState] = React.useState<State>(read);
  const save = (s: State) => {
    setState(s);
    try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  };
  const { period, custom } = state;
  const query = period === 'custom' && custom ? `period=custom&from=${custom.from}&to=${custom.to}` : `period=${period === 'custom' ? 'today' : period}`;
  return {
    period,
    custom,
    query,
    word: WORDS[period === 'custom' && !custom ? 'today' : period],
    setPeriod: (p: Period) => save({ ...state, period: p }),
    setCustom: (c: DayRange) => save({ period: 'custom', custom: c }),
  };
}

export type PeriodControl = ReturnType<typeof usePeriod>;

/** Today / Yesterday / This week / Custom buttons, with the exact dates (India time) underneath on phones and beside them on wider screens. */
export function PeriodBar({ p, range }: { p: PeriodControl; range?: DayRange }) {
  const [picking, setPicking] = React.useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <Popover.Root open={picking} onOpenChange={setPicking}>
        <Popover.Anchor asChild>
          <div role="radiogroup" aria-label="Time period" className="grid w-full grid-cols-4 gap-1 rounded-full bg-navy/[0.07] p-1 sm:inline-flex sm:w-auto">
            {PERIODS.map((o) => {
              const on = o.value === p.period;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => (o.value === 'custom' ? setPicking(true) : p.setPeriod(o.value))}
                  className={cn('inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-semibold whitespace-nowrap transition sm:px-4', on ? 'bg-navy text-on-night' : 'text-ink-soft hover:text-navy')}
                >
                  {o.value === 'custom' ? (
                    <>
                      <CalendarDays className="size-3.5 shrink-0" />
                      <span className="truncate">{on && p.custom ? rangeText(p.custom) : 'Custom'}</span>
                    </>
                  ) : o.label}
                </button>
              );
            })}
          </div>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={8} collisionPadding={12} className="z-50 rounded-2xl border bg-pearl p-3 shadow-card">
            <RangeCalendar value={p.custom} onCancel={() => setPicking(false)} onApply={(r) => { p.setCustom(r); setPicking(false); }} />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <p className="text-[13px] whitespace-nowrap text-ink-soft">{range ? `${rangeText(range)} · India time` : ' '}</p>
    </div>
  );
}

/** Loads a url and quietly refreshes it every 30s while the tab is visible; keeps the old data on screen while a new url loads. */
export function usePolled<T>(url: string) {
  const [data, setData] = React.useState<{ url: string; value: T } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let live = true;
    const load = () =>
      adminFetch<T>(url)
        .then((value) => { if (live) { setData({ url, value }); setError(null); } })
        .catch((e: Error) => { if (live && !(e instanceof SignedOut)) setError(e.message); });
    void load();
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 30_000);
    return () => { live = false; window.clearInterval(t); };
  }, [url, tick]);

  return { data: data?.value ?? null, error, loading: !data || data.url !== url, reload: () => setTick((x) => x + 1) };
}
