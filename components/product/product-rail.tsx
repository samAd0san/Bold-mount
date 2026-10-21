'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

// Swipeable row of product cards with arrow controls on larger screens.
export function ProductRail({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });

  if (!products.length) return null;

  return (
    <div className="relative">
      <div ref={ref} className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:scroll-px-0 md:gap-6 md:px-0">
        {products.map((p) => (
          <div key={p.slug} className="w-[46vw] shrink-0 snap-start sm:w-[31%] lg:w-[calc(25%-18px)]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {products.length > 4 && (
        <div className="mt-6 hidden justify-center gap-3 md:flex">
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => scroll(d as 1 | -1)}
              aria-label={d < 0 ? 'Previous' : 'Next'}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-navy hover:bg-navy hover:text-on-night"
            >
              {d < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
