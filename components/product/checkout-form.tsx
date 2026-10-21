'use client';

import { Fragment, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CartItem } from '@/store/cart';
import { whatsappOrderLink } from '@/lib/whatsapp';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { cn } from '@/lib/utils';
import { LocationShare, mapsUrl, type Coords } from './location-share';

type Key = 'name' | 'mobile' | 'address' | 'city' | 'pincode' | 'note';

interface Field {
  key: Key;
  label: string; // also the line label in the WhatsApp message
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
  { key: 'name', label: 'Name', required: true, autoComplete: 'name' },
  { key: 'mobile', label: 'Mobile', type: 'tel', inputMode: 'tel', required: true, autoComplete: 'tel', placeholder: '10-digit mobile number' },
  // Address is checked in validate(): it may be skipped when a location is shared.
  { key: 'address', label: 'Drop address', textarea: true, full: true, autoComplete: 'street-address', placeholder: 'House / flat, street, area, landmark' },
  { key: 'city', label: 'City', required: true, autoComplete: 'address-level2' },
  { key: 'pincode', label: 'Pincode', inputMode: 'numeric', autoComplete: 'postal-code', maxLength: 6, placeholder: '6 digits' },
  { key: 'note', label: 'Note', textarea: true, full: true, placeholder: 'Gift message, preferred delivery time…' },
];

const DISPLAY: Record<Key, string> = {
  name: 'Full name',
  mobile: 'Mobile number',
  address: 'Drop address',
  city: 'City',
  pincode: 'Pincode (optional)',
  note: 'Note (optional)',
};

const INPUT =
  'w-full rounded-xl border border-line bg-cream px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 transition-colors focus:border-navy focus:outline-none md:text-sm';

function validate(v: Partial<Record<Key, string>>, hasLocation: boolean): Partial<Record<Key, string>> {
  const errors: Partial<Record<Key, string>> = {};
  const digits = (v.mobile ?? '').replace(/\D/g, '');
  const pincode = (v.pincode ?? '').trim();
  // 10 digits, or with a +91 / country code in front.
  if (digits.length < 10 || digits.length > 13) errors.mobile = 'Enter a valid 10-digit mobile number';
  if (!(v.address ?? '').trim() && !hasLocation) errors.address = 'Enter your drop address or share your location';
  if (pincode && !/^[1-9]\d{5}$/.test(pincode)) errors.pincode = 'Enter a valid 6-digit pincode';
  return errors;
}

/** Delivery details → full order opened in WhatsApp; the cart is kept until the customer clears it. */
export function CheckoutForm({ items, onClear }: { items: CartItem[]; onClear: () => void }) {
  const [values, setValues] = useState<Partial<Record<Key, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [sentLink, setSentLink] = useState<string | null>(null);
  const [location, setLocation] = useState<Coords | null>(null);

  const set = (key: Key, value: string) => {
    setValues((s) => ({ ...s, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const shareLocation = (c: Coords | null) => {
    setLocation(c);
    if (c && errors.address) setErrors((e) => ({ ...e, address: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values, !!location);
    setErrors(found);
    const firstBad = FIELDS.find((f) => found[f.key]);
    if (firstBad) {
      document.getElementById(`checkout-${firstBad.key}`)?.focus();
      return;
    }
    const customer: Record<string, string> = {};
    for (const f of FIELDS) {
      if (f.key === 'note' && location) customer.Location = mapsUrl(location);
      customer[f.label] = (values[f.key] ?? '').trim();
    }
    const link = whatsappOrderLink(
      items.map(({ name, variant, price, qty }) => ({ name, variant, price, qty })),
      customer,
      'I can also share my live location pin here.',
    );
    window.open(link, '_blank', 'noopener,noreferrer');
    setSentLink(link);
  };

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <p className="text-sm leading-relaxed text-ink-soft md:col-span-2">
        We deliver to your door. Share your drop address or location — we’ll confirm delivery time on WhatsApp.
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
          value: values[f.key] ?? '',
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

      <div className="md:col-span-2">
        <button type="submit" className={buttonClass('whatsapp', 'w-full py-3.5 sm:w-auto')}>
          <WhatsAppGlyph size={18} /> {sentLink ? 'Send again on WhatsApp' : 'Send order on WhatsApp'}
        </button>

        {sentLink ? (
          <div role="status" className="mt-4 rounded-xl bg-whatsapp/10 p-4 text-sm">
            <p className="flex items-start gap-2 font-medium text-whatsapp-ink">
              <CheckCircle2 size={18} className="mt-px shrink-0" />
              WhatsApp opened with your order — press send to confirm. We’ll confirm availability, delivery and payment there.
            </p>
            <p className="mt-1 flex flex-wrap gap-x-4 pl-[26px] text-ink-soft">
              <a href={sentLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-navy underline underline-offset-4">
                WhatsApp didn’t open?
              </a>
              <button type="button" onClick={onClear} className="inline-flex min-h-11 items-center font-semibold text-navy underline underline-offset-4">
                Clear cart
              </button>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            No payment is taken here. Your order and details open in WhatsApp — press send and we’ll confirm availability, delivery and payment with you.
          </p>
        )}
      </div>
    </form>
  );
}
