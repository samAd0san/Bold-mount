'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CANCELLABLE } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { canRequestRefund, cashDue, formatDate, refundText } from '@/lib/order-view';
import { whatsappLink } from '@/lib/whatsapp';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { CancelOrder, RequestRefund } from '@/components/auth/order-actions';
import { OrderTimeline } from '@/components/auth/order-progress';
import { ORDER_CARD as CARD, PaymentPill, SignInPrompt } from '@/components/auth/order-parts';
import { useAccount } from '@/components/auth/use-account';
import { replaceOrder, useOrders } from '@/components/auth/use-orders';

const BACK = (
  <Link href="/orders" className={buttonClass('outline', 'mt-6')}>
    Back to your orders
  </Link>
);

/** One order in full: live status timeline, items and totals, delivery address, payment and refund, plus cancel / refund actions. */
export function TrackOrderView({ id }: { id: string }) {
  const { ready, user, google } = useAccount();
  const { orders, failed, updatedAt } = useOrders(true);
  // Until a fetch has finished since this page opened, a missing order may just be a stale list.
  const [openedAt] = useState(() => Date.now());

  if (!ready) return <div className={`h-60 animate-pulse ${CARD}`} aria-label="Loading" />;
  if (!user) return <SignInPrompt next={`/orders/${id}`} google={google} />;

  const order = orders?.find((o) => o.id === id);
  if (!order) {
    if (orders && updatedAt >= openedAt) {
      return (
        <div className={`${CARD} px-6 py-12 text-center`}>
          <p className="text-ink">We couldn&apos;t find this order in your account</p>
          <p className="mt-1 text-sm text-ink-soft">It may belong to a different Google account.</p>
          {BACK}
        </div>
      );
    }
    if (failed) return <p className={`${CARD} p-6 text-ink-soft`}>We couldn’t load your order right now. Please refresh in a moment.</p>;
    return <div className={`h-60 animate-pulse ${CARD}`} aria-label="Loading your order" />;
  }

  const { customer } = order;
  const mapLink = /^https?:\/\//.test(customer.address);
  const cancellable = CANCELLABLE.includes(order.status);
  const refundable = canRequestRefund(order, openedAt);
  return (
    <div className="space-y-5">
      <section aria-label="Order status" className={`${CARD} p-5 md:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 className="text-xl text-ink">{order.number}</h2>
          <p className="text-sm text-ink-soft">Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className="mt-5 border-t border-line pt-5">
          <OrderTimeline order={order} />
        </div>
      </section>

      <section aria-labelledby="items-title" className={`${CARD} p-5 md:p-6`}>
        <h2 id="items-title" className="text-lg text-ink">Items</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink">
          {order.items.map((i) => (
            <li key={`${i.slug}:${i.variant}`} className="flex justify-between gap-4">
              <span className="min-w-0">
                {i.name} <span className="text-ink-soft">{i.variant && `(${i.variant}) `}× {i.qty}</span>
              </span>
              <span className="shrink-0 tabular-nums">{formatINR(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="tabular-nums text-ink">{formatINR(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Delivery</dt>
            <dd className={order.delivery ? 'tabular-nums text-ink' : 'font-medium text-whatsapp-ink'}>{order.delivery ? formatINR(order.delivery) : 'Free'}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <dt className="text-base font-semibold text-ink">Total</dt>
            <dd className="text-xl font-semibold tabular-nums text-navy">{formatINR(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="address-title" className={`${CARD} p-5 md:p-6`}>
        <h2 id="address-title" className="text-lg text-ink">Delivery address</h2>
        <address className="mt-3 text-sm leading-relaxed text-ink not-italic [overflow-wrap:anywhere]">
          <p className="font-medium">{customer.name}</p>
          <p className="text-ink-soft">{customer.mobile}</p>
          {mapLink ? (
            <a href={customer.address} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline underline-offset-4">
              Shared location (open in Maps)
            </a>
          ) : (
            <p>{customer.address}</p>
          )}
          <p>
            {customer.city} – {customer.pincode}
          </p>
          {customer.note && <p className="mt-2 text-ink-soft">Note: {customer.note}</p>}
        </address>
      </section>

      <section aria-labelledby="payment-title" className={`${CARD} p-5 md:p-6`}>
        <h2 id="payment-title" className="text-lg text-ink">Payment</h2>
        <p className="mt-3">
          <PaymentPill order={order} />
        </p>
        {cashDue(order) && <p className="mt-3 text-sm leading-relaxed text-ink">Please keep {formatINR(order.total)} ready in cash. You pay it when your order arrives.</p>}
        {order.refund && <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-sm leading-relaxed text-ink">{refundText(order.refund)}</p>}
        {(cancellable || refundable) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {cancellable && <CancelOrder order={order} onDone={replaceOrder} />}
            {refundable && <RequestRefund order={order} onDone={replaceOrder} />}
          </div>
        )}
      </section>

      <a
        href={whatsappLink(`Assalamu alaikum Bold Mount, I have a question about my order ${order.number}.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-14 items-center gap-3 rounded-2xl bg-whatsapp/10 px-5 py-3 text-sm font-semibold text-whatsapp-ink transition-colors hover:bg-whatsapp/20"
      >
        <WhatsAppGlyph size={20} className="shrink-0" />
        Questions about this order? Message us on WhatsApp
      </a>
    </div>
  );
}
