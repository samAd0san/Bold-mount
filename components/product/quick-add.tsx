'use client';

import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from '@/store/cart';

/** Adds the first pack size to the cart and opens the drawer. */
export function QuickAdd({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  return (
    <button
      type="button"
      onClick={() => add(product, product.variants[0])}
      aria-label={`Add ${product.name} (${product.variants[0].label}) to cart`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-on-night transition-colors hover:bg-gold hover:text-night"
    >
      <ShoppingBag size={17} />
    </button>
  );
}
