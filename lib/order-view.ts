// What the customer sees for an order: wording, dates and the rules for which actions to offer.
import { formatINR } from './format';
import { REFUND_REQUEST_DAYS, type Order, type OrderRefund, type OrderStatus } from './types';

/** Orders still on their way to the customer. */
export const ONGOING: OrderStatus[] = ['new', 'confirmed', 'dispatched'];
/** An online order whose payment never went through: nothing is on its way. */
export const unpaid = (o: Order) => o.method === 'online' && (o.payment === 'pending' || o.payment === 'failed');
export const isOngoing = (o: Order) => ONGOING.includes(o.status) && !unpaid(o);

// One label per admin status, so the customer sees exactly what the shop set.
const STATUS_LABEL: Record<OrderStatus, string> = { new: 'Placed', confirmed: 'Confirmed', dispatched: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled' };

/** "Placed", "Confirmed", "Dispatched", "Delivered", "Cancelled by you" or "Cancelled by the shop". */
export function statusText(o: Order): string {
  if (o.status !== 'cancelled' && unpaid(o)) return 'Payment not completed';
  if (o.status !== 'cancelled') return STATUS_LABEL[o.status];
  return o.cancelledBy === 'customer' ? 'Cancelled by you' : o.cancelledBy === 'shop' ? 'Cancelled by the shop' : 'Cancelled';
}

export const PAYMENT_LABEL: Record<Order['payment'], string> = {
  paid: 'Paid online',
  pending: 'Payment pending',
  failed: 'Payment failed',
  'on-whatsapp': 'Ordered on WhatsApp',
  refunded: 'Refunded',
};

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function refundText(r: OrderRefund): string {
  switch (r.status) {
    case 'refunded':
      return `Refund of ${formatINR(r.amount)} sent on ${formatDate(r.updatedAt)}. It reaches your original payment method in 5–7 working days.`;
    case 'requested':
      return `Refund requested on ${formatDate(r.requestedAt)}. We reply within 2 working days.`;
    case 'declined':
      return r.reply ? `Refund declined: ${r.reply}` : 'Refund declined.';
    case 'failed':
      return 'Your refund is being retried. We’ll update you here.';
  }
}

// A refund can be asked for once delivered and paid, until REFUND_REQUEST_DAYS after delivery.
export function canRequestRefund(o: Order, now: number): boolean {
  if (o.status !== 'delivered' || o.payment !== 'paid' || o.refund || !o.deliveredAt) return false;
  return now - new Date(o.deliveredAt).getTime() <= REFUND_REQUEST_DAYS * 86_400_000;
}

/** "Talbeenah × 2, Ajwa Dates × 1 +1 more" for a card. */
export function itemsSummary(o: Order): string {
  const shown = o.items.slice(0, 2).map((i) => `${i.name} × ${i.qty}`).join(', ');
  return o.items.length > 2 ? `${shown} +${o.items.length - 2} more` : shown;
}
