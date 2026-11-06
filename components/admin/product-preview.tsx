'use client';

import * as React from 'react';
import { Eye } from 'lucide-react';
import { CategoriesProvider } from '@/components/layout/categories-context';
import { ProductCard } from '@/components/product/product-card';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductInfo } from '@/components/product/product-info';
import type { DeliverySettings } from '@/lib/delivery';
import type { Category, Product } from '@/lib/types';

/**
 * Wraps a live preview built from the real shop parts so it can be clicked like the shop.
 * Links go nowhere (onLink can scroll to another part of the preview); cart buttons only show a note, so the admin's own cart stays empty.
 */
export function PreviewFrame({ testId, onLink, children }: { testId: string; onLink?: (link: HTMLAnchorElement) => boolean; children: React.ReactNode }) {
  const [note, setNote] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const guard = (e: React.MouseEvent) => {
    const el = (e.target as Element).closest('a, [data-cart-action]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    if (el instanceof HTMLAnchorElement && onLink?.(el)) return;
    setNote(el.matches('[data-cart-action]') ? 'Just a preview. Customers add to cart here.' : 'Just a preview. Customers open this in the shop.');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(null), 2500);
  };

  return (
    <div data-testid={testId} onClickCapture={guard} className="relative flex flex-col gap-6">
      {note && (
        <p role="status" className="sticky top-2 z-10 -mb-4 flex items-center gap-2 self-center rounded-full bg-night px-3.5 py-1.5 text-xs font-semibold text-on-night shadow-card">
          <Eye className="size-3.5 shrink-0" />
          {note}
        </p>
      )}
      {children}
    </div>
  );
}

/** The product's shop tile and page, built from the real storefront parts, so everything works as in the shop: sizes, quantity, pictures, detail rows. */
export function ProductPreview({ product, categories, delivery }: { product: Product; categories: Category[]; delivery: DeliverySettings }) {
  const category = categories.find((c) => c.slug === product.category);
  const pageRef = React.useRef<HTMLElement>(null);
  // Tapping the tile "opens" the product: the page preview below scrolls into view.
  const openPage = () => {
    pageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  };

  return (
    <CategoriesProvider categories={categories}>
      <PreviewFrame testId="product-preview" onLink={openPage}>
        <section>
          <p className="mb-2 text-xs font-semibold text-ink-soft">In the shop list (tap it to see its page)</p>
          <div className="w-[13rem] max-w-full">
            <ProductCard product={product} />
          </div>
        </section>

        <section ref={pageRef} className="scroll-mt-4">
          <p className="mb-2 text-xs font-semibold text-ink-soft">Its own page (as on a phone)</p>
          <div className="flex flex-col gap-6 rounded-2xl bg-cream p-4 ring-1 ring-line ring-inset">
            <ProductGallery images={product.images} />
            <ProductInfo product={product} categoryName={category?.name} delivery={delivery} preview />
          </div>
        </section>
      </PreviewFrame>
    </CategoriesProvider>
  );
}
