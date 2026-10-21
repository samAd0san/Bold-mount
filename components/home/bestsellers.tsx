import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { BestsellerTabs } from './bestseller-tabs';

export function Bestsellers() {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <Reveal>
          <SectionHeading eyebrow="Shop" title="Our" emphasis="bestsellers" link={{ label: 'Shop all', href: '/shop' }} />
        </Reveal>
        <BestsellerTabs />
      </Container>
    </section>
  );
}
