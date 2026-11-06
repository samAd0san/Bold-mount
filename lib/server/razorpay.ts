import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

const keyId = () => process.env.RAZORPAY_KEY_ID?.trim() || '';
const keySecret = () => process.env.RAZORPAY_KEY_SECRET?.trim() || '';

export const razorpayReady = () => !!keyId() && !!keySecret();
export const razorpayKeyId = keyId;

/** Creates a Razorpay order for `rupees` (sent as paise); throws if Razorpay says no. */
export async function createRazorpayOrder(rupees: number, receipt: string, orderId: string): Promise<{ id: string }> {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString('base64')}`,
    },
    body: JSON.stringify({ amount: Math.round(rupees * 100), currency: 'INR', receipt, notes: { orderId } }),
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; error?: { description?: string } };
  if (!res.ok || !body.id) {
    console.error('[razorpay] create order failed', res.status, body.error?.description ?? '');
    throw new Error('Razorpay order failed');
  }
  return { id: body.id };
}

/** Sends `rupees` back to the customer's original payment method; returns Razorpay's refund id, or throws with Razorpay's reason. */
export async function refundPayment(paymentId: string, rupees: number, orderNumber: string): Promise<{ id: string }> {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString('base64')}`,
    },
    // No `receipt`: Razorpay wants it unique per refund, and an order can be refunded in parts.
    body: JSON.stringify({ amount: Math.round(rupees * 100), speed: 'normal', notes: { order: orderNumber } }),
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; error?: { description?: string } };
  if (!res.ok || !body.id) {
    console.error('[razorpay] refund failed', res.status, body.error?.description ?? '');
    throw new Error(body.error?.description || 'Razorpay refund failed');
  }
  return { id: body.id };
}

/** The id of a captured payment on this Razorpay order, or null if none yet; throws when Razorpay can't be asked. */
export async function capturedPayment(razorpayOrderId: string): Promise<string | null> {
  const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpayOrderId)}/payments`, {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString('base64')}` },
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as { items?: { id?: string; status?: string }[]; error?: { description?: string } };
  if (!res.ok || !Array.isArray(body.items)) {
    throw new Error(`Razorpay payment lookup failed (${res.status}${body.error?.description ? `: ${body.error.description}` : ''})`); // the caller logs it, once
  }
  return body.items.find((p) => p.status === 'captured')?.id ?? null;
}

/** True when `signature` is the HMAC-SHA256 of `orderId|paymentId` made with our key secret (never true without a secret). */
export function validPaymentSignature(razorpayOrderId: string, paymentId: string, signature: string): boolean {
  if (!keySecret()) return false;
  const want = Buffer.from(createHmac('sha256', keySecret()).update(`${razorpayOrderId}|${paymentId}`).digest('hex'));
  const got = Buffer.from(signature);
  return want.length === got.length && timingSafeEqual(want, got);
}
