import 'server-only';
import { z } from 'zod';
import { db } from '@/lib/server/db';
import { CategoryModel, OrderModel, ProductModel } from '@/lib/server/models';
import { capturedPayment, razorpayReady, refundPayment } from '@/lib/server/razorpay';
import { deliveryFor } from '@/lib/shop';
import { PAYMENT_CHECK_DAYS, type OrderItem, type OrderStatus } from '@/lib/types';

// Indian mobile → "+91 98480 22338"; accepts spaces, dashes, +91, 91 or 0 in front.
function cleanMobile(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : null;
}

const Customer = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(80),
  mobile: z.string().trim().transform((v, ctx) => {
    const m = cleanMobile(v);
    if (!m) ctx.addIssue({ code: 'custom', message: 'Please enter a valid 10-digit mobile number.' });
    return m ?? v;
  }),
  address: z.string().trim().min(5, 'Please enter your full address.').max(300),
  city: z.string().trim().min(2, 'Please enter your city.').max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Please enter a 6-digit pincode.'),
  note: z.string().trim().max(500).optional().default(''),
  location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
});

export const OrderBody = z.object({
  method: z.enum(['online', 'cod'], 'Please choose how to pay.'),
  items: z
    .array(z.object({
      slug: z.string().trim().min(1).max(80),
      variantId: z.string().trim().min(1).max(60),
      qty: z.number('Quantity must be a number.').int().min(1, 'Quantity must be at least 1.').max(50, 'You can order up to 50 of one item.'),
    }))
    .min(1, 'Your cart is empty.')
    .max(40, 'That is too many different items for one order.'),
  customer: Customer,
});

/** Shown at checkout and returned by the API when cash on delivery is switched off for a customer. */
export const COD_OFF = 'Cash on delivery isn’t available on your account because an earlier order was cancelled. You can pay online.';

/** The one rule for who may pay cash on delivery: nobody who has ever cancelled one of their own orders. */
export async function codAllowed(userId: string): Promise<boolean> {
  return !(await OrderModel.exists({ userId, status: 'cancelled', cancelledBy: 'customer' }));
}

/** Delivered means the cash was collected: marks a cash-on-delivery order paid. Returns the updated order, or null when nothing changed. */
export async function settleCash(order: { _id: unknown; method?: string | null; payment?: string | null }, status: OrderStatus) {
  if (order.method !== 'cod' || order.payment !== 'cod' || status !== 'delivered') return null;
  return OrderModel.findByIdAndUpdate(order._id, { $set: { payment: 'paid', paidAt: new Date() } }, { returnDocument: 'after' }).lean();
}

export type PricedCart = { items: OrderItem[]; subtotal: number; delivery: number; total: number };

/** Builds the order lines from the live catalog; prices, names and photos always come from the database, never the client. */
export async function priceCart(lines: { slug: string; variantId: string; qty: number }[]): Promise<PricedCart | { error: string }> {
  const wanted = new Map<string, number>(); // "slug|variantId" → qty (same line twice = one line)
  for (const l of lines) wanted.set(`${l.slug}|${l.variantId}`, (wanted.get(`${l.slug}|${l.variantId}`) ?? 0) + l.qty);

  const slugs = [...new Set(lines.map((l) => l.slug))];
  const [products, categories] = await Promise.all([
    ProductModel.find({ slug: { $in: slugs }, active: true }).lean(),
    CategoryModel.find({ active: true }, { slug: 1 }).lean(),
  ]);
  const live = new Set(categories.map((c) => c.slug));
  const bySlug = new Map(products.filter((p) => live.has(p.category)).map((p) => [p.slug, p]));

  const items: OrderItem[] = [];
  for (const [key, qty] of wanted) {
    const [slug, variantId] = key.split('|');
    const product = bySlug.get(slug);
    if (!product) return { error: 'One of the items in your cart is no longer available. Please refresh and try again.' };
    const variant = product.variants.find((v) => v.id === variantId);
    const price = variant?.price ?? 0;
    if (!variant || !(price > 0)) return { error: `The size you chose for ${product.name} is no longer available.` };
    const image = product.images[0]?.src;
    items.push({ slug, name: product.name, variant: variant.label ?? variantId, price, qty, ...(image ? { image } : {}) });
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = deliveryFor(subtotal);
  return { items, subtotal, delivery, total: subtotal + delivery };
}

/** Next order number: BM-1001, BM-1002… from one counter doc. */
export async function nextOrderNumber(): Promise<string> {
  const counters = (await db()).collection<{ _id: string; seq: number }>('counters');
  // Seeding is a separate step so the first order is 1001; a racing duplicate-key error just means someone else seeded it.
  await counters.updateOne({ _id: 'order' }, { $setOnInsert: { seq: 1000 } }, { upsert: true }).catch((e: { code?: number }) => {
    if (e?.code !== 11000) throw e;
  });
  const doc = await counters.findOneAndUpdate({ _id: 'order' }, { $inc: { seq: 1 } }, { returnDocument: 'after' });
  if (!doc) throw new Error('Order counter missing');
  return `BM-${doc.seq}`;
}

type RefundInfo = { reason: string; note?: string; reply?: string; requestedAt: Date };

/** The "customer asked for a refund" record, shared by the refund request and by cancelling an order already paid in cash. */
export const refundRequest = (reason: string, note: string | undefined, amount: number, at: Date) => ({
  status: 'requested', reason, ...(note ? { note } : {}), amount, requestedAt: at, updatedAt: at,
});

const REFUND_CLAIM_MS = 60_000;

/**
 * Refunds `amount` of a paid order: online goes back through Razorpay, cash on delivery is only recorded (the shop pays by hand). Returns the updated order;
 * `error` says why nothing was sent: `refused` = already refunded or in progress, else Razorpay's reason (the order stays paid, refund "failed").
 */
export async function refundOrder(
  order: { _id: unknown; number: string; method?: string | null; razorpayPaymentId?: string | null },
  amount: number,
  info: RefundInfo,
) {
  const base = {
    reason: info.reason, ...(info.note ? { note: info.note } : {}), ...(info.reply ? { reply: info.reply } : {}),
    amount, requestedAt: info.requestedAt, updatedAt: new Date(),
  };
  const byHand = order.method === 'cod';
  // Only one request may send a refund: a double tap or a second tab finds the order claimed. A claim over a minute old belongs to a crashed request.
  const claimed = await OrderModel.findOneAndUpdate(
    { _id: order._id, payment: 'paid', $or: [{ refundingAt: null }, { refundingAt: { $lt: new Date(Date.now() - REFUND_CLAIM_MS) } }] },
    { $set: { refundingAt: new Date() } },
    { projection: { _id: 1 } },
  ).lean();
  if (!claimed) return { doc: await OrderModel.findById(order._id).lean(), error: 'This order has already been refunded, or its refund is on the way.', refused: true };

  let refundId = '';
  if (!byHand) {
    try {
      refundId = (await refundPayment(order.razorpayPaymentId ?? '', amount, order.number)).id;
    } catch (e) {
      const doc = await OrderModel.findByIdAndUpdate(order._id, { $set: { refund: { ...base, status: 'failed' } }, $unset: { refundingAt: '' } }, { returnDocument: 'after' }).lean();
      return { doc, error: (e as Error).message, refused: false };
    }
  }
  const set = { payment: 'refunded', refund: { ...base, status: 'refunded', ...(byHand ? { by: 'hand' } : { razorpayRefundId: refundId }) } };
  const doc = await OrderModel.findByIdAndUpdate(order._id, { $set: set, $unset: { refundingAt: '' } }, { returnDocument: 'after' }).lean().catch((e: unknown) => {
    console.error('[refund] sent but not saved', order.number, refundId); // the money is already back with the customer
    throw e;
  });
  return { doc, error: null, refused: false };
}

/** The one place an online order becomes paid. Marked in one step and the status read from the saved order, so a cancel landing at the same moment is still refunded. */
export async function confirmPayment(order: { _id: unknown }, razorpayPaymentId: string) {
  const paid = await OrderModel.findOneAndUpdate(
    { _id: order._id, method: 'online', payment: { $nin: ['paid', 'refunded'] } },
    { $set: { payment: 'paid', razorpayPaymentId, paidAt: new Date() } },
    { returnDocument: 'after' },
  ).lean();
  if (!paid) return OrderModel.findById(order._id).lean(); // a twin request (or the refund) got there first
  // Paid after it was cancelled (e.g. in another tab): send the money straight back.
  if (paid.status === 'cancelled') {
    const { doc } = await refundOrder(paid, paid.total ?? 0, { reason: 'Paid after the order was cancelled', requestedAt: new Date() });
    if (doc) return doc;
  }
  return paid;
}

const CHECK_GAP_MS = 60_000;
const CHECK_MAX = 10;

/** Backstop for a payment whose confirmation never reached us: asks Razorpay about recent unpaid online orders matching `filter` and confirms the captured ones. Never throws. */
export async function reconcilePayments(filter: Record<string, unknown> = {}): Promise<void> {
  if (!razorpayReady()) return;
  try {
    const now = Date.now();
    const due = await OrderModel.find(
      {
        ...filter,
        method: 'online',
        payment: { $in: ['pending', 'failed'] },
        razorpayOrderId: { $nin: [null, ''] },
        createdAt: { $gte: new Date(now - PAYMENT_CHECK_DAYS * 86_400_000) },
        paymentCheckedAt: { $not: { $gt: new Date(now - CHECK_GAP_MS) } }, // never checked, or not in the last minute
      },
      { razorpayOrderId: 1 },
    ).sort({ createdAt: -1 }).limit(CHECK_MAX).lean();
    if (!due.length) return;
    // Stamped before asking, so a slow Razorpay isn't hit by every page load; the raw driver keeps a stamp from sending a live "order changed" event.
    await OrderModel.collection.updateMany({ _id: { $in: due.map((o) => o._id) } }, { $set: { paymentCheckedAt: new Date(now) } });
    const results = await Promise.allSettled(
      due.map(async (o) => {
        const paymentId = await capturedPayment(o.razorpayOrderId!);
        if (paymentId) await confirmPayment(o, paymentId);
      }),
    );
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length) console.error(`[reconcile] ${failed.length} of ${due.length} payment checks failed:`, (failed[0].reason as Error)?.message ?? failed[0].reason);
  } catch (e) {
    console.error('[reconcile] could not check payments:', (e as Error).message);
  }
}
