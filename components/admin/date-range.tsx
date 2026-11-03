'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/admin/ui';
import { cn } from '@/lib/utils';

export type DayRange = { from: string; to: string };

const TZ = 'Asia/Kolkata';
const pad = (n: number) => String(n).padStart(2, '0');
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
/** Today's date in India time as "YYYY-MM-DD". */
export const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const nice = (k: string) => new Date(`${k}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const rangeText = (r: DayRange) => (r.from === r.to ? nice(r.from) : `${nice(r.from)} – ${nice(r.to)}`);

/** Month calendar: tap one day, or a start day then an end day, then Apply. Future days are disabled. */
export function RangeCalendar({ value, onApply, onCancel }: { value: DayRange | null; onApply: (r: DayRange) => void; onCancel: () => void }) {
  const today = todayKey();
  const [start, setStart] = React.useState<string | null>(value?.from ?? null);
  const [end, setEnd] = React.useState<string | null>(value && value.to !== value.from ? value.to : null);
  const init = (value?.from ?? today).split('-').map(Number);
  const [view, setView] = React.useState({ y: init[0], m: init[1] - 1 });

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday first
  const days = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const title = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const canNext = key(view.y, view.m, days) < today;
  const move = (delta: number) => setView(({ y, m }) => ({ y: y + Math.floor((m + delta) / 12), m: (((m + delta) % 12) + 12) % 12 }));

  const pick = (k: string) => {
    if (!start || end) { setStart(k); setEnd(null); return; }
    if (k < start) { setEnd(start); setStart(k); } else if (k === start) setEnd(null); else setEnd(k);
  };
  const lo = start;
  const hi = end ?? start;

  return (
    <div className="w-[17.5rem]">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-navy/10 hover:text-navy" aria-label="Previous month">
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold text-navy">{title}</span>
        <button type="button" onClick={() => move(1)} disabled={!canNext} className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-navy/10 hover:text-navy disabled:opacity-30" aria-label="Next month">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-ink-soft">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <span key={d} className="py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const k = key(view.y, view.m, i + 1);
          const future = k > today;
          const edge = k === lo || k === hi;
          const inside = !!lo && !!hi && k > lo && k < hi;
          return (
            <button
              key={k}
              type="button"
              disabled={future}
              onClick={() => pick(k)}
              className={cn(
                'mx-auto grid size-9 place-items-center rounded-lg text-[13px] tabular-nums transition disabled:opacity-25',
                edge ? 'bg-navy font-semibold text-on-night' : inside ? 'rounded-none bg-gold/30 text-ink' : 'text-ink hover:bg-navy/10',
                k === today && !edge && 'ring-1 ring-gold-deep',
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <p className="mt-3 min-h-5 text-xs text-ink-soft">{lo ? rangeText({ from: lo, to: hi ?? lo }) : 'Pick a day, or a start and an end day.'}</p>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!lo} onClick={() => lo && onApply({ from: lo, to: hi ?? lo })}>Apply</Button>
      </div>
    </div>
  );
}
