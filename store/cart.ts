'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Variant } from '@/lib/types';

export interface CartItem {
  key: string; // slug:variantId — one line per pack size
  slug: string;
  variantId: string;
  name: string;
  variant: string;
  price: number;
  compareAt?: number;
  image?: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
  add: (product: Product, variant: Variant, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      add: (product, variant, qty = 1) =>
        set((state) => {
          const key = `${product.slug}:${variant.id}`;
          const existing = state.items.find((i) => i.key === key);
          const items = existing
            ? state.items.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
            : [
                ...state.items,
                {
                  key,
                  slug: product.slug,
                  variantId: variant.id,
                  name: product.name,
                  variant: variant.label,
                  price: variant.price,
                  compareAt: variant.compareAt,
                  image: product.images[0]?.src,
                  qty,
                },
              ];
          return { items, open: true };
        }),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      setQty: (key, qty) =>
        set((state) => ({
          items: state.items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i)),
        })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      // Drawer open-state is per visit; only the items persist.
      name: 'boldmount-cart',
      version: 1,
      partialize: (s) => ({ items: s.items }),
      // v0 carts had no variantId; it is the tail of the "slug:variantId" key.
      migrate: (persisted) => {
        const old = (persisted as { items?: CartItem[] } | null)?.items ?? [];
        return {
          items: old.map((i) => ({ ...i, variantId: i.variantId ?? (i.key.startsWith(`${i.slug}:`) ? i.key.slice(i.slug.length + 1) : '') })),
        };
      },
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.qty, 0);
