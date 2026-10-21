import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return <p className="py-16 text-center text-ink-soft">Nothing here yet — check back soon.</p>;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
