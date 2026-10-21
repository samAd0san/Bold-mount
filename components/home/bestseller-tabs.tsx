'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { bestsellers, giftProducts, productsBySection } from '@/lib/products';
import { cn } from '@/lib/utils';
import { buttonClass } from '@/components/ui/button-styles';
import { ProductRail } from '@/components/product/product-rail';

const TABS = [
  { id: 'bestsellers', label: 'Bestsellers', all: 'Shop all products', href: '/shop', products: bestsellers() },
  { id: 'talbeenah', label: 'Talbeenah', all: 'All Talbeenah', href: '/talbeenah', products: productsBySection('talbeenah') },
  { id: 'dates', label: 'Dates', all: 'All dates', href: '/dates', products: productsBySection('dates') },
  { id: 'honey', label: 'Honey', all: 'All honey', href: '/honey', products: productsBySection('honey') },
  { id: 'dry-fruits', label: 'Dry Fruits', all: 'All dry fruits', href: '/dry-fruits', products: productsBySection('dry-fruits') },
  { id: 'wearings', label: 'Wearings', all: 'All wearings', href: '/wearings', products: productsBySection('wearings') },
  { id: 'gifts', label: 'Gift Boxes', all: 'All gift boxes', href: '/shop?filter=gifts', products: giftProducts() },
];

/** Filter chips that swap one product rail; plain toggle buttons keep it simple for touch and keyboard. */
export function BestsellerTabs() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <>
      <div
        role="group"
        aria-label="Show products by category"
        className="no-scrollbar -mx-5 mb-8 flex scroll-px-5 gap-2 overflow-x-auto px-5 md:mx-0 md:mb-10 md:flex-wrap md:px-0"
      >
        {TABS.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(t.id)}
              className={cn(
                'h-11 shrink-0 rounded-full border px-5 text-sm font-medium transition-colors duration-300',
                on ? 'border-navy bg-navy text-on-night' : 'border-line bg-pearl text-ink hover:border-navy/40 hover:text-navy',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div key={tab.id} className="motion-safe:animate-fade-up">
        <ProductRail products={tab.products} />
      </div>

      <div className="mt-8 flex justify-center md:mt-10">
        <Link href={tab.href} className={buttonClass('outline')}>
          {tab.all} <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
