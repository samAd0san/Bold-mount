import { Types } from 'mongoose';
import { rejectCrossSite } from '@/lib/server/auth';
import { sessionUid } from '@/lib/server/auth-token';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { nextOrderNumber, OrderBody, priceCart } from '@/lib/server/orders';
import { createRazorpayOrder, razorpayKeyId, razorpayReady } from '@/lib/server/razorpay';

// Places an order (sign-in required). Prices come from the database, never from the browser.
export const POST = handle(async (req: Request) => {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const userId = await sessionUid();
  if (!userId) return fail(401, 'Please sign in to place your order.');
  const body = OrderBody.parse(await readJson(req));
  if (body.method === 'online' && !razorpayReady()) return fail(503, 'Online payment isn’t set up yet. Please order on WhatsApp.');

  await connectDb();
  const cart = await priceCart(body.items);
  if ('error' in cart) return fail(400, cart.error);

  const _id = new Types.ObjectId();
  const number = await nextOrderNumber();
  const base = { _id, number, ...cart, customer: body.customer, method: body.method, status: 'new' as const, userId };

  if (body.method === 'whatsapp') {
    const order = await OrderModel.create({ ...base, payment: 'on-whatsapp' });
    return ok({ order: toOrder(order.toObject()) }, 201);
  }

  let razorpayOrderId: string;
  try {
    razorpayOrderId = (await createRazorpayOrder(cart.total, number, String(_id))).id;
  } catch {
    return fail(502, 'We couldn’t start the payment. Please try again, or order on WhatsApp.');
  }
  const order = await OrderModel.create({ ...base, payment: 'pending', razorpayOrderId });
  return ok(
    { order: toOrder(order.toObject()), razorpay: { keyId: razorpayKeyId(), orderId: razorpayOrderId, amount: cart.total * 100, currency: 'INR' } },
    201,
  );
});
