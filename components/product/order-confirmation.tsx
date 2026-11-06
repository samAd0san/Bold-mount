'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { Order } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { unpaid } from '@/lib/order-view';
import { whatsappLink } from '@/lib/whatsapp';
import { buttonClass } from '@/components/ui/button-styles';
import { useOrders } from '@/components/auth/use-orders';

/** Shown after an order is placed (paid online, or cash on delivery), in place of the cart. An online payment we couldn't confirm yet says so, then turns into "received" by itself. */
export function OrderConfirmation({ order }: { order: Order }) {
  const ref = useRef<HTMLDivElement>(null);
  const { orders } = useOrders(unpaid(order));
  // Only an unconfirmed payment looks for a newer copy; a paid order is final, so a stale list can't turn it back.
  const waiting = unpaid(unpaid(order) ? (orders?.find((o) => o.id === order.id) ?? order) : order);
  const cod = order.method === 'cod';
  // The form was far down the page; bring the confirmation into view.
  // Braces matter: newer browsers return a Promise from scrollIntoView, which React rejects as a cleanup.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'start' });
  }, []);
  return (
    <div ref={ref} role="status" className="mx-auto max-w-xl scroll-mt-36 rounded-2xl bg-pearl px-6 py-12 text-center ring-1 ring-line ring-inset md:py-14">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-whatsapp/15 text-whatsapp-ink">
        {waiting ? <Loader2 size={30} className="animate-spin" /> : <CheckCircle2 size={30} />}
      </span>
      <h2 className="mt-5 text-2xl text-ink">{waiting ? 'Confirming your payment' : cod ? 'Order placed — thank you!' : 'Payment received — thank you!'}</h2>
      <p className="mx-auto mt-2 max-w-sm leading-relaxed text-ink-soft">
        {waiting
          ? `Payment received by Razorpay — we’re confirming it. This page updates by itself; if it still says pending after a few minutes, message us with order ${order.number}.`
          : 'Your order is placed, in shā’ Allāh.'}
      </p>

      <dl className="mx-auto mt-7 max-w-xs divide-y divide-line rounded-xl bg-cream text-sm ring-1 ring-line ring-inset">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-ink-soft">Order number</dt>
          <dd className="font-semibold text-ink">{order.number}</dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-ink-soft">{cod ? 'To pay in cash' : waiting ? 'Total' : 'Total paid'}</dt>
          <dd className="font-semibold tabular-nums text-navy">{formatINR(order.total)}</dd>
        </div>
      </dl>

      {cod && <p className="mx-auto mt-6 max-w-sm leading-relaxed font-medium text-ink">You’ll pay {formatINR(order.total)} in cash when your order arrives.</p>}
      {!waiting && (
        <p className={`mx-auto max-w-sm leading-relaxed text-ink-soft ${cod ? 'mt-3' : 'mt-6'}`}>
          We’ll call or WhatsApp you on {order.customer.mobile} to confirm delivery.
        </p>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className={buttonClass('gold')}>
          Continue shopping
        </Link>
        <Link href={`/orders/${order.id}`} className={buttonClass('outline')}>
          Track this order
        </Link>
        {waiting && (
          <a
            href={whatsappLink(`Assalamu alaikum Bold Mount, I paid for order ${order.number} but it still says pending.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass('outline')}
          >
            Message us on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
