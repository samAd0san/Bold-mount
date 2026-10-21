import type { Metadata } from 'next';
import Link from 'next/link';
import { Gift, PackageCheck, Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { buttonClass } from '@/components/ui/button-styles';
import { Reveal } from '@/components/motion/reveal';
import { CategoryPage } from '@/components/shop/category-page';
import { PointGrid, type Point } from '@/components/shop/point-grid';
import { DRY_FRUITS } from '@/lib/media';
import { productsBySection } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Dry Fruits',
  description:
    'Whole almonds, cashews and walnut kernels, plus soft dry fruit barfi squares — for daily snacking, guests and gifting. Order on WhatsApp.',
};

const WHY: Point[] = [
  {
    icon: Sparkles,
    title: 'Everyday goodness',
    text: 'A handful of nuts with a few dates makes a simple, filling snack between meals.',
  },
  {
    icon: PackageCheck,
    title: 'Pick your pack',
    text: '250 g to try, bigger packs for the family — choose the size on each product.',
  },
  {
    icon: Gift,
    title: 'Made for sharing',
    text: 'Dry fruit barfi is lovely for guests, Eid and family visits.',
  },
];

export default function DryFruitsPage() {
  return (
    <CategoryPage
      slug="dry-fruits"
      heroImage={DRY_FRUITS.hero}
      heroIntro="Crunchy almonds, creamy cashews, mellow walnuts and soft dry fruit barfi — wholesome snacks for every day."
      before={
        <section className="bg-cream">
          <Container className="py-14 md:py-20">
            <SectionHeading eyebrow="Our dry fruits" title="Simple, wholesome," emphasis="for every day" />
            <PointGrid points={WHY} cols={3} />
          </Container>
        </section>
      }
      products={productsBySection('dry-fruits')}
      gridTitle="Shop dry fruits"
      gridIntro="Almonds, cashews and walnuts in pouch sizes for home, plus dry fruit barfi by the piece."
      divided
    >
      <section className="bg-sand">
        <Container className="py-12 md:py-16">
          <Reveal className="flex flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-2xl text-ink md:text-3xl">A Sunnah breakfast bowl</h2>
              <p className="mt-2 max-w-xl text-ink-soft">
                Top a warm bowl of Talbeenah with chopped almonds, walnuts and dates, then a spoonful of Sidr honey.
              </p>
            </div>
            <Link href="/talbeenah" className={buttonClass('navy', 'shrink-0')}>
              Shop Talbeenah
            </Link>
          </Reveal>
        </Container>
      </section>
    </CategoryPage>
  );
}
