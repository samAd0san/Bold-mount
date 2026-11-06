'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/types';
import { discountPct, formatINR } from '@/lib/format';
import { useCart } from '@/store/cart';
import { buttonClass } from '@/components/ui/button-styles';
import { cn } from '@/lib/utils';
import { QtyStepper } from './qty-stepper';

// Wear variants are sizes (S/M/52…) or colours (Black/Navy…); weights and boxes are pack sizes; anything else (e.g. Paperback) is an option.
function optionName(product: Product): string {
  const labels = product.variants.map((v) => v.label);
  if (product.category === 'wearings') return labels.every((l) => /^(XS|S|M|L|XL|XXL|\d+)$/.test(l)) ? 'Size' : 'Colour';
  return labels.every((l) => /\d|pack|box|pouch|jar|bottle/i.test(l)) ? 'Pack size' : 'Option';
}

/** Price (follows the chosen variant), variant pills, quantity, add to cart and buy now (pay online or cash on delivery at checkout). */
export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [qty, setQty] = useState(1);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const off = discountPct(variant.price, variant.compareAt);
  const option = optionName(product);

  const buyNow = () => {
    add(product, variant, qty);
    // add() opens the drawer; skip it since we're heading straight to checkout.
    setOpen(false);
    router.push('/cart');
  };

  return (
    <div>
      <div key={variant.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 animate-in fade-in duration-300">
        <span className="text-3xl font-semibold tabular-nums text-navy">{formatINR(variant.price)}</span>
        {off != null && variant.compareAt && (
          <>
            <span className="text-lg tabular-nums text-ink-soft line-through">{formatINR(variant.compareAt)}</span>
            <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-night">{off}% off</span>
          </>
        )}
      </div>

      {/* One version with no size (e.g. a book): nothing to choose. */}
      {(product.variants.length > 1 || variant.label) && (
        <fieldset className="mt-7">
          <legend className="text-sm text-ink-soft">
            {option}: <span className="font-semibold text-ink">{variant.label}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const selected = v.id === variant.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setVariantId(v.id)}
                  className={cn(
                    'min-h-11 min-w-14 rounded-full border px-5 text-sm font-medium transition-colors duration-200',
                    selected ? 'border-navy bg-navy text-on-night' : 'border-line bg-pearl text-ink hover:border-navy/50',
                  )}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-7 flex gap-3">
        <QtyStepper value={qty} onChange={setQty} className="h-12" />
        <button type="button" data-cart-action onClick={() => add(product, variant, qty)} className={buttonClass('navy', 'h-12 flex-1')}>
          <ShoppingBag size={17} /> Add to cart
        </button>
      </div>
      <button type="button" data-cart-action onClick={buyNow} className={buttonClass('gold', 'mt-3 h-12 w-full')}>
        Buy now
      </button>
      <p className="mt-3 text-center text-xs text-ink-soft">Pay online (UPI, cards, netbanking) or cash on delivery.</p>
    </div>
  );
}
