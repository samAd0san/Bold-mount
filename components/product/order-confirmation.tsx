'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { Order } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { buttonClass } from '@/components/ui/button-styles';

/** Shown after a successful online payment, in place of the cart. */
export function OrderConfirmation({ order }: { order: Order }) {
  const ref = useRef<HTMLDivElement>(null);
  // The form was far down the page; bring the confirmation into view.
  // Braces matter: newer browsers return a Promise from scrollIntoView, which React rejects as a cleanup.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'start' });
  }, []);
  return (
    <div ref={ref} role="status" className="mx-auto max-w-xl scroll-mt-36 rounded-2xl bg-pearl px-6 py-12 text-center ring-1 ring-line ring-inset md:py-14">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-whatsapp/15 text-whatsapp-ink">
        <CheckCircle2 size={30} />
      </span>
      <h2 className="mt-5 text-2xl text-ink">Payment received — thank you!</h2>
      <p className="mt-2 text-ink-soft">Your order is placed, in shā’ Allāh.</p>

      <dl className="mx-auto mt-7 max-w-xs divide-y divide-line rounded-xl bg-cream text-sm ring-1 ring-line ring-inset">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-ink-soft">Order number</dt>
          <dd className="font-semibold text-ink">{order.number}</dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-ink-soft">Total paid</dt>
          <dd className="font-semibold tabular-nums text-navy">{formatINR(order.total)}</dd>
        </div>
      </dl>

      <p className="mx-auto mt-6 max-w-sm leading-relaxed text-ink-soft">
        We’ll call or WhatsApp you on {order.customer.mobile} to confirm delivery.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={buttonClass('gold')}>
          Continue shopping
        </Link>
        <Link href="/account" className={buttonClass('outline')}>
          Track it in My orders
        </Link>
      </div>
    </div>
  );
}
