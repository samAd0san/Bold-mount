import { Types } from 'mongoose';
import { rejectCrossSite } from '@/lib/server/auth';
import { sessionUid } from '@/lib/server/auth-token';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { OrderModel, toOrder } from '@/lib/server/models';
import { COD_OFF, codAllowed, nextOrderNumber, OrderBody, priceCart } from '@/lib/server/orders';
import { createRazorpayOrder, razorpayKeyId, razorpayReady } from '@/lib/server/razorpay';
import { trackOrder } from '@/lib/server/track';

// Places an order (sign-in required), paid online or cash on delivery. Prices come from the database, never from the browser.
export const POST = handle(async (req: Request) => {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const userId = await sessionUid();
  if (!userId) return fail(401, 'Please sign in to place your order.');
  const body = OrderBody.parse(await readJson(req));
  if (body.method === 'online' && !razorpayReady()) return fail(503, 'Online payment isn’t available right now. Please try again in a little while.');

  await connectDb();
  // Whatever the page showed, the server decides who may pay cash.
  if (body.method === 'cod' && !(await codAllowed(userId))) return fail(403, COD_OFF);
  const cart = await priceCart(body.items);
  if ('error' in cart) return fail(400, cart.error);

  const _id = new Types.ObjectId();
  const number = await nextOrderNumber();
  await trackOrder(number); // stats only: links this order number to the visitor
  const base = { _id, number, ...cart, customer: body.customer, method: body.method, status: 'new' as const, userId };

  if (body.method === 'cod') {
    const order = await OrderModel.create({ ...base, payment: 'cod' });
    return ok({ order: toOrder(order.toObject()) }, 201);
  }

  let razorpayOrderId: string;
  try {
    razorpayOrderId = (await createRazorpayOrder(cart.total, number, String(_id))).id;
  } catch {
    return fail(502, 'We couldn’t start the payment. Please try again in a moment.');
  }
  const order = await OrderModel.create({ ...base, payment: 'pending', razorpayOrderId });
  return ok(
    { order: toOrder(order.toObject()), razorpay: { keyId: razorpayKeyId(), orderId: razorpayOrderId, amount: cart.total * 100, currency: 'INR' } },
    201,
  );
});
