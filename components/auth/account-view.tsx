'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, PackageOpen } from 'lucide-react';
import { CANCELLABLE, REFUND_REQUEST_DAYS, type Order, type OrderRefund } from '@/lib/types';
import { formatINR } from '@/lib/format';
import { buttonClass } from '@/components/ui/button-styles';
import { Avatar } from '@/components/auth/avatar';
import { GoogleButton } from '@/components/auth/google-button';
import { CancelOrder, RequestRefund } from '@/components/auth/order-actions';
import { OrderProgress } from '@/components/auth/order-progress';
import { signInHref, signOut, useAccount } from '@/components/auth/use-account';

const CARD = 'rounded-2xl bg-pearl ring-1 ring-line ring-inset';

const PAYMENT: Record<Order['payment'], string> = {
  paid: 'Paid online',
  pending: 'Payment pending',
  failed: 'Payment failed',
  'on-whatsapp': 'Ordered on WhatsApp',
  refunded: 'Refunded',
};

const when = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function refundText(r: OrderRefund): string {
  switch (r.status) {
    case 'refunded':
      return `Refund of ${formatINR(r.amount)} sent on ${when(r.updatedAt)}. It reaches your original payment method in 5–7 working days.`;
    case 'requested':
      return `Refund requested on ${when(r.requestedAt)}. We reply within 2 working days.`;
    case 'declined':
      return r.reply ? `Refund declined: ${r.reply}` : 'Refund declined.';
    case 'failed':
      return 'Your refund is being retried. We’ll update you here.';
  }
}

// A refund can be asked for once delivered and paid, until REFUND_REQUEST_DAYS after delivery.
function canRequestRefund(o: Order, now: number): boolean {
  if (o.status !== 'delivered' || o.payment !== 'paid' || o.refund || !o.deliveredAt) return false;
  return now - new Date(o.deliveredAt).getTime() <= REFUND_REQUEST_DAYS * 86_400_000;
}

function OrderCard({ order, now, onChange }: { order: Order; now: number; onChange: (order: Order) => void }) {
  const cancellable = CANCELLABLE.includes(order.status);
  const refundable = canRequestRefund(order, now);
  return (
    <li className={`${CARD} p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="font-semibold text-ink">{order.number}</p>
        <p className="text-sm text-ink-soft">{when(order.createdAt)}</p>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-ink">
        {order.items.map((i) => (
          <li key={`${i.slug}:${i.variant}`} className="flex justify-between gap-4">
            <span className="min-w-0">
              {i.name} <span className="text-ink-soft">({i.variant}) × {i.qty}</span>
            </span>
            <span className="shrink-0 tabular-nums">{formatINR(i.price * i.qty)}</span>
          </li>
        ))}
      </ul>
      {order.status === 'cancelled' ? (
        <p className="mt-4 rounded-xl bg-sand px-4 py-3 text-sm font-medium text-ink">
          Cancelled{order.cancelledBy === 'customer' && ' by you'}
          {order.cancelledBy === 'shop' && ' by the shop'}
          {order.cancelledAt && <span className="font-normal text-ink-soft"> on {when(order.cancelledAt)}</span>}
        </p>
      ) : (
        <OrderProgress order={order} />
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <p className="text-xs font-medium">
          <span className={order.payment === 'paid' ? 'rounded-full bg-whatsapp/15 px-2.5 py-1 text-whatsapp-ink' : 'rounded-full bg-sand px-2.5 py-1 text-ink'}>
            {PAYMENT[order.payment]}
          </span>
        </p>
        <p className="text-sm text-ink-soft">
          Total <span className="ml-1 text-lg font-semibold tabular-nums text-navy">{formatINR(order.total)}</span>
        </p>
      </div>
      {order.refund && <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-sm leading-relaxed text-ink">{refundText(order.refund)}</p>}
      {(cancellable || refundable) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {cancellable && <CancelOrder order={order} onDone={onChange} />}
          {refundable && <RequestRefund order={order} onDone={onChange} />}
        </div>
      )}
    </li>
  );
}

function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [failed, setFailed] = useState(false);
  // Taken once when the page loads, so the refund window doesn't need the clock during render.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    fetch('/api/orders/mine', { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((b: { orders: Order[] }) => live && setOrders(b.orders))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const replace = (next: Order) => setOrders((list) => list && list.map((o) => (o.id === next.id ? next : o)));

  if (failed) return <p className={`${CARD} p-6 text-ink-soft`}>We couldn’t load your orders right now. Please refresh in a moment.</p>;
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
          Browse the shop
        </Link>
      </div>
    );
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} now={now} onChange={replace} />
      ))}
    </ul>
  );
}

/** My orders: a sign-in prompt when signed out, the customer's orders when signed in. */
export function AccountView() {
  const { ready, user, google } = useAccount();

  if (!ready) return <div className={`h-40 animate-pulse ${CARD}`} aria-label="Loading" />;

  if (!user) {
    return (
      <div className={`${CARD} mx-auto max-w-md px-6 py-12 text-center`}>
        <h2 className="text-2xl text-ink">Sign in to see your orders</h2>
        {google ? (
          <>
            <p className="mt-2 text-sm text-ink-soft">Use your Google account — it takes a few seconds, and your orders stay together in one place.</p>
            <GoogleButton href={signInHref('/account')} className="mt-6" />
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">Sign-in isn’t available right now. Please try again in a little while.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${CARD} flex flex-wrap items-center gap-4 p-5`}>
        <Avatar user={user} size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{user.name || 'Your account'}</p>
          <p className="truncate text-sm text-ink-soft">{user.email}</p>
        </div>
        <button type="button" onClick={() => void signOut()} className={buttonClass('outline', 'py-2.5')}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
      <div>
        <h2 className="text-xl text-ink">My orders</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Cancel an order before it is dispatched, or ask for a refund after delivery.{' '}
          <Link href="/policies/refund-cancellation" className="font-semibold text-navy underline underline-offset-4">
            Refund & Cancellation policy
          </Link>
        </p>
      </div>
      <Orders />
    </div>
  );
}
