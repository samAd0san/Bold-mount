import { z } from 'zod';
import { adminOnly } from '@/lib/server/admin-auth';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { isObjectId } from '@/lib/server/slug';

const Body = z.object({ reply: z.string('Please write a short reply for the customer.').trim().min(1, 'Please write a short reply for the customer.').max(300, 'Please keep the reply under 300 characters.') });

// Says no to a customer's refund request, with a reply they can read.
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  const { reply } = Body.parse(await readJson(req));
  await connectDb();
  if (!isObjectId(id)) return fail(404, 'That order was not found.');
  const doc = await OrderModel.findOneAndUpdate(
    { _id: id, 'refund.status': 'requested' },
    { $set: { 'refund.status': 'declined', 'refund.reply': reply, 'refund.updatedAt': new Date() } },
    { returnDocument: 'after' },
  ).lean();
  if (doc) return ok({ order: toOrder(doc) });
  return (await OrderModel.exists({ _id: id })) ? fail(409, 'There is no open refund request on this order.') : fail(404, 'That order was not found.');
});
