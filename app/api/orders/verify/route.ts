import { z } from 'zod';
import { rejectCrossSite } from '@/lib/server/auth';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { confirmPayment } from '@/lib/server/orders';
import { validPaymentSignature } from '@/lib/server/razorpay';
import { isObjectId } from '@/lib/server/slug';

const Body = z.object({
  orderId: z.string('Missing order.').trim().max(40),
  razorpayOrderId: z.string('Missing payment details.').trim().min(1).max(80),
  razorpayPaymentId: z.string('Missing payment details.').trim().min(1).max(80),
  razorpaySignature: z.string('Missing payment details.').trim().min(1).max(200),
});

const UNCONFIRMED = 'We couldn’t confirm this payment. If money was deducted, please message us on WhatsApp with your order number.';

// After Razorpay's checkout: only a payment signed with our key secret marks the order paid.
export const POST = handle(async (req: Request) => {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const b = Body.parse(await readJson(req));
  if (!isObjectId(b.orderId) || !validPaymentSignature(b.razorpayOrderId, b.razorpayPaymentId, b.razorpaySignature)) return fail(400, UNCONFIRMED);
  await connectDb();
  const order = await OrderModel.findOne({ _id: b.orderId, method: 'online', razorpayOrderId: b.razorpayOrderId }).lean();
  if (!order) return fail(400, UNCONFIRMED);
  const doc = await confirmPayment(order, b.razorpayPaymentId);
  return ok({ order: toOrder(doc ?? order) });
});
