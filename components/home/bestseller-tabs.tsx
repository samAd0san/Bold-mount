'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { buttonClass } from '@/components/ui/button-styles';
import { ProductRail } from '@/components/product/product-rail';

export interface Tab {
  id: string;
  label: string;
  all: string; // "see everything" button text
  href: string;
  products: Product[];
}

/** Filter chips that swap one product rail; plain toggle buttons keep it simple for touch and keyboard. */
export function BestsellerTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <>
      <div
        role="group"
        aria-label="Show products by category"
        className="no-scrollbar -mx-5 mb-8 flex scroll-px-5 gap-2 overflow-x-auto px-5 md:mx-0 md:mb-10 md:flex-wrap md:px-0"
      >
        {tabs.map((t) => {
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
