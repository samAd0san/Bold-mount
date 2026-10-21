'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { CheckCircle2, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart, cartCount, cartSubtotal } from '@/store/cart';
import { useHydrated } from '@/lib/use-hydrated';
import { formatINR } from '@/lib/format';
import { SITE } from '@/lib/site';
import { getSection } from '@/lib/sections';
import { buttonClass } from '@/components/ui/button-styles';
import { QtyStepper } from './qty-stepper';
import { CheckoutForm } from './checkout-form';

const CARD = 'rounded-2xl bg-pearl ring-1 ring-line ring-inset';

/** Cart lines, order summary and the WhatsApp checkout form (cart lives in localStorage, so render after hydration). */
export function CartView() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const [cleared, setCleared] = useState(false);

  if (!hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <span className="sr-only">Loading your cart…</span>
        <div className={`h-72 animate-pulse ${CARD}`} />
        <div className={`h-72 animate-pulse ${CARD}`} />
      </div>
    );
  }

  if (!items.length) return <EmptyCart cleared={cleared} />;

  const count = cartCount(items);
  const subtotal = cartSubtotal(items);
  const savings = items.reduce((s, i) => s + (i.compareAt && i.compareAt > i.price ? (i.compareAt - i.price) * i.qty : 0), 0);
  const free = subtotal >= SITE.freeShippingAbove;
  const progress = Math.min(100, (subtotal / SITE.freeShippingAbove) * 100);

  return (
    // Explicit placement: summary sits between items and form on phones, in its own column on desktop.
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-8">
      <section aria-labelledby="cart-items-title" className={`lg:col-start-1 lg:row-start-1 ${CARD}`}>
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id="cart-items-title" className="text-lg text-ink">
            Items <span className="font-normal text-ink-soft">({count})</span>
          </h2>
          <Link href="/shop" className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
            Continue shopping
          </Link>
        </div>
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 p-4 sm:p-5">
              <Link href={`/product/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream sm:h-24 sm:w-24">
                {item.image && <Image src={item.image} alt={item.name} fill sizes="96px" className="object-contain p-2" />}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/product/${item.slug}`} className="line-clamp-2 font-medium leading-snug text-ink hover:text-navy">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-ink-soft">
                      {item.variant} · {formatINR(item.price)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    aria-label={`Remove ${item.name} (${item.variant})`}
                    className="-mt-2 -mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand/60 hover:text-ink"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <QtyStepper value={item.qty} onChange={(q) => setQty(item.key, q)} label={`Quantity of ${item.name}`} />
                  <span className="font-semibold tabular-nums text-ink">{formatINR(item.price * item.qty)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside aria-labelledby="summary-title" className={`p-5 md:p-6 lg:sticky lg:top-36 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start ${CARD}`}>
        <h2 id="summary-title" className="text-lg text-ink">Order summary</h2>

        <div className="mt-4 rounded-xl bg-cream p-4 text-sm">
          {free ? (
            <p className="font-medium text-whatsapp-ink">You’ve unlocked free delivery</p>
          ) : (
            <p className="text-ink-soft">
              Add <span className="font-semibold text-ink">{formatINR(SITE.freeShippingAbove - subtotal)}</span> more for free delivery
            </p>
          )}
          <div
            role="progressbar"
            aria-label="Progress to free delivery"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sand"
          >
            <div className="h-full rounded-full bg-gold transition-all duration-500 ease-expo" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Subtotal ({count} {count === 1 ? 'item' : 'items'})</dt>
            <dd className="font-medium tabular-nums text-ink">{formatINR(subtotal)}</dd>
          </div>
          {savings > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">You save</dt>
              <dd className="font-medium tabular-nums text-whatsapp-ink">−{formatINR(savings)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Delivery</dt>
            <dd className={free ? 'font-medium text-whatsapp-ink' : 'text-right text-ink'}>{free ? 'Free' : 'Confirmed on WhatsApp'}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
            <dt className="text-base font-semibold text-ink">Total</dt>
            <dd className="text-right">
              <span className="text-2xl font-semibold tabular-nums text-navy">{formatINR(subtotal)}</span>
              {!free && <span className="block text-xs text-ink-soft">+ delivery</span>}
            </dd>
          </div>
        </dl>
      </aside>

      <section id="delivery" aria-labelledby="delivery-title" className={`scroll-mt-36 p-5 md:p-8 lg:col-start-1 lg:row-start-2 ${CARD}`}>
        <h2 id="delivery-title" className="text-xl text-ink">Delivery details</h2>
        <p className="mt-1.5 mb-6 text-sm text-ink-soft">Where should we deliver your order? Your details go to WhatsApp with your cart.</p>
        <CheckoutForm
          items={items}
          onClear={() => {
            setCleared(true);
            clear();
          }}
        />
      </section>
    </div>
  );
}

function EmptyCart({ cleared }: { cleared: boolean }) {
  const talbeenah = getSection('talbeenah');
  const dates = getSection('dates');
  return (
    <div className={`mx-auto max-w-xl px-6 py-14 text-center md:py-16 ${CARD}`}>
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand text-navy">
        {cleared ? <CheckCircle2 size={26} /> : <ShoppingBag size={26} />}
      </span>
      <h2 className="mt-5 text-2xl text-ink">{cleared ? 'Thank you!' : 'Your cart is empty'}</h2>
      <p className="mx-auto mt-2 max-w-sm leading-relaxed text-ink-soft">
        {cleared
          ? 'Once you press send on WhatsApp, we’ll reply to confirm availability, delivery and payment, in shā’ Allāh.'
          : 'Start with our bestselling Talbeenah or a box of hand-picked dates.'}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href={talbeenah.href} className={buttonClass('gold')}>
          {talbeenah.cta}
        </Link>
        <Link href={dates.href} className={buttonClass('outline')}>
          {dates.cta}
        </Link>
      </div>
      <Link href="/shop" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
        Shop all products →
      </Link>
    </div>
  );
}
