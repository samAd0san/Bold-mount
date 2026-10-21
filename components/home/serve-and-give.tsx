import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSection } from '@/lib/sections';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';

// The two most-asked services get the large tiles; the rest follow.
const ORDER = ['zakat', 'umrah', 'khidmat-e-khalq', 'giveaway', 'volunteer'];

/** Dark band with the five service sections: swipe row on phones, 2-large + 3-small bento from tablet up. */
export function ServeAndGive() {
  const items = ORDER.map(getSection);

  return (
    <section className="bg-night bg-lattice py-16 text-on-night md:py-24">
      <Container>
        <Reveal className="mb-10 grid gap-6 md:mb-14 md:grid-cols-[1.1fr_1fr] md:items-end md:gap-12">
          <SectionHeading dark eyebrow="Serve & Give" title="Five ways to" emphasis="do good" className="mb-0 md:mb-0" />
          <figure className="border-l-2 border-gold/60 pl-5">
            <blockquote className="leading-relaxed text-on-night">
              <p>
                “The example of those who spend their wealth in the way of Allah is like a seed of grain which grows
                seven spikes; in each spike is a hundred grains.”
              </p>
            </blockquote>
            <figcaption className="mt-2 text-xs font-semibold tracking-eyebrow text-gold uppercase">
              Al-Baqarah 2:261
            </figcaption>
          </figure>
        </Reveal>

        <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-6 md:gap-5 md:overflow-visible md:px-0 md:pb-0">
          {items.map((s, i) => {
            const big = i < 2;
            return (
              <li
                key={s.slug}
                className={cn(
                  'w-[80vw] max-w-[340px] shrink-0 snap-start md:w-auto md:max-w-none',
                  big ? 'md:col-span-3' : 'md:col-span-2',
                )}
              >
                <Reveal delay={i * 0.06}>
                  <Link
                    href={s.href}
                    className={cn(
                      'group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-night-2',
                      big ? 'md:aspect-[4/3] lg:aspect-[16/10]' : 'md:aspect-[3/4] lg:aspect-[5/4] xl:aspect-[4/3]',
                    )}
                  >
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      sizes={big ? '(min-width: 768px) 50vw, 80vw' : '(min-width: 768px) 33vw, 80vw'}
                      className="object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-105"
                    />
                    <div className="absolute inset-0 scrim-b" />
                    <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 lg:p-7">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-night/40 text-gold ring-1 ring-gold/40 backdrop-blur-sm">
                        <s.icon size={18} />
                      </span>
                      <h3 className={cn('mt-3 text-xl leading-tight text-on-night', big && 'lg:text-3xl')}>{s.title}</h3>
                      <p className="mt-1 text-sm text-on-night-soft">{s.tagline}</p>
                      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-pearl px-4 py-2 text-xs font-semibold text-ink transition-colors duration-300 group-hover:bg-gold group-hover:text-night">
                        {s.cta} <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
