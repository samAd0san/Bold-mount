import { adminOnly } from '@/lib/server/admin-auth';
import { connectDb } from '@/lib/server/db';
import { handle, ok } from '@/lib/server/http';
import { OrderModel } from '@/lib/server/models';

// How many orders need the owner: a refund waiting for an answer, or one that failed.
export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  await connectDb();
  return ok({ count: await OrderModel.countDocuments({ 'refund.status': { $in: ['requested', 'failed'] } }) });
});
