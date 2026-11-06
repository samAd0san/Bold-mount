import { z } from 'zod';
import { rejectCrossSite } from '@/lib/server/auth';
import { sessionUid } from '@/lib/server/auth-token';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { refundOrder } from '@/lib/server/orders';
import { isObjectId } from '@/lib/server/slug';
import { CANCELLABLE } from '@/lib/types';

const Body = z.object({ reason: z.string().trim().max(300, 'Please keep the reason under 300 characters.').optional() });

const TOO_LATE = 'This order has already left our shop, so it can’t be cancelled. Message us and we’ll help.';

// The customer cancels their own order before it ships; a paid online order is refunded in full (cash on delivery has nothing to refund).
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const uid = await sessionUid();
  if (!uid) return fail(401, 'Please sign in to cancel your order.');
  const { id } = await params;
  const { reason } = Body.parse(await readJson(req));
  await connectDb();
  const found = isObjectId(id) ? await OrderModel.findOne({ _id: id, userId: uid }, { status: 1 }).lean() : null;
  if (!found) return fail(404, 'That order was not found.');
  if (!CANCELLABLE.includes(found.status)) return fail(409, TOO_LATE);

  // The status filter lets only one request win, so a double tap can never refund twice.
  const now = new Date();
  const order = await OrderModel.findOneAndUpdate(
    { _id: id, userId: uid, status: { $in: CANCELLABLE } },
    { $set: { status: 'cancelled', cancelledAt: now, cancelledBy: 'customer' } },
    { returnDocument: 'after' },
  ).lean();
  if (!order) return fail(409, TOO_LATE);

  // A refused refund is saved as "failed" and the order stays cancelled; the shop retries from admin.
  if (order.payment === 'paid' && order.razorpayPaymentId) {
    const done = await refundOrder(order, order.total ?? 0, { reason: 'Cancelled by customer', note: reason || undefined, requestedAt: now });
    return ok({ order: toOrder(done.doc ?? order) });
  }
  return ok({ order: toOrder(order) });
});
