'use client';

import Link from 'next/link';
import { LogOut, PackageOpen } from 'lucide-react';
import type { Order } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { cashDue, formatDate, isOngoing, itemsSummary, paymentText, refundText, statusText } from '@/lib/order-view';
import { buttonClass } from '@/components/ui/button-styles';
import { Avatar } from '@/components/auth/avatar';
import { OrderProgress } from '@/components/auth/order-progress';
import { ORDER_CARD as CARD, SignInPrompt } from '@/components/auth/order-parts';
import { signOut, useAccount } from '@/components/auth/use-account';
import { useOrders } from '@/components/auth/use-orders';

function OngoingCard({ order }: { order: Order }) {
  return (
    <li className={`${CARD} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p id={`${order.id}-number`} className="font-semibold text-ink">{order.number}</p>
        <p className="text-sm text-ink-soft">{formatDate(order.createdAt)}</p>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{itemsSummary(order)}</p>
      <p className="mt-4 text-sm font-semibold text-ink">Status: {statusText(order)}</p>
      {cashDue(order) && <p className="mt-1 text-sm text-ink-soft">Cash on delivery: pay {formatINR(order.total)} in cash when it arrives.</p>}
      <OrderProgress order={order} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm text-ink-soft">
          Total <span className="ml-1 text-lg font-semibold tabular-nums text-navy">{formatINR(order.total)}</span>
        </p>
        <Link href={`/orders/${order.id}`} aria-describedby={`${order.id}-number`} className={buttonClass('gold', 'min-h-11')}>
          Track order
        </Link>
      </div>
    </li>
  );
}

function HistoryRow({ order }: { order: Order }) {
  const at = order.status === 'cancelled' ? order.cancelledAt : order.deliveredAt;
  return (
    <li className={`${CARD} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p id={`${order.id}-number`} className="font-semibold text-ink">{order.number}</p>
          <p className="text-xs text-ink-soft">{formatDate(order.createdAt)}</p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums text-navy">{formatINR(order.total)}</p>
      </div>
      <p className="mt-2 text-sm font-medium text-ink">
        {statusText(order)}
        {at && <span className="font-normal text-ink-soft"> on {formatDate(at)}</span>}
      </p>
      {order.method === 'cod' && <p className="mt-1 text-sm text-ink-soft">{paymentText(order)}</p>}
      {order.refund && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{refundText(order.refund)}</p>}
      <Link href={`/orders/${order.id}`} aria-describedby={`${order.id}-number`} className="mt-1 -mb-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline underline-offset-4">
        View
      </Link>
    </li>
  );
}

function Orders() {
  const { orders, failed } = useOrders(true);

  if (!orders && failed) return <p className={`${CARD} p-6 text-ink-soft`}>We couldn’t load your orders right now. Please refresh in a moment.</p>;
  if (!orders) return <div className={`h-40 animate-pulse ${CARD}`} aria-label="Loading your orders" />;
  if (!orders.length)
    return (
      <div className={`${CARD} px-6 py-12 text-center`}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand text-navy">
          <PackageOpen size={24} />
        </span>
        <p className="mt-4 text-ink">No orders yet</p>
        <p className="mt-1 text-sm text-ink-soft">Orders you place while signed in will show up here.</p>
        <Link href="/shop" className={buttonClass('gold', 'mt-6')}>
          Start shopping
        </Link>
      </div>
    );

  const ongoing = orders.filter(isOngoing);
  const history = orders.filter((o) => !isOngoing(o));
  return (
    <div className="space-y-8">
      {ongoing.length > 0 && (
        <section aria-labelledby="ongoing-title">
          <h2 id="ongoing-title" className="mb-3 text-xl text-ink">Ongoing</h2>
          <ul className="space-y-4">
            {ongoing.map((o) => (
              <OngoingCard key={o.id} order={o} />
            ))}
          </ul>
        </section>
      )}
      {history.length > 0 && (
        <section aria-labelledby="history-title">
          <h2 id="history-title" className="mb-3 text-xl text-ink">Order history</h2>
          <ul className="space-y-3">
            {history.map((o) => (
              <HistoryRow key={o.id} order={o} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Home of the customer's orders: sign-in prompt when signed out; otherwise a small account bar, ongoing orders and order history. */
export function AccountView() {
  const { ready, user, google } = useAccount();

  if (!ready) return <div className={`h-40 animate-pulse ${CARD}`} aria-label="Loading" />;
  if (!user) return <SignInPrompt next="/orders" google={google} />;

  return (
    <div className="space-y-6">
      <div className={`${CARD} flex items-center gap-3 p-4`}>
        <Avatar user={user} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{user.name || 'Your account'}</p>
          <p className="truncate text-sm text-ink-soft">{user.email}</p>
        </div>
        <button type="button" onClick={() => void signOut()} className={buttonClass('outline', 'min-h-11 py-2')}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
      <p className="text-sm text-ink-soft">
        Cancel an order before it is dispatched, or ask for a refund after delivery. Cancelling turns off cash on delivery for your account.{' '}
        <Link href="/policies/refund-cancellation" className="font-semibold text-navy underline underline-offset-4">
          Refund & Cancellation policy
        </Link>
      </p>
      <Orders />
    </div>
  );
}
