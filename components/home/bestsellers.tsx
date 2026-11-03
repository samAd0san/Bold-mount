import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { getCatalog } from '@/lib/catalog';
import { categoryHref } from '@/lib/shop';
import { BestsellerTabs, type Tab } from './bestseller-tabs';

export async function Bestsellers() {
  const { categories, products } = await getCatalog();
  const tabs: Tab[] = [
    { id: 'bestsellers', label: 'Bestsellers', all: 'Shop all products', href: '/shop', products: products.filter((p) => p.tags.includes('bestseller')) },
    ...categories.map((c) => ({
      id: c.slug,
      label: c.short,
      all: `All ${c.short}`,
      href: categoryHref(c.slug),
      products: products.filter((p) => p.category === c.slug),
    })),
    { id: 'gifts', label: 'Gift Boxes', all: 'All gift boxes', href: '/shop?filter=gifts', products: products.filter((p) => p.tags.includes('gift')) },
  ];

  return (
    <section className="py-14 md:py-20">
      <Container>
        <Reveal>
          <SectionHeading eyebrow="Shop" title="Our" emphasis="bestsellers" link={{ label: 'Shop all', href: '/shop' }} />
        </Reveal>
        <BestsellerTabs tabs={tabs} />
      </Container>
    </section>
  );
}
