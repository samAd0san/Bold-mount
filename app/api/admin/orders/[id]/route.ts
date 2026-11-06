import { z } from 'zod';
import { adminOnly } from '@/lib/server/admin-auth';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { settleCash } from '@/lib/server/orders';
import { isObjectId } from '@/lib/server/slug';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types';

const Body = z.object({ status: z.enum(ORDER_STATUSES, 'Status must be new, confirmed, dispatched, delivered or cancelled.') });

const STAMP: Partial<Record<OrderStatus, string>> = { dispatched: 'dispatchedAt', delivered: 'deliveredAt', cancelled: 'cancelledAt' };

// Changes the status and stamps the time. It never refunds (that is a separate step); a cash-on-delivery order is marked paid in cash once delivered.
export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  const { status } = Body.parse(await readJson(req));
  await connectDb();
  if (!isObjectId(id)) return fail(404, 'That order was not found.');

  const stamp = STAMP[status];
  const update = {
    $set: { status, ...(stamp ? { [stamp]: new Date() } : {}), ...(status === 'cancelled' ? { cancelledBy: 'shop' } : {}) },
    ...(status === 'cancelled' ? {} : { $unset: { cancelledAt: '', cancelledBy: '' } }),
  };
  // Only a real change is stamped; picking the current status again leaves the times alone.
  const doc = (await OrderModel.findOneAndUpdate({ _id: id, status: { $ne: status } }, update, { returnDocument: 'after' }).lean()) ?? (await OrderModel.findById(id).lean());
  return doc ? ok({ order: toOrder((await settleCash(doc, status)) ?? doc) }) : fail(404, 'That order was not found.');
});
