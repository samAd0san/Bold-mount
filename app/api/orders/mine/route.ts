import { sessionUid } from '@/lib/server/auth-token';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';

export const GET = handle(async () => {
  const uid = await sessionUid();
  if (!uid) return fail(401, 'Please sign in to see your orders.');
  await connectDb();
  const docs = await OrderModel.find({ userId: uid }).sort({ createdAt: -1 }).limit(100).lean();
  return ok({ orders: docs.map(toOrder) });
});
