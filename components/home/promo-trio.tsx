import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PRODUCT_IMG } from '@/lib/media';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/motion/reveal';

const TONES = {
  gold: {
    card: 'bg-gold text-ink',
    eyebrow: 'text-ink/70',
    text: 'text-ink/80',
    pill: 'border-ink/30 text-ink group-hover:border-navy group-hover:bg-navy group-hover:text-on-night',
  },
  navy: {
    card: 'bg-navy text-on-night',
    eyebrow: 'text-gold',
    text: 'text-on-night-soft',
    pill: 'border-on-night/40 text-on-night group-hover:border-gold group-hover:bg-gold group-hover:text-night',
  },
  sand: {
    card: 'bg-sand text-ink',
    eyebrow: 'text-gold-ink',
    text: 'text-ink-soft',
    pill: 'border-navy/30 text-navy group-hover:border-navy group-hover:bg-navy group-hover:text-on-night',
  },
};

const PROMOS: {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  alt: string;
  tone: keyof typeof TONES;
  float?: boolean;
  frame: string; // where the cut-out sits; the round dates image bleeds off the corner
}[] = [
  {
    href: '/talbeenah',
    eyebrow: 'Talbeenah',
    title: 'Sunnah Superfood',
    text: 'Slow-roasted whole barley, ready in minutes.',
    image: PRODUCT_IMG.talbeenahPouch,
    alt: 'Bold Mount Talbeenah pouch',
    tone: 'gold',
    float: true,
    frame: '-right-1 top-6 bottom-3 w-[46%]',
  },
  {
    href: '/honey',
    eyebrow: 'Raw & unheated',
    title: 'Sidr Honey',
    text: 'Thick, buttery and deep in flavour.',
    image: PRODUCT_IMG.honeySidr,
    alt: 'Jar of Sidr honey',
    tone: 'navy',
    frame: 'right-3 top-8 bottom-5 w-[40%]',
  },
  {
    href: '/product/ajwa-dates',
    eyebrow: 'From Madinah',
    title: 'Ajwa Dates',
    text: 'The treasured soft, dark date of Madinah.',
    image: PRODUCT_IMG.dates.ajwa,
    alt: 'A heap of Ajwa dates',
    tone: 'sand',
    frame: '-right-12 -bottom-12 aspect-square w-[56%]',
  },
];

/** Three coloured promo cards (Talbeenah, Sidr honey, Ajwa) — each card is one big link. */
export function PromoTrio() {
  return (
    <section className="py-6 md:py-12">
      <Container>
        {/* Phones: swipe row with the next card peeking; md+: the original grid. */}
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pt-1 pb-3 md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pt-0 md:pb-0 lg:grid-cols-3">
          {PROMOS.map((p, i) => {
            const t = TONES[p.tone];
            return (
              // Off-screen cards never trigger the scroll-reveal, so on phones show them straight away.
              <Reveal
                key={p.href}
                delay={i * 0.08}
                className="w-[78vw] max-w-[320px] shrink-0 snap-start max-md:transform-none! max-md:opacity-100! md:w-auto md:max-w-none md:shrink md:last:col-span-2 lg:last:col-span-1"
              >
                <Link
                  href={p.href}
                  className={cn(
                    'group relative flex h-full min-h-[200px] overflow-hidden rounded-2xl p-5 transition-shadow duration-500 hover:shadow-card-hover md:min-h-[260px] md:p-8 lg:min-h-[300px]',
                    t.card,
                  )}
                >
                  <div className="relative z-10 flex max-w-[58%] flex-col">
                    <p className={cn('text-[0.7rem] font-semibold tracking-eyebrow uppercase', t.eyebrow)}>{p.eyebrow}</p>
                    <h3 className="mt-1.5 text-xl leading-tight md:mt-2 md:text-[1.7rem]">{p.title}</h3>
                    <p className={cn('mt-1.5 text-sm leading-relaxed md:mt-2', t.text)}>{p.text}</p>
                    <div className="mt-auto pt-4 md:pt-6">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-300',
                          t.pill,
                        )}
                      >
                        Shop now <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>

                  <div className={cn('pointer-events-none absolute', p.frame, p.float && 'motion-safe:animate-float')}>
                    <span aria-hidden className="absolute bottom-[6%] left-1/2 aspect-square w-[88%] -translate-x-1/2 rounded-full bg-pearl/20" />
                    <Image
                      src={p.image}
                      alt={p.alt}
                      fill
                      sizes="(min-width: 1024px) 18vw, (min-width: 640px) 25vw, 50vw"
                      className="object-contain object-bottom drop-shadow-xl transition-transform duration-700 ease-expo group-hover:scale-105"
                    />
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
