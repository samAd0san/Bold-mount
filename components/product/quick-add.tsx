'use client';

import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/types';
import { cheapestVariant } from '@/lib/shop';
import { useCart } from '@/store/cart';

/** Adds the size whose price the card shows (the cheapest) to the cart and opens the drawer. */
export function QuickAdd({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const v = cheapestVariant(product);
  return (
    <button
      type="button"
      onClick={() => add(product, v)}
      aria-label={`Add ${product.name}${v.label ? ` (${v.label})` : ''} to cart`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-on-night transition-colors hover:bg-gold hover:text-night"
    >
      <ShoppingBag size={17} />
    </button>
  );
}
