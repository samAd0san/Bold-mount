import { z } from 'zod';
import { rejectCrossSite } from '@/lib/server/auth';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { OrderModel } from '@/lib/server/models';
import { isObjectId } from '@/lib/server/slug';

const Body = z.object({ orderId: z.string('Missing order.').trim().max(40), reason: z.string().max(300).optional() });

// The customer closed the payment window or the payment failed: a still-pending online order is marked failed.
export const POST = handle(async (req: Request) => {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const { orderId } = Body.parse(await readJson(req));
  if (!isObjectId(orderId)) return fail(400, 'That order was not found.');
  await connectDb();
  await OrderModel.updateOne({ _id: orderId, method: 'online', payment: 'pending' }, { payment: 'failed' });
  return ok({ ok: true });
});
