import { Check } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STEPS: { label: string; date: (o: Order) => string | undefined }[] = [
  { label: 'Placed', date: (o) => o.createdAt },
  { label: 'Confirmed', date: () => undefined },
  { label: 'Dispatched', date: (o) => o.dispatchedAt },
  { label: 'Delivered', date: (o) => o.deliveredAt },
];

// Index of the latest step each status has reached.
const REACHED: Record<OrderStatus, number> = { new: 0, confirmed: 1, dispatched: 2, delivered: 3, cancelled: -1 };

const short = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Placed → Confirmed → Dispatched → Delivered as four small dots on a line; fits a 360px phone. */
export function OrderProgress({ order }: { order: Order }) {
  const at = REACHED[order.status];
  return (
    <ol aria-label="Order progress" className="mt-4 grid grid-cols-4">
      {STEPS.map((step, i) => {
        const reached = i <= at;
        const current = i === at;
        const date = step.date(order);
        return (
          <li key={step.label} aria-current={current ? 'step' : undefined} className="relative flex min-w-0 flex-col items-center text-center">
            {i > 0 && <span aria-hidden className={cn('absolute top-3 right-1/2 h-0.5 w-full -translate-y-1/2', reached ? 'bg-navy' : 'bg-sand')} />}
            <span
              aria-hidden
              className={cn(
                'relative z-10 grid size-6 place-items-center rounded-full',
                current ? 'bg-gold text-night ring-4 ring-gold/25' : reached ? 'bg-navy text-on-night' : 'bg-sand',
              )}
            >
              {reached && <Check size={13} strokeWidth={3} />}
            </span>
            <span className={cn('mt-1.5 text-xs', reached ? 'font-semibold text-ink' : 'text-ink-soft')}>{step.label}</span>
            <span className="min-h-4 text-[11px] tabular-nums text-ink-soft">{date ? short(date) : ''}</span>
          </li>
        );
      })}
    </ol>
  );
}
