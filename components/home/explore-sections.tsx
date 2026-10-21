import Image from 'next/image';
import Link from 'next/link';
import { PRODUCT_IMG } from '@/lib/media';
import { SECTIONS } from '@/lib/sections';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';

// Transparent product cut-outs sit inside the circle; photos fill it.
const CUTOUTS = new Set<string>([PRODUCT_IMG.talbeenahPouch, PRODUCT_IMG.honeySidr, ...Object.values(PRODUCT_IMG.dates)]);

/** All nine sections as round photo tiles: 3 per row on phones, one row of 9 on desktop. */
export function ExploreSections() {
  return (
    <section className="pt-14 pb-8 md:pt-20 md:pb-12">
      <Container>
        <Reveal>
          <SectionHeading align="center" eyebrow="Shop & serve" title="Explore" emphasis="Bold Mount" />
        </Reveal>
        <ul className="flex flex-wrap justify-center gap-y-7 md:gap-y-10">
          {SECTIONS.map((s, i) => (
            <li key={s.slug} className="w-1/3 px-1.5 sm:w-1/5 lg:w-[11.111%] lg:px-2">
              <Reveal delay={i * 0.04}>
                <Link href={s.href} className="group flex flex-col items-center text-center">
                  <span className="relative block aspect-square w-full max-w-[96px] overflow-hidden rounded-full bg-pearl shadow-card ring-1 ring-line ring-offset-4 ring-offset-cream transition-all duration-500 ease-expo group-hover:-translate-y-1 group-hover:ring-2 group-hover:ring-gold sm:max-w-[112px] lg:max-w-[128px]">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 128px, 112px"
                      className={cn(
                        'transition-transform duration-700 ease-expo group-hover:scale-110',
                        CUTOUTS.has(s.image) ? 'object-contain p-3' : 'object-cover',
                      )}
                    />
                  </span>
                  <span className="mt-3 text-sm font-semibold text-ink transition-colors group-hover:text-navy md:text-[0.95rem]">
                    {s.short}
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
