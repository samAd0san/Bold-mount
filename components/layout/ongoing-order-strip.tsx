'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package } from 'lucide-react';
import { isOngoing, statusText } from '@/lib/order-view';
import { useAccount } from '@/components/auth/use-account';
import { useOrders } from '@/components/auth/use-orders';

// Child of the gate below, so no orders are fetched for signed-out visitors or on pages that already show them.
function Strip() {
  const { orders } = useOrders();
  const order = orders?.find(isOngoing);
  if (!order) return null;
  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex min-h-10 items-center justify-center gap-2 bg-navy px-5 py-2 text-[0.82rem] font-semibold text-on-night transition-colors hover:bg-night"
    >
      <Package size={15} className="shrink-0 text-gold" aria-hidden />
      <span className="min-w-0 truncate">
        Order {order.number} · {statusText(order)} — <span className="text-gold underline underline-offset-4">Track order →</span>
      </span>
    </Link>
  );
}

/** One slim line under the header for the customer's latest ongoing order; nothing while signed out, loading, or on cart and orders pages. */
export function OngoingOrderStrip() {
  const pathname = usePathname();
  const { user } = useAccount();
  if (!user || pathname === '/cart' || pathname.startsWith('/orders')) return null;
  return <Strip />;
}
