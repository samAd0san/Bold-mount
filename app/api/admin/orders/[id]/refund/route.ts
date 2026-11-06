import { z } from 'zod';
import { adminOnly } from '@/lib/server/admin-auth';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { refundOrder } from '@/lib/server/orders';
import { formatINR } from '@/lib/format';
import { isObjectId } from '@/lib/server/slug';

const Body = z.object({
  amount: z.number('Enter the amount to refund.').int('Enter a whole number of rupees.').min(1, 'The refund must be at least ₹1.'),
  reply: z.string().trim().max(300, 'Please keep the note under 300 characters.').optional(),
});

// Refunds a paid order (full or part): online goes back through Razorpay, cash on delivery is recorded once the shop has paid it back. A refused Razorpay refund is saved as "failed" so it can be retried.
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  const { amount, reply } = Body.parse(await readJson(req));
  await connectDb();
  const order = isObjectId(id) ? await OrderModel.findById(id).lean() : null;
  if (!order) return fail(404, 'That order was not found.');

  const total = order.total ?? 0;
  if (order.payment === 'refunded' || order.refund?.status === 'refunded') {
    const sent = order.refund?.amount ?? total;
    return fail(409, sent < total ? `${formatINR(sent)} of ${formatINR(total)} has already been refunded, and an order can only be refunded once.` : 'This order has already been refunded.');
  }
  if (order.payment !== 'paid' || (order.method !== 'cod' && !order.razorpayPaymentId)) return fail(409, 'Only a paid order can be refunded here.');
  if (amount > total) return fail(400, `The refund can’t be more than the order total (${formatINR(total)}).`);

  const prev = order.refund;
  const done = await refundOrder(order, amount, {
    reason: prev?.reason || 'Refunded by shop', note: prev?.note || undefined, reply: reply || undefined, requestedAt: prev?.requestedAt ?? new Date(),
  });
  // 409 = nothing was sent (already refunded); 502 = Razorpay said no and the order now says "failed".
  return done.error ? fail(done.refused ? 409 : 502, done.error) : ok({ order: toOrder(done.doc!) });
});
