import { z } from 'zod';
import { rejectCrossSite } from '@/lib/server/auth';
import { sessionUid } from '@/lib/server/auth-token';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { isObjectId } from '@/lib/server/slug';
import { REFUND_REASONS, REFUND_REQUEST_DAYS } from '@/lib/types';

const Body = z.object({
  reason: z.enum(REFUND_REASONS, 'Please choose a reason for the refund.'),
  note: z.string().trim().max(500, 'Please keep your note under 500 characters.').optional(),
});

// The customer asks for a refund on a delivered, paid order (online or cash on delivery); the shop answers from admin.
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const uid = await sessionUid();
  if (!uid) return fail(401, 'Please sign in to ask for a refund.');
  const { id } = await params;
  const { reason, note } = Body.parse(await readJson(req));
  await connectDb();
  const found = isObjectId(id) ? await OrderModel.findOne({ _id: id, userId: uid }).lean() : null;
  if (!found) return fail(404, 'That order was not found.');

  if (found.refund) return fail(409, found.refund.status === 'refunded' ? 'This order has already been refunded.' : 'You have already asked for a refund on this order.');
  if (found.status !== 'delivered') return fail(409, 'You can ask for a refund once your order has been delivered.');
  if (found.payment !== 'paid') return fail(409, 'Only a paid order can be refunded here. Message us and we’ll help.');
  const since = found.deliveredAt ?? found.updatedAt;
  if (!since || Date.now() - new Date(since).getTime() > REFUND_REQUEST_DAYS * 86_400_000) {
    return fail(409, `The ${REFUND_REQUEST_DAYS}-day window to ask for a refund has ended. Message us and we’ll see what we can do.`);
  }

  // The "no refund yet" filter lets only one request win, so a double tap can't file two.
  const now = new Date();
  const refund = { status: 'requested', reason, ...(note ? { note } : {}), amount: found.total ?? 0, requestedAt: now, updatedAt: now };
  const order = await OrderModel.findOneAndUpdate({ _id: id, userId: uid, status: 'delivered', payment: 'paid', refund: null }, { $set: { refund } }, { returnDocument: 'after' }).lean();
  return order ? ok({ order: toOrder(order) }) : fail(409, 'You have already asked for a refund on this order.');
});
