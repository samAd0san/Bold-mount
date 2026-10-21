'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Pill −/+ quantity control; minus is disabled at `min` (use a separate remove button). */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = 'Quantity',
  className,
}: {
  value: number;
  onChange: (qty: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const btn =
    'flex h-full w-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-ink disabled:opacity-35 disabled:hover:text-ink-soft';
  return (
    <div role="group" aria-label={label} className={cn('inline-flex h-11 items-center rounded-full border border-line bg-pearl', className)}>
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className={btn}>
        <Minus size={15} />
      </button>
      <span aria-live="polite" className="min-w-7 text-center text-sm font-semibold tabular-nums text-ink">
        {value}
      </span>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} className={btn}>
        <Plus size={15} />
      </button>
    </div>
  );
}
