import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/ui/page-hero';
import { Container } from '@/components/ui/container';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { ProductGrid } from '@/components/product/product-grid';
import { Reveal } from '@/components/motion/reveal';
import { ShopCategoryTiles, categoryLabel } from '@/components/shop/shop-category-tiles';
import { ShopActiveFilters, ShopEmptyState, applyShopQuery } from '@/components/shop/shop-filters';
import { ShopToolbar } from '@/components/shop/shop-toolbar';
import { parseShopQuery, shopHref, type ShopSearchParams } from '@/components/shop/shop-query';
import { STOCK } from '@/lib/media';
import { getSection } from '@/lib/sections';
import { whatsappGeneralLink } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Shop Bold Mount: premium roasted Talbeenah, hand-picked dates, raw Sidr honey, modest wear and gift boxes — order in a few taps on WhatsApp.',
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  const query = parseShopQuery(await searchParams);
  const products = applyShopQuery(query);
  const title = query.q ? `Results for “${query.q}”` : query.filter ? categoryLabel(query.filter) : 'All products';
  const section = query.filter && query.filter !== 'gifts' ? getSection(query.filter) : undefined;

  return (
    <>
      <PageHero
        eyebrow="The Bold Mount store"
        title="Shop"
        emphasis="all"
        intro="Talbeenah, hand-picked dates, raw Sidr honey and modest wear — add to cart and send your order on WhatsApp."
        image={STOCK.datesHero}
        crumbs={[{ label: 'Shop' }]}
      />

      <section className="bg-cream">
        <Container className="py-10 md:py-14">
          <ShopCategoryTiles query={query} />

          <div className="mt-8 flex flex-col gap-4 border-t border-line pt-8 md:mt-10 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl text-ink md:text-3xl">{title}</h2>
              <div className="flex flex-wrap items-center gap-x-4">
                <p className="text-sm text-ink-soft" aria-live="polite">
                  {products.length} {products.length === 1 ? 'product' : 'products'}
                </p>
                {section && (
                  <Link
                    href={section.href}
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-navy underline-offset-4 hover:underline"
                  >
                    More about {section.short} <ArrowRight size={15} aria-hidden />
                  </Link>
                )}
              </div>
            </div>
            <ShopToolbar query={query} />
          </div>

          <ShopActiveFilters query={query} />

          <div className="mt-6 md:mt-8">
            <Reveal key={shopHref(query)}>
              {products.length ? <ProductGrid products={products} /> : <ShopEmptyState query={query} />}
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="bg-sand">
        <Container className="flex flex-col items-center gap-5 py-12 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="text-2xl text-ink">Not sure what to pick?</h2>
            <p className="mt-1 text-ink-soft">Message us — we&apos;ll help you choose, or put together a gift.</p>
          </div>
          <a href={whatsappGeneralLink()} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'shrink-0')}>
            <WhatsAppGlyph size={18} /> Ask on WhatsApp
          </a>
        </Container>
      </section>
    </>
  );
}
