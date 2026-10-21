'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart, cartSubtotal } from '@/store/cart';
import { useHydrated } from '@/lib/use-hydrated';
import { formatINR } from '@/lib/format';
import { SITE } from '@/lib/site';
import { whatsappOrderLink } from '@/lib/whatsapp';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const hydrated = useHydrated();
  const { items, open, setOpen, setQty, remove } = useCart();
  const subtotal = cartSubtotal(items);
  const toFree = Math.max(0, SITE.freeShippingAbove - subtotal);
  const show = hydrated && open;

  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [show, setOpen]);

  return (
    <div className={cn('fixed inset-0 z-[70] overflow-hidden', show ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!show}>
      <div
        onClick={() => setOpen(false)}
        className={cn('absolute inset-0 bg-night/50 backdrop-blur-sm transition-opacity duration-300', show ? 'opacity-100' : 'opacity-0')}
      />
      <aside
        role="dialog"
        aria-label="Your cart"
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-pearl shadow-2xl transition-transform duration-500 ease-expo',
          show ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg text-ink">Your cart</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close cart" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand/60">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sand text-navy">
              <ShoppingBag size={26} />
            </span>
            <p className="text-ink">Your cart is empty</p>
            <p className="text-sm text-ink-soft">Start with our bestselling Talbeenah or a box of Ajwa dates.</p>
            <Link href="/shop" onClick={() => setOpen(false)} className={buttonClass('navy', 'mt-2')}>
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line bg-cream px-5 py-3 text-sm">
              {toFree > 0 ? (
                <p className="text-ink-soft">
                  Add <span className="font-semibold text-ink">{formatINR(toFree)}</span> more for free delivery
                </p>
              ) : (
                <p className="font-medium text-whatsapp-ink">You’ve unlocked free delivery</p>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
                <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${Math.min(100, (subtotal / SITE.freeShippingAbove) * 100)}%` }} />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-4 py-4">
                  <Link href={`/product/${item.slug}`} onClick={() => setOpen(false)} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-cream">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-contain p-1.5" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-ink-soft">{item.variant}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-full border border-line">
                        <button type="button" aria-label="Decrease" onClick={() => setQty(item.key, item.qty - 1)} className="flex h-8 w-8 items-center justify-center text-ink-soft hover:text-ink">
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">{item.qty}</span>
                        <button type="button" aria-label="Increase" onClick={() => setQty(item.key, item.qty + 1)} className="flex h-8 w-8 items-center justify-center text-ink-soft hover:text-ink">
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-ink">{formatINR(item.price * item.qty)}</span>
                    </div>
                  </div>
                  <button type="button" aria-label={`Remove ${item.name}`} onClick={() => remove(item.key)} className="self-start p-1 text-ink-soft hover:text-ink">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-line bg-pearl px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Subtotal</span>
                <span className="text-lg font-semibold text-ink">{formatINR(subtotal)}</span>
              </div>
              <Link href="/cart" onClick={() => setOpen(false)} className={buttonClass('navy', 'w-full py-3.5')}>
                Checkout
              </Link>
              <a
                href={whatsappOrderLink(items.map(({ name, variant, price, qty }) => ({ name, variant, price, qty })))}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass('whatsapp', 'w-full py-3.5')}
              >
                <WhatsAppGlyph size={18} /> Order on WhatsApp
              </a>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
