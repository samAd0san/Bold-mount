import { z } from 'zod';
import { adminOnly } from '@/lib/server/admin-auth';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { ORDER_STATUSES } from '@/lib/types';

const Status = z.enum(ORDER_STATUSES);

export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const raw = new URL(req.url).searchParams.get('status');
  const status = raw ? Status.safeParse(raw) : null;
  if (status && !status.success) return fail(400, 'Status must be new, confirmed, delivered or cancelled.');
  await connectDb();
  const docs = await OrderModel.find(status ? { status: status.data } : {}).sort({ createdAt: -1 }).limit(200).lean();
  return ok({ orders: docs.map(toOrder) });
});
