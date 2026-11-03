'use client';

import * as React from 'react';
import Image from 'next/image';
import { Delete, Loader2, Lock } from 'lucide-react';
import { adminFetch, type ApiError } from '@/components/admin/api';
import { BRAND } from '@/lib/media';
import { cn } from '@/lib/utils';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

/** Full-screen PIN pad; works by tap and keyboard and submits on the last digit. */
export function PinScreen({ length, onDone }: { length: number; onDone: () => Promise<void> }) {
  const [pin, setPin] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [locked, setLocked] = React.useState(false);

  const submit = async (value: string) => {
    setBusy(true);
    try {
      await adminFetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ pin: value }) });
      await onDone();
      return;
    } catch (err) {
      const e = err as ApiError;
      const left = e.body?.left;
      const wait = e.body?.waitMinutes;
      let msg = e.message;
      if (typeof left === 'number' && !/left/i.test(msg)) msg += ` ${left} ${left === 1 ? 'try' : 'tries'} left.`;
      if (typeof wait === 'number' && !/minute/i.test(msg)) msg += ` Wait ${wait} minute${wait === 1 ? '' : 's'}.`;
      setError(msg);
      setPin('');
      if (e.status === 429) {
        setLocked(true);
        const mins = typeof wait === 'number' ? wait : Number(msg.match(/(\d+) minute/)?.[1] ?? 10);
        window.setTimeout(() => { setLocked(false); setError(null); }, Math.max(1, mins) * 60_000);
      }
    }
    setBusy(false);
  };

  const press = (k: string) => {
    if (busy || locked) return;
    if (k === 'back') return setPin(pin.slice(0, -1));
    if (!/^\d$/.test(k) || pin.length >= length) return;
    const next = pin + k;
    setPin(next);
    setError(null);
    if (next.length === length) void submit(next);
  };

  const onKey = React.useEffectEvent((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('back');
  });
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border bg-pearl px-6 pt-8 pb-7 text-center shadow-card">
        <Image src={BRAND.logoHeader} alt="Bold Mount" width={235} height={128} unoptimized priority className="h-14 w-auto" />
        <p className="eyebrow mt-4">Admin</p>
        <h1 className="mt-1 text-2xl text-navy">Enter your PIN</h1>
        <p className="mt-1 text-sm text-ink-soft">Type it or tap the numbers.</p>

        <div className="mt-6 flex h-6 items-center gap-4" role="status" aria-label={`${pin.length} of ${length} digits entered`}>
          {busy ? (
            <Loader2 className="size-5 animate-spin text-navy/60" />
          ) : (
            Array.from({ length }, (_, i) => (
              <span key={i} className={cn('size-4 rounded-full border-2 transition-colors', i < pin.length ? 'border-navy bg-navy' : error ? 'border-red-700/50' : 'border-navy/30')} />
            ))
          )}
        </div>

        <p role="alert" className={cn('mt-4 flex min-h-10 items-start justify-center gap-1.5 text-sm font-medium', locked ? 'text-amber-800' : 'text-red-700')}>
          {locked && <Lock className="mt-0.5 size-3.5 shrink-0" />}
          {error}
        </p>

        <div className="mt-2 grid grid-cols-3 gap-x-5 gap-y-3">
          {KEYS.map((k, i) =>
            k === '' ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => press(k)}
                disabled={busy || locked || (k === 'back' && !pin)}
                aria-label={k === 'back' ? 'Delete last digit' : k}
                className={cn(
                  'grid size-[4.25rem] place-items-center rounded-full text-2xl font-semibold text-navy transition select-none active:scale-95 disabled:opacity-40',
                  k === 'back' ? 'text-ink-soft hover:bg-navy/5' : 'border bg-white hover:bg-gold/20 active:bg-gold/40',
                )}
              >
                {k === 'back' ? <Delete className="size-6" /> : k}
              </button>
            ),
          )}
        </div>
      </div>
    </main>
  );
}
