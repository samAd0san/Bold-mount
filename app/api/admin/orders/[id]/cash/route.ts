import { adminOnly } from '@/lib/server/admin-auth';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { isObjectId } from '@/lib/server/slug';

const NOT_OPEN = 'Only a cash-on-delivery order that isn’t cancelled can be marked as paid.';

// Records the cash for a cash-on-delivery order without changing its status.
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  await connectDb();
  const order = isObjectId(id) ? await OrderModel.findById(id).lean() : null;
  if (!order) return fail(404, 'That order was not found.');
  if (order.method === 'cod' && order.payment === 'paid') return ok({ order: toOrder(order) });

  const doc = await OrderModel.findOneAndUpdate(
    { _id: id, method: 'cod', payment: 'cod', status: { $ne: 'cancelled' } },
    { $set: { payment: 'paid', paidAt: new Date() } },
    { returnDocument: 'after' },
  ).lean();
  return doc ? ok({ order: toOrder(doc) }) : fail(409, NOT_OPEN);
});
