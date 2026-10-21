import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { discountPct, formatINR } from '@/lib/format';
import { getSection } from '@/lib/sections';
import { QuickAdd } from './quick-add';

// Square studio card (Darkwood-style): cream tile, discount badge, label, name, price, quick add.
export function ProductCard({ product }: { product: Product }) {
  const v = product.variants[0];
  const off = discountPct(v.price, v.compareAt);
  const from = product.variants.length > 1 && new Set(product.variants.map((x) => x.price)).size > 1;

  return (
    <div className="group relative flex h-full flex-col">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-xl bg-pearl ring-1 ring-line ring-inset">
        {product.images[0] && (
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-5 transition-transform duration-700 ease-expo group-hover:scale-[1.06]"
          />
        )}
        {off != null && (
          <span className="absolute right-3 bottom-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy text-[0.72rem] font-bold text-gold">
            -{off}%
          </span>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-gold px-2.5 py-1 text-[0.68rem] font-bold tracking-wide text-night uppercase">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="text-xs text-ink-soft">{product.origin ?? getSection(product.section).short}</p>
        <Link href={`/product/${product.slug}`} className="mt-0.5 line-clamp-2 font-medium leading-snug text-ink hover:text-navy">
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold text-navy">
              {from && <span className="text-xs font-normal text-ink-soft">from </span>}
              {formatINR(v.price)}
            </span>
            {v.compareAt && v.compareAt > v.price && (
              <span className="text-xs text-ink-soft line-through">{formatINR(v.compareAt)}</span>
            )}
          </div>
          <QuickAdd product={product} />
        </div>
      </div>
    </div>
  );
}
