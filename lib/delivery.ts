import { formatINR } from '@/lib/format';

// The shop's one delivery rule, safe in the browser and on the server: the admin sets it, everything else just reads it.

/** `fee` is the charge per order (0 = always free); `freeAbove` is the order total from which delivery is free (null = no such offer). Whole rupees. */
export type DeliverySettings = { fee: number; freeAbove: number | null };

// What the shop charges until the owner saves their own (placeholder numbers).
export const DEFAULT_DELIVERY: DeliverySettings = { fee: 50, freeAbove: 999 };

export const MAX_FEE = 2000;
export const MAX_FREE_ABOVE = 100_000;

/** Delivery charge for a cart subtotal: free at or above `freeAbove`, else `fee`. The only delivery formula; the server and the browser both use it. */
export const deliveryFor = (subtotal: number, d: DeliverySettings) => (d.freeAbove !== null && subtotal >= d.freeAbove ? 0 : d.fee);

/** How far a cart is from free delivery (`left` is 0 once unlocked, `pct` fills the bar); null when there is no free-delivery offer to work towards. */
export function freeDeliveryGap(subtotal: number, d: DeliverySettings) {
  if (d.fee === 0 || d.freeAbove === null) return null;
  return { left: Math.max(0, d.freeAbove - subtotal), pct: Math.min(100, (subtotal / d.freeAbove) * 100) };
}

/** Every delivery sentence on the site comes from here, so the announcement bar, FAQ, policies and product page always agree. */
export function deliveryWords(d: DeliverySettings) {
  const always = d.fee === 0;
  const above = !always && d.freeAbove !== null ? formatINR(d.freeAbove) : null;
  const perOrder = `${formatINR(d.fee)} per order`;
  const promo = always ? 'Free delivery on every order' : above ? `Free delivery on orders of ${above} or more` : null;
  return {
    /** The selling line ("Free delivery on orders of ₹999 or more"); null when there is nothing free to boast about. */
    promo,
    /** A short label that is always true, e.g. for the product page. */
    label: promo ?? `Delivery ${perOrder}`,
    /** A full sentence for FAQ and policy text. */
    sentence: always ? 'Delivery is free on every order.' : above ? `Delivery is ${perOrder}, and free on orders of ${above} or more.` : `Delivery is ${perOrder}.`,
  };
}

// A whole number from a number or typed text; NaN for blank, decimals or words ("+ 0" turns -0 into 0).
const whole = (v: unknown) => {
  const n = typeof v === 'string' ? (v.trim() ? Number(v.replace(/,/g, '')) : NaN) : typeof v === 'number' ? v : NaN;
  return Number.isInteger(n) ? n + 0 : NaN;
};

/** Checks what the admin typed, with plain-words errors. `freeAbove: null` means no free-delivery offer. The form and the server both use this. */
export function parseDelivery(raw: unknown): { settings: DeliverySettings } | { error: string } {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const fee = whole(body.fee);
  if (Number.isNaN(fee)) return { error: 'Enter the delivery fee as a whole number of rupees, like 50. Use 0 for free delivery.' };
  if (fee < 0 || fee > MAX_FEE) return { error: `The delivery fee must be between ${formatINR(0)} and ${formatINR(MAX_FEE)}.` };
  if (body.freeAbove === null) return { settings: { fee, freeAbove: null } };
  const freeAbove = whole(body.freeAbove);
  if (Number.isNaN(freeAbove)) return { error: 'Enter the order total for free delivery as a whole number of rupees, like 999, or untick “Free delivery on bigger orders”.' };
  if (freeAbove < 1 || freeAbove > MAX_FREE_ABOVE) return { error: `The free-delivery order total must be between ${formatINR(1)} and ${formatINR(MAX_FREE_ABOVE)}.` };
  return { settings: { fee, freeAbove } };
}
