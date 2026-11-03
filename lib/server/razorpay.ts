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

/** True when `signature` is the HMAC-SHA256 of `orderId|paymentId` made with our key secret (never true without a secret). */
export function validPaymentSignature(razorpayOrderId: string, paymentId: string, signature: string): boolean {
  if (!keySecret()) return false;
  const want = Buffer.from(createHmac('sha256', keySecret()).update(`${razorpayOrderId}|${paymentId}`).digest('hex'));
  const got = Buffer.from(signature);
  return want.length === got.length && timingSafeEqual(want, got);
}
