'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Banknote, Loader2, Lock } from 'lucide-react';
import { cartSubtotal, type CartItem } from '@/store/cart';
import { postJson } from '@/lib/client-api';
import { formatINR } from '@/lib/format';
import { deliveryFor } from '@/lib/shop';
import type { Order, OrderCustomer } from '@/lib/types';
import { buttonClass } from '@/components/ui/button-styles';
import { GoogleMark } from '@/components/auth/google-button';
import { signInHref, signOut, useAccount } from '@/components/auth/use-account';
import { cn } from '@/lib/utils';
import { LocationShare, mapsUrl, type Coords } from './location-share';
import { loadRazorpay, type RazorpayResponse } from './razorpay';

type Key = 'name' | 'mobile' | 'address' | 'city' | 'pincode' | 'note';

interface Field {
  key: Key;
  required?: boolean;
  textarea?: boolean;
  full?: boolean;
  type?: 'text' | 'tel';
  inputMode?: 'text' | 'tel' | 'numeric';
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
}

const FIELDS: Field[] = [
  { key: 'name', required: true, autoComplete: 'name' },
  { key: 'mobile', type: 'tel', inputMode: 'tel', required: true, autoComplete: 'tel', placeholder: '10-digit mobile number' },
  // Address is checked in validate(): it may be skipped when a location is shared.
  { key: 'address', textarea: true, full: true, autoComplete: 'street-address', placeholder: 'House / flat, street, area, landmark' },
  { key: 'city', required: true, autoComplete: 'address-level2' },
  { key: 'pincode', required: true, inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 6, placeholder: '6 digits' },
  { key: 'note', textarea: true, full: true, placeholder: 'Gift message, preferred delivery time…' },
];

const DISPLAY: Record<Key, string> = {
  name: 'Full name',
  mobile: 'Mobile number',
  address: 'Drop address',
  city: 'City',
  pincode: 'Pincode',
  note: 'Note (optional)',
};

const INPUT =
  'w-full rounded-xl border border-line bg-cream px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 transition-colors focus:border-navy focus:outline-none md:text-sm';

// Same rules the server applies, so people see the problem here instead of after pressing a button.
function validate(v: Partial<Record<Key, string>>, hasLocation: boolean): Partial<Record<Key, string>> {
  const errors: Partial<Record<Key, string>> = {};
  let mobile = (v.mobile ?? '').replace(/\D/g, '');
  // A +91 / 91 or a leading 0 in front of the 10 digits is fine.
  if (mobile.length === 12 && mobile.startsWith('91')) mobile = mobile.slice(2);
  else if (mobile.length === 11 && mobile.startsWith('0')) mobile = mobile.slice(1);
  if ((v.name ?? '').trim().length < 2) errors.name = 'Enter your name';
  if (!/^[6-9]\d{9}$/.test(mobile)) errors.mobile = 'Enter a valid 10-digit mobile number';
  if ((v.address ?? '').trim().length < 5 && !hasLocation) errors.address = 'Enter your drop address or share your location';
  if ((v.city ?? '').trim().length < 2) errors.city = 'Enter your city';
  if (!/^\d{6}$/.test((v.pincode ?? '').trim())) errors.pincode = 'Enter a valid 6-digit pincode';
  return errors;
}

type Draft = { values: Partial<Record<Key, string>>; location: Coords | null };
type Method = 'online' | 'cod';
// allowed is null until the server has answered; the server checks again when the order is placed.
type CodState = { allowed: boolean | null; reason?: string };

// The Google sign-in is a full-page trip, so the typed details wait in sessionStorage and come back with the customer.
const DRAFT_KEY = 'boldmount-checkout-draft';
const readDraft = (): Draft | null => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? 'null');
  } catch {
    return null;
  }
};

const FINE_LINK = 'font-semibold text-navy underline underline-offset-4';

/** One choice in "How would you like to pay?"; a disabled one shows its reason instead of the usual text. */
function PayOption({ checked, disabled, onSelect, title, text }: { checked: boolean; disabled?: boolean; onSelect: () => void; title: string; text: string }) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 transition-colors',
        disabled ? 'cursor-not-allowed border-line bg-sand/40' : 'cursor-pointer',
        !disabled && (checked ? 'border-navy bg-cream ring-1 ring-navy' : 'border-line hover:border-navy/50'),
      )}
    >
      <input type="radio" name="payment-method" checked={checked} disabled={disabled} onChange={onSelect} className="mt-1 size-4 shrink-0 accent-navy" />
      <span className="min-w-0">
        <span className={cn('block text-sm font-semibold', disabled ? 'text-ink-soft' : 'text-ink')}>{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{text}</span>
      </span>
    </label>
  );
}

/** Delivery details → sign in → choose to pay online with Razorpay or cash on delivery; both orders are saved to the customer's account. */
export function CheckoutForm({ items, onPlaced }: { items: CartItem[]; onPlaced: (order: Order) => void }) {
  const { ready, user, google } = useAccount();
  // This form only mounts after hydration (see CartView), so reading sessionStorage here is safe.
  const [values, setValues] = useState<Partial<Record<Key, string>>>(() => readDraft()?.values ?? {});
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [location, setLocation] = useState<Coords | null>(() => readDraft()?.location ?? null);
  const [paying, setPaying] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [picked, setPicked] = useState<Method>('online');
  const [cod, setCod] = useState<CodState>({ allowed: null });
  const signedOut = ready && !user;
  const userId = user?.id;

  useEffect(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* storage blocked: nothing to clear */
    }
  }, []);

  // Asks the server whether this customer may pay cash; if the question fails, the server still decides at order time.
  useEffect(() => {
    if (!userId) return;
    let current = true;
    fetch('/api/orders/cod', { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b: { allowed: boolean; reason?: string } | null) => current && setCod(b ? { allowed: b.allowed, reason: b.reason } : { allowed: null }))
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [userId]);

  const subtotal = cartSubtotal(items);
  const fee = deliveryFor(subtotal);
  const total = subtotal + fee;
  const codOff = cod.allowed === false;
  const method: Method = codOff ? 'online' : picked;
  // Name falls back to the signed-in customer's until they type their own.
  const get = (key: Key) => values[key] ?? (key === 'name' ? (user?.name ?? '') : '');

  const set = (key: Key, value: string) => {
    setValues((s) => ({ ...s, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const shareLocation = (c: Coords | null) => {
    setLocation(c);
    if (c && errors.address) setErrors((e) => ({ ...e, address: undefined }));
  };

  // Checks the form; returns the customer to send, or null after showing what's wrong.
  const collect = (): OrderCustomer | null => {
    const current = Object.fromEntries(FIELDS.map((f) => [f.key, get(f.key)])) as Record<Key, string>;
    const found = validate(current, !!location);
    setErrors(found);
    const firstBad = FIELDS.find((f) => found[f.key]);
    if (firstBad) {
      document.getElementById(`checkout-${firstBad.key}`)?.focus();
      return null;
    }
    const trimmed = Object.fromEntries(FIELDS.map((f) => [f.key, current[f.key].trim()])) as Record<Key, string>;
    // With only a shared location, the map link stands in for the typed address.
    if (trimmed.address.length < 5 && location) trimmed.address = mapsUrl(location);
    return { ...trimmed, ...(location && { location }) };
  };

  const lines = items.map(({ slug, variantId, qty }) => ({ slug, variantId, qty }));

  const saveDraft = () => {
    // Empty fields are left out so the name can still fall back to the Google name afterwards.
    const filled = FIELDS.map((f) => [f.key, get(f.key)] as const).filter(([, v]) => v);
    const draft: Draft = { values: Object.fromEntries(filled), location };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage blocked: they just retype */
    }
  };

  // The server says 401 when the session has ended: forget the stale sign-in so the prompt shows.
  const sessionEnded = (message: string) => {
    setProblem(message);
    void signOut();
  };

  const placeCod = async () => {
    const customer = collect();
    if (!customer || paying) return;
    setPaying(true);
    setProblem(null);
    setNotice(null);
    const res = await postJson<{ order: Order }>('/api/orders', { method: 'cod', items: lines, customer });
    if (res.ok) {
      onPlaced(res.data.order);
      return;
    }
    setPaying(false);
    if (res.status === 401) sessionEnded(res.error);
    else {
      // 403 = the server switched cash off for this customer since the page loaded.
      if (res.status === 403) setCod({ allowed: false, reason: res.error });
      setProblem(res.error);
    }
  };

  const payOnline = async () => {
    const customer = collect();
    if (!customer || paying) return;
    setPaying(true);
    setProblem(null);
    setNotice(null);

    const res = await postJson<{ order: Order; razorpay: { keyId: string; orderId: string; amount: number; currency: string } }>('/api/orders', {
      method: 'online',
      items: lines,
      customer,
    });
    if (!res.ok) {
      setPaying(false);
      if (res.status === 401) sessionEnded(res.error);
      else setProblem(res.error);
      return;
    }
    const { order, razorpay } = res.data;
    const markFailed = (reason: string) => void postJson('/api/orders/failed', { orderId: order.id, reason }, true);

    try {
      await loadRazorpay();
    } catch {
      markFailed('script-load');
      setPaying(false);
      setProblem('Couldn’t open the payment window. Check your connection and try again.');
      return;
    }

    let finished = false;
    let lastFailure = '';
    const rzp = new window.Razorpay!({
      key: razorpay.keyId,
      order_id: razorpay.orderId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      name: 'Bold Mount',
      description: order.number,
      image: `${window.location.origin}/images/brand/icon-192.png`,
      prefill: { name: customer.name, contact: customer.mobile },
      notes: { orderNumber: order.number },
      theme: { color: '#183c60' },
      handler: async (resp: RazorpayResponse) => {
        finished = true;
        const verified = await postJson<{ order: Order }>('/api/orders/verify', {
          orderId: order.id,
          razorpayOrderId: resp.razorpay_order_id,
          razorpayPaymentId: resp.razorpay_payment_id,
          razorpaySignature: resp.razorpay_signature,
        });
        if (verified.ok) {
          onPlaced(verified.data.order);
          return;
        }
        setPaying(false);
        setProblem(`Your payment went through, but we couldn’t confirm it here. Please message us on WhatsApp with order ${order.number} and we’ll sort it out.`);
      },
      modal: {
        ondismiss: () => {
          if (finished) return;
          markFailed(lastFailure || 'dismissed');
          setPaying(false);
          const retry = codOff ? 'you can try again' : 'you can try again or choose cash on delivery';
          setNotice(
            lastFailure
              ? `The payment didn’t go through, and nothing was charged. Your cart is saved — ${retry}.`
              : `Payment cancelled — nothing was charged. Your cart is saved, so ${retry}.`,
          );
        },
      },
    });
    // The customer can retry inside the window, so remember why it failed and report it only if they close it.
    rzp.on('payment.failed', (r) => {
      lastFailure = r.error?.description?.slice(0, 120) || 'payment failed';
    });
    rzp.open();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    return method === 'cod' ? placeCod() : payOnline();
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 md:grid-cols-2">
      <p className="text-sm leading-relaxed text-ink-soft md:col-span-2">
        We deliver to your door. Share your drop address or location — we’ll confirm the delivery time with you.
      </p>

      {FIELDS.map((f) => {
        const id = `checkout-${f.key}`;
        const error = errors[f.key];
        const common = {
          id,
          name: f.key,
          required: f.required,
          placeholder: f.placeholder,
          autoComplete: f.autoComplete,
          value: get(f.key),
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? `${id}-error` : undefined,
          className: cn(INPUT, error && 'border-gold-deep'),
        };
        return (
          <Fragment key={f.key}>
            <div className={cn(f.full && 'md:col-span-2')}>
              <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
                {DISPLAY[f.key]} {f.required && <span className="text-gold-ink">*</span>}
                {f.key === 'address' && !location && <span className="font-normal text-ink-soft"> (or share your location below)</span>}
              </label>
              {f.textarea ? (
                <textarea {...common} rows={f.key === 'note' ? 2 : 3} onChange={(e) => set(f.key, e.target.value)} className={cn(common.className, 'resize-y')} />
              ) : (
                <input
                  {...common}
                  type={f.type ?? 'text'}
                  inputMode={f.inputMode}
                  maxLength={f.maxLength}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
              {error && (
                <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-gold-ink">
                  <AlertCircle size={13} /> {error}
                </p>
              )}
            </div>
            {f.key === 'address' && (
              <div className="md:col-span-2">
                <LocationShare value={location} onChange={shareLocation} />
              </div>
            )}
          </Fragment>
        );
      })}

      <div className="space-y-3 md:col-span-2">
        {!ready && (
          <div aria-busy className="space-y-3">
            <span role="status" className="sr-only">
              Checking your sign-in…
            </span>
            <div className="h-12 animate-pulse rounded-full bg-sand" />
          </div>
        )}

        {ready && user && (
          <fieldset disabled={paying} className="space-y-3">
            <legend className="mb-2 text-sm font-medium text-ink">How would you like to pay?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <PayOption checked={method === 'online'} onSelect={() => setPicked('online')} title="Pay online" text="UPI, cards, netbanking" />
              <PayOption
                checked={method === 'cod'}
                disabled={codOff}
                onSelect={() => setPicked('cod')}
                title="Cash on delivery"
                text={codOff ? (cod.reason ?? '') : `Pay ${formatINR(total)} in cash when your order arrives.`}
              />
            </div>
            <p className="flex items-baseline justify-between gap-4 rounded-xl bg-sand/50 px-4 py-3 text-sm text-ink">
              <span>
                {method === 'cod' ? 'To pay in cash on delivery' : 'To pay now'}
                <span className="block text-xs text-ink-soft">{fee ? `Includes ${formatINR(fee)} delivery` : 'Free delivery'}</span>
              </span>
              <span className="text-xl font-semibold tabular-nums text-navy">{formatINR(total)}</span>
            </p>
          </fieldset>
        )}

        {problem && (
          <div role="alert" className="flex items-start gap-2 rounded-xl bg-gold/15 p-4 text-sm font-medium text-gold-ink">
            <AlertCircle size={17} className="mt-px shrink-0" />
            <p>{problem}</p>
          </div>
        )}
        {notice && (
          <p role="status" className="rounded-xl bg-sand p-4 text-sm text-ink">
            {notice}
          </p>
        )}

        {signedOut &&
          (google ? (
            <>
              <a href={signInHref('/cart')} onClick={saveDraft} className={buttonClass('gold', 'w-full px-5 py-3.5 text-center')}>
                <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-white">
                  <GoogleMark className="size-4" />
                </span>
                Sign in with Google to place your order
              </a>
              <p className="text-center text-xs leading-relaxed text-ink-soft">
                Your orders are saved to your account so you can track them, cancel or ask for a refund.
              </p>
            </>
          ) : (
            <p role="status" className="rounded-xl bg-sand p-4 text-sm leading-relaxed text-ink">
              Sign-in isn’t available right now, so we can’t take orders on the website yet. Please try again in a little while.
            </p>
          ))}

        {ready && user && (
          <>
            <button type="submit" disabled={paying} className={buttonClass('gold', 'w-full py-3.5')}>
              {paying ? <Loader2 size={17} className="animate-spin" /> : method === 'cod' ? <Banknote size={17} /> : <Lock size={16} />}
              {method === 'cod' ? `Place order — pay ${formatINR(total)} on delivery` : `Pay ${formatINR(total)} securely`}
            </button>
            <p className="text-center text-xs leading-relaxed text-ink-soft">
              {method === 'cod'
                ? 'Nothing to pay now. Please keep the cash ready for when your order arrives.'
                : 'UPI · Google Pay · PhonePe · Paytm · Cards · Netbanking · Apple Pay (Safari). Payments are handled by Razorpay, so we never see or store your card details.'}
            </p>
          </>
        )}

        <p className="text-center text-xs leading-relaxed text-ink-soft">
          By placing an order you agree to our{' '}
          <Link href="/policies/terms" className={FINE_LINK}>
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/policies/refund-cancellation" className={FINE_LINK}>
            Refund & Cancellation
          </Link>{' '}
          policy.
        </p>
      </div>
    </form>
  );
}
