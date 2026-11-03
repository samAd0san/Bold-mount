import { z } from 'zod';
import { adminOnly } from '@/lib/server/admin-auth';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { isObjectId } from '@/lib/server/slug';
import { ORDER_STATUSES } from '@/lib/types';

const Body = z.object({ status: z.enum(ORDER_STATUSES, 'Status must be new, confirmed, delivered or cancelled.') });

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  const { status } = Body.parse(await readJson(req));
  await connectDb();
  const doc = isObjectId(id) ? await OrderModel.findByIdAndUpdate(id, { status }, { new: true }).lean() : null;
  return doc ? ok({ order: toOrder(doc) }) : fail(404, 'That order was not found.');
});
