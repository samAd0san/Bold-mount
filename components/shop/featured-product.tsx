import Link from 'next/link';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { buttonClass } from '@/components/ui/button-styles';
import { Reveal } from '@/components/motion/reveal';
import { formatINR } from '@/lib/format';
import { lowestPrice } from '@/lib/shop';
import type { Product } from '@/lib/types';

/** Spotlight for one product: floating pack shot, "from" price, highlights and a choose-pack button (payment happens at checkout). */
export function FeaturedProduct({ product, eyebrow = 'Featured' }: { product: Product; eyebrow?: string }) {
  const img = product.images[0];

  return (
    <section className="bg-cream">
      <Container className="py-14 md:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-20">
          <Reveal direction="right">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-pearl bg-lattice-ink ring-1 ring-line ring-inset">
              {img && (
                <div className="absolute inset-[12%] animate-float">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 768px) 75vw, 38vw"
                    className="object-contain drop-shadow-2xl"
                  />
                </div>
              )}
              {product.badge && (
                <span className="absolute top-4 left-4 rounded-full bg-gold px-3 py-1 text-xs font-bold tracking-wide text-night uppercase">
                  {product.badge}
                </span>
              )}
            </div>
          </Reveal>

          <Reveal>
            <p className="eyebrow">{eyebrow}</p>
            <div className="rule-gold mt-3" />
            <h2 className="mt-4 text-3xl leading-tight text-ink md:text-[2.75rem]">{product.name}</h2>
            <p className="mt-3 text-ink-soft md:text-lg">{product.tagline}</p>

            <p className="mt-6 flex items-baseline gap-2">
              <span className="text-sm text-ink-soft">from</span>
              <span className="text-3xl font-semibold text-navy">{formatINR(lowestPrice(product))}</span>
            </p>
            {product.variants.length > 1 && (
              <p className="mt-1 text-sm text-ink-soft">Packs: {product.variants.map((v) => v.label).join(' · ')}</p>
            )}

            <ul className="mt-6 space-y-3">
              {product.highlights.map((h) => (
                <li key={h} className="flex gap-3 text-ink">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/25 text-gold-ink">
                    <Check size={13} strokeWidth={3} aria-hidden />
                  </span>
                  {h}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/product/${product.slug}`} className={buttonClass('gold')}>
                Choose pack
              </Link>
            </div>
            <p className="mt-3 text-sm text-ink-soft">Pay online at checkout with UPI, cards or netbanking.</p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
