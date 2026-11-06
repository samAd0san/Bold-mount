'use client';

import * as React from 'react';
import { ChevronRight, Monitor, Smartphone, Tablet, type LucideIcon } from 'lucide-react';
import { adminFetch, SignedOut, useFetch } from '@/components/admin/api';
import { n } from '@/components/admin/dash-parts';
import { PeriodBar, usePeriod, usePolled } from '@/components/admin/period';
import { Badge, Button, Card, Empty, ErrorNote, Modal, PageHead, Skeleton } from '@/components/admin/ui';
import type { Device } from '@/lib/server/analytics';
import type { OutcomeKey, Step, StepKind, VisitorRow } from '@/lib/server/visitors';
import { useLive } from '@/lib/live';
import { cn } from '@/lib/utils';

export type VisitorPage = { visitors: VisitorRow[]; total: number; more: boolean };

export const DEVICES: Record<Device, { label: string; icon: LucideIcon }> = {
  mobile: { label: 'Phone', icon: Smartphone },
  tablet: { label: 'Tablet', icon: Tablet },
  desktop: { label: 'Computer', icon: Monitor },
};

const TZ = 'Asia/Kolkata';
const dayFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-IN', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });
const day = (iso: string) => dayFmt.format(new Date(iso));
const time = (iso: string) => timeFmt.format(new Date(iso)).replace(/ /g, ' ');

/** "Thu, 6 Nov, 10:42 am – 10:48 am", or both dates when the visit crossed midnight. */
function whenText(first: string, last: string) {
  if (day(first) !== day(last)) return `${day(first)}, ${time(first)} – ${day(last)}, ${time(last)}`;
  return time(first) === time(last) ? `${day(first)}, ${time(first)}` : `${day(first)}, ${time(first)} – ${time(last)}`;
}

const TONES: Record<OutcomeKey, 'gray' | 'amber' | 'blue' | 'gold' | 'green' | 'red'> = {
  looked: 'gray',
  cart: 'amber',
  checkout: 'blue',
  placed: 'gold',
  paid: 'green',
  failed: 'red',
};

const sourceText = (s: VisitorRow['source']) => (!s ? 'Where they came from isn’t known' : s.direct ? s.label : `From ${s.label}`);

/** Short facts in one line; when it is too narrow the line breaks between facts, never in the middle of one. */
function Dots({ items, className }: { items: string[]; className?: string }) {
  return (
    <span className={cn('flex flex-wrap gap-x-1.5 text-ink-soft', className)}>
      {items.filter(Boolean).map((t, i) => (
        <React.Fragment key={t}>
          {i > 0 && <span aria-hidden>·</span>}
          <span className="max-w-full truncate">{t}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

/** The visitors as tappable rows; tapping one opens that person's journey. */
export function VisitorList({ rows, query }: { rows: VisitorRow[]; query: string }) {
  const [open, setOpen] = React.useState<VisitorRow | null>(null);
  return (
    <>
      <ul aria-label="Visitors">
        {rows.map((r) => {
          const Icon = DEVICES[r.device].icon;
          return (
            <li key={r.id} className="border-b border-line/60 last:border-0">
              <button
                type="button"
                onClick={() => setOpen(r)}
                className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-navy/[0.05] focus-visible:outline-2 focus-visible:outline-gold"
              >
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-navy/[0.07] text-navy">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-ink">{r.label}</span>
                    <Badge tone={TONES[r.outcome.key]}>{r.outcome.text}</Badge>
                  </span>
                  <Dots className="mt-0.5 text-[13px]" items={[DEVICES[r.device].label, sourceText(r.source)]} />
                  <Dots className="text-[13px]" items={[`${n(r.pages)} ${r.pages === 1 ? 'page' : 'pages'} opened`, r.lastPage !== '—' ? `last page: ${r.lastPage}` : '']} />
                  <Dots className="text-xs" items={[whenText(r.first, r.last)]} />
                </span>
                <ChevronRight className="mt-3 size-4 shrink-0 text-ink-soft" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <Journey row={open} query={query} onClose={() => setOpen(null)} />
    </>
  );
}

const DOTS: Record<StepKind, string> = {
  start: 'bg-ink-soft/50',
  page: 'bg-navy',
  search: 'bg-sky-500',
  cart: 'bg-amber-500',
  checkout: 'bg-sky-600',
  order: 'bg-gold-deep',
  paid: 'bg-emerald-600',
  failed: 'bg-red-600',
  cancelled: 'bg-red-400',
  refund: 'bg-orange-500',
};

function Journey({ row, query, onClose }: { row: VisitorRow | null; query: string; onClose: () => void }) {
  const { data, loading, error } = useFetch<{ steps: Step[] }>(row ? `/api/admin/stats/journey?${query}&vid=${row.id}` : null);
  // Group by day so a visitor who came back later reads as separate days.
  const days = new Map<string, Step[]>();
  for (const s of data?.steps ?? []) days.set(day(s.at), [...(days.get(day(s.at)) ?? []), s]);
  const lastKey = [...days.keys()].pop();

  return (
    <Modal
      open={!!row}
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={row?.label ?? 'Visitor'}
      description={row ? `${DEVICES[row.device].label} · ${sourceText(row.source)} · ${n(row.pages)} ${row.pages === 1 ? 'page' : 'pages'} opened` : undefined}
    >
      {row && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-ink">{row.outcome.text}</p>
          {error && <ErrorNote>{error}</ErrorNote>}
          {loading && !error && <Skeleton rows={3} className="h-12" />}
          {!loading && data && !data.steps.length && <Empty>Nothing was recorded for this visitor.</Empty>}
          {!loading && [...days.entries()].map(([d, steps]) => (
            <section key={d} aria-label={d}>
              <h3 className="mb-2 text-[13px] font-semibold text-ink-soft">{d}</h3>
              <ol>
                {steps.map((s, i) => {
                  const end = d === lastKey && i === steps.length - 1;
                  return (
                    <li key={`${s.at}-${i}`} className="grid grid-cols-[4.5rem_0.75rem_minmax(0,1fr)] gap-x-3">
                      <span className="pt-0.5 text-right text-xs whitespace-nowrap text-ink-soft tabular-nums">{time(s.at)}</span>
                      <span className="relative flex justify-center" aria-hidden>
                        <span className={cn('mt-1.5 size-2.5 rounded-full', DOTS[s.kind])} />
                        {!end && <span className="absolute top-4.5 -bottom-0.5 w-px bg-line" />}
                      </span>
                      <div className="pb-3.5">
                        <p className={cn('text-sm break-words text-ink', s.kind === 'start' ? 'text-ink-soft' : 'font-medium')}>{s.text}</p>
                        {s.detail && <p className="text-xs break-words text-ink-soft">{s.detail}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </Modal>
  );
}

/** One line under the page title: visits are only counted for people who accepted the cookie notice. */
export const CountNote = () => <p className="-mt-2 text-[13px] text-ink-soft">Only visitors who pressed OK on the cookie notice are counted.</p>;

/** The Visitors page: everyone in the chosen period, newest first, 20 at a time. */
export function Visitors() {
  const p = usePeriod();
  const base = `/api/admin/stats/visitors?${p.query}`;
  const first = usePolled<VisitorPage>(`${base}&page=0&size=20`);
  const [extra, setExtra] = React.useState<{ query: string; rows: VisitorRow[]; page: number; more: boolean } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [moreError, setMoreError] = React.useState<string | null>(null);
  useLive('admin', (name) => { if (name !== 'form') first.reload(); });

  const mine = extra?.query === p.query ? extra : null;
  const seen = new Set((first.data?.visitors ?? []).map((v) => v.id));
  const rows = [...(first.data?.visitors ?? []), ...(mine?.rows ?? []).filter((v) => !seen.has(v.id))];
  const hasMore = mine ? mine.more : !!first.data?.more;

  const showMore = async () => {
    const page = (mine?.page ?? 0) + 1;
    setBusy(true);
    setMoreError(null);
    try {
      const res = await adminFetch<VisitorPage>(`${base}&page=${page}&size=20`);
      setExtra({ query: p.query, rows: [...(mine?.rows ?? []), ...res.visitors], page, more: res.more });
    } catch (e) {
      if (!(e instanceof SignedOut)) setMoreError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <PageHead title="Visitors" sub="Everyone who opened your shop, newest first. Tap a visitor to see the pages they looked at." />
      <CountNote />
      <PeriodBar p={p} />
      {first.error && !first.data && <ErrorNote onRetry={first.reload}>{first.error}</ErrorNote>}
      <Card className={cn('transition-opacity', first.loading && first.data && 'opacity-55')}>
        {!first.data ? (
          <Skeleton rows={4} className="h-16" />
        ) : !rows.length ? (
          <Empty>No visitors {p.word}. When someone opens your shop, they will appear here with the pages they looked at.</Empty>
        ) : (
          <>
            <p className="mb-1 text-[13px] text-ink-soft">{n(first.data.total)} {first.data.total === 1 ? 'visitor' : 'visitors'} {p.word}</p>
            <VisitorList rows={rows} query={p.query} />
            {moreError && <div className="mt-3"><ErrorNote>{moreError}</ErrorNote></div>}
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" busy={busy} onClick={showMore}>Show more visitors</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
