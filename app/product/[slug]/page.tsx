import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, ChevronDown, ChevronRight, MapPin, PackageCheck, Truck } from 'lucide-react';
import type { ShopSection } from '@/lib/types';
import { PRODUCTS, getProduct, relatedProducts } from '@/lib/products';
import { getSection } from '@/lib/sections';
import { SITE } from '@/lib/site';
import { formatINR } from '@/lib/format';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { Reveal } from '@/components/motion/reveal';
import { ProductRail } from '@/components/product/product-rail';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductPurchase } from '@/components/product/product-purchase';

type Props = { params: Promise<{ slug: string }> };

const ARABIC: Partial<Record<ShopSection, string>> = { talbeenah: 'تلبينة', dates: 'تمر', honey: 'عسل' };

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.name,
    description: product.tagline,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.tagline,
      images: product.images[0] ? [{ url: product.images[0].src, alt: product.images[0].alt }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const section = getSection(product.section);
  const related = relatedProducts(product);
  const prices = product.variants.map((v) => v.price);
  const details = [
    ...(product.details ?? []),
    {
      label: 'Delivery & ordering',
      value: `Free delivery on orders above ${formatINR(SITE.freeShippingAbove)}. Every order is confirmed on WhatsApp — availability, delivery and payment are agreed there before we dispatch. We deliver to your door — just share your address or location.`,
    },
  ];
  const assurances = [
    { icon: Truck, label: `Free delivery above ${formatINR(SITE.freeShippingAbove)}` },
    { icon: PackageCheck, label: product.section === 'wearings' ? 'Carefully packed' : 'Freshly packed' },
    { icon: WhatsAppGlyph, label: 'Order support on WhatsApp' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map((i) => `${SITE.url}${i.src}`),
    description: product.description,
    brand: { '@type': 'Brand', name: SITE.name },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: product.variants.length,
      availability: 'https://schema.org/InStock',
      url: `${SITE.url}/product/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escaping "<" stops a stray "</script>" in product text from closing the tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <Container>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 py-4 text-xs text-ink-soft md:py-6">
          <Link href="/" className="shrink-0 hover:text-navy">Home</Link>
          <ChevronRight size={12} className="shrink-0" />
          <Link href={section.href} className="shrink-0 hover:text-navy">{section.title}</Link>
          <ChevronRight size={12} className="shrink-0" />
          <span aria-current="page" className="truncate text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 pb-16 md:grid-cols-2 md:gap-10 md:pb-24 lg:gap-16">
          <div className="md:sticky md:top-36 md:self-start">
            <ProductGallery images={product.images} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {product.badge && (
                <span className="rounded-full bg-gold px-2.5 py-1 text-[0.68rem] font-bold tracking-wide text-night uppercase">
                  {product.badge}
                </span>
              )}
              {product.origin ? (
                <span className="flex items-center gap-1 text-sm text-ink-soft">
                  <MapPin size={14} className="text-gold-ink" /> {product.origin}
                </span>
              ) : (
                <span className="eyebrow">{section.title}</span>
              )}
              {ARABIC[product.section] && (
                <span lang="ar" dir="rtl" className="ml-auto font-arabic text-xl text-gold-ink">
                  {ARABIC[product.section]}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl leading-[1.1] text-ink md:text-[2.75rem]">{product.name}</h1>
            <p className="mt-3 text-lg leading-relaxed text-ink-soft">{product.tagline}</p>
            <div className="rule-gold my-6" />

            <ProductPurchase product={product} />

            <ul className="mt-6 grid grid-cols-3 gap-2">
              {assurances.map(({ icon: Icon, label }) => (
                <li key={label} className="flex flex-col items-center gap-2 rounded-xl bg-pearl px-2 py-3 text-center ring-1 ring-line ring-inset">
                  <Icon size={18} className="text-gold-ink" />
                  <span className="text-[0.72rem] leading-snug font-medium text-ink">{label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <h2 className="text-xl text-ink">About this product</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{product.description}</p>
              <ul className="mt-5 space-y-3">
                {product.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-ink">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold">
                      <Check size={12} strokeWidth={3} className="text-night" />
                    </span>
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10 divide-y divide-line overflow-hidden rounded-2xl bg-pearl ring-1 ring-line ring-inset">
              {details.map((d) => (
                <details key={d.label} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-ink [&::-webkit-details-marker]:hidden">
                    {d.label}
                    <ChevronDown size={18} className="shrink-0 text-ink-soft transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">{d.value}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-line bg-sand/50 py-14 md:py-20">
          <Container>
            <Reveal>
              <SectionHeading
                eyebrow="More to love"
                title="You may also"
                emphasis="like"
                link={{ label: `All ${section.short}`, href: section.href }}
              />
              <ProductRail products={related} />
            </Reveal>
          </Container>
        </section>
      )}
    </>
  );
}
