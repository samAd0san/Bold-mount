import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getCategory, getDelivery, getProduct, getProducts, relatedProducts } from '@/lib/catalog';
import { categoryHref } from '@/lib/shop';
import { SITE } from '@/lib/site';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { ProductRail } from '@/components/product/product-rail';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductInfo } from '@/components/product/product-info';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;
// Products added in /admin after the build are rendered on first visit.
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return (await getProducts()).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
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
  const product = await getProduct(slug);
  if (!product) notFound();

  const category = await getCategory(product.category);
  const related = await relatedProducts(product);
  const delivery = await getDelivery();
  const prices = product.variants.map((v) => v.price);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map((i) => (i.src.startsWith('http') ? i.src : `${SITE.url}${i.src}`)),
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
          <Link href={categoryHref(product.category)} className="shrink-0 hover:text-navy">{category?.name ?? 'Shop'}</Link>
          <ChevronRight size={12} className="shrink-0" />
          <span aria-current="page" className="truncate text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 pb-16 md:grid-cols-2 md:gap-10 md:pb-24 lg:gap-16">
          <div className="md:sticky md:top-36 md:self-start">
            <ProductGallery images={product.images} />
          </div>

          <ProductInfo product={product} categoryName={category?.name} delivery={delivery} />
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
                link={{ label: `All ${category?.short ?? 'products'}`, href: categoryHref(product.category) }}
              />
              <ProductRail products={related} />
            </Reveal>
          </Container>
        </section>
      )}
    </>
  );
}
