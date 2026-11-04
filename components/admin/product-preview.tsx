'use client';

import { Check, ChevronDown, MapPin } from 'lucide-react';
import { CategoriesProvider } from '@/components/layout/categories-context';
import { ProductCard } from '@/components/product/product-card';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductPurchase } from '@/components/product/product-purchase';
import type { Category, Product } from '@/lib/types';

/** Look-only copy of the product's shop tile and page, built from the real storefront parts; nothing in it can be clicked. */
export function ProductPreview({ product, categories }: { product: Product; categories: Category[] }) {
  const category = categories.find((c) => c.slug === product.category);
  return (
    <CategoriesProvider categories={categories}>
      <div inert data-testid="product-preview" className="flex flex-col gap-6">
        <section>
          <p className="mb-2 text-xs font-semibold text-ink-soft">In the shop list</p>
          <div className="w-[13rem] max-w-full">
            <ProductCard product={product} />
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold text-ink-soft">Its own page (as on a phone)</p>
          <div className="rounded-2xl bg-cream p-4 ring-1 ring-line ring-inset">
            <ProductGallery images={product.images} />
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
              {product.badge && <span className="rounded-full bg-gold px-2.5 py-1 text-[0.68rem] font-bold tracking-wide text-night uppercase">{product.badge}</span>}
              {product.origin ? (
                <span className="flex items-center gap-1 text-sm text-ink-soft"><MapPin size={14} className="text-gold-ink" /> {product.origin}</span>
              ) : (
                <span className="eyebrow">{category?.name}</span>
              )}
            </div>
            <h3 className="mt-3 text-2xl leading-[1.1] break-words text-ink">{product.name}</h3>
            {product.tagline && <p className="mt-2 leading-relaxed text-ink-soft">{product.tagline}</p>}
            <div className="rule-gold my-5" />
            <ProductPurchase product={product} />
            {(product.description || product.highlights.length > 0) && (
              <div className="mt-8">
                <h4 className="text-lg text-ink">About this product</h4>
                {product.description && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-soft">{product.description}</p>}
                <ul className="mt-4 space-y-2.5">
                  {product.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                      <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-gold"><Check size={11} strokeWidth={3} className="text-night" /></span>
                      <span className="leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.details.length > 0 && (
              <ul className="mt-6 divide-y divide-line overflow-hidden rounded-2xl bg-pearl ring-1 ring-line ring-inset">
                {product.details.map((d, i) => (
                  <li key={i} className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-ink">
                    {d.label}
                    <ChevronDown size={16} className="shrink-0 text-ink-soft" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </CategoriesProvider>
  );
}
