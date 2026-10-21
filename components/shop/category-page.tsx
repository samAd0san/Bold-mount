import type { ReactNode } from 'react';
import { PageHero } from '@/components/ui/page-hero';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { buttonClass } from '@/components/ui/button-styles';
import { ProductGrid } from '@/components/product/product-grid';
import { Reveal } from '@/components/motion/reveal';
import { productsBySection } from '@/lib/products';
import { getSection } from '@/lib/sections';
import type { Product, ShopSection } from '@/lib/types';

interface Intro {
  eyebrow?: string;
  title: ReactNode;
  body: ReactNode;
  aside?: ReactNode;
}

/** Heading on the left, a few paragraphs on the right — the short "about this range" block. */
export function IntroBlock({ eyebrow, title, body, aside }: Intro) {
  return (
    <section className="bg-cream">
      <Container className="py-14 md:py-20">
        <Reveal className="grid gap-6 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {eyebrow && <div className="rule-gold mt-3" />}
            <h2 className="mt-4 text-3xl leading-tight text-ink md:text-[2.5rem]">{title}</h2>
          </div>
          <div className="space-y-4 leading-relaxed text-ink-soft md:col-span-7 md:pt-9 md:text-lg">
            {body}
            {aside && <div className="pt-3">{aside}</div>}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/** Shared layout for the shop categories: hero, optional intro, page-specific bands, product grid, then extras. */
export function CategoryPage({
  slug,
  heroImage,
  heroEyebrow,
  heroIntro,
  heroActions,
  intro,
  before,
  products,
  gridTitle,
  gridIntro,
  divided = false,
  children,
}: {
  slug: ShopSection;
  heroImage?: string;
  heroEyebrow?: string;
  heroIntro?: string;
  heroActions?: ReactNode;
  intro?: Intro;
  before?: ReactNode;
  products?: Product[];
  gridTitle?: string;
  gridIntro?: string;
  divided?: boolean; // hairline above the grid when the band before it is also cream
  children?: ReactNode;
}) {
  const section = getSection(slug);
  const list = products ?? productsBySection(slug);

  return (
    <>
      <PageHero
        eyebrow={heroEyebrow ?? section.tagline}
        title={section.title}
        intro={heroIntro ?? section.blurb}
        image={heroImage ?? section.image}
        crumbs={[{ label: 'Shop', href: '/shop' }, { label: section.short }]}
      >
        {heroActions ?? (
          <a href="#products" className={buttonClass('gold')}>
            {section.cta}
          </a>
        )}
      </PageHero>

      {intro && <IntroBlock {...intro} />}
      {before}

      <section id="products" className="scroll-mt-32 bg-cream">
        <Container className="py-14 md:py-20">
          <div className={divided ? 'border-t border-line pt-14 md:pt-20' : undefined}>
            <SectionHeading
              eyebrow={`${list.length} ${list.length === 1 ? 'product' : 'products'}`}
              title={gridTitle ?? `Shop ${section.short}`}
              intro={gridIntro}
              link={{ label: 'Shop all', href: '/shop' }}
            />
            <Reveal>
              <ProductGrid products={list} />
            </Reveal>
          </div>
        </Container>
      </section>

      {children}
    </>
  );
}
