import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CAMPAIGN, STOCK } from '@/lib/media';
import { cn } from '@/lib/utils';
import { buttonClass } from '@/components/ui/button-styles';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';

// Only creatives without health-treatment claims (FSSAI); the other CAMPAIGN posters are left out on purpose.
const POSTERS = [
  { src: CAMPAIGN.talbeenahBlue, alt: 'Poster: “Talbeenah Sunnah” — recommended by the Prophet Muhammad ﷺ, Bukhari 5417' },
  {
    src: CAMPAIGN.pouchesOutdoors,
    alt: 'Two pouches of Bold Mount Roasted Talbeenah on a railing outdoors',
    position: 'object-[54%_50%]', // 3:4 photo in a 9:16 tile — keeps both pouches in frame
  },
  { src: CAMPAIGN.griefLessener, alt: 'Poster: “Grief Lessener — Talbeenah, Sunnah Superfood”, citing Bukhari 5417' },
  { src: STOCK.porridgeBowl, alt: 'A bowl of warm porridge drizzled with honey' },
];

/** Bold Mount's Talbeenah creatives: swipe row of portrait tiles on phones, a row of four from tablet up. */
export function CampaignWall() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Talbeenah campaign"
            title="From our"
            emphasis="community"
            intro="Posters and photos from the Bold Mount Talbeenah campaign."
          />
        </Reveal>
        <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-auto md:grid md:max-w-5xl md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
          {POSTERS.map((p, i) => (
            <li key={p.src} className="w-[58vw] max-w-[260px] shrink-0 snap-start md:w-auto md:max-w-none">
              <Reveal delay={i * 0.06}>
                <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-night shadow-card ring-1 ring-line transition-transform duration-500 ease-expo hover:-translate-y-1.5">
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(min-width: 1024px) 240px, (min-width: 768px) 25vw, 60vw"
                    className={cn('object-cover', p.position)}
                  />
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex justify-center">
          <Link href="/talbeenah" className={buttonClass('outline')}>
            Shop Talbeenah <ArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
