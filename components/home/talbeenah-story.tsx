import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Leaf, Quote, ShieldCheck, Timer, Wheat } from 'lucide-react';
import { PRODUCT_IMG } from '@/lib/media';
import { buttonClass } from '@/components/ui/button-styles';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';

// Nutrition lines stay general (FSSAI): what barley contains, never what it cures.
const POINTS = [
  { icon: Wheat, title: 'Rich in fibre', text: 'Made from 100% whole barley.' },
  { icon: Leaf, title: 'Magnesium & potassium', text: 'Minerals barley is naturally rich in.' },
  { icon: ShieldCheck, title: 'No additives', text: 'No sugar, preservatives or fillers.' },
  { icon: Timer, title: 'Ready in minutes', text: 'Stir into warm milk for 5–7 minutes.' },
];

/** Photo + story split for Talbeenah: hadith, four plain benefits and one CTA. */
export function TalbeenahStory() {
  return (
    <section className="overflow-hidden bg-sand bg-lattice-ink py-9 md:py-24">
      <Container className="grid items-center gap-8 md:grid-cols-2 md:gap-12 lg:gap-20">
        <Reveal direction="right" className="relative mx-auto w-full max-w-md md:max-w-none">
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-night shadow-card md:aspect-[4/5]">
            <Image
              src={PRODUCT_IMG.talbeenahPhoto}
              alt="A pouch of Bold Mount Premium Roasted Talbeenah"
              fill
              sizes="(min-width: 1024px) 42vw, (min-width: 768px) 46vw, 100vw"
              className="object-cover object-[50%_20%] md:object-center"
            />
          </div>
          <div className="absolute -right-2 -bottom-4 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-night text-center shadow-card ring-4 ring-sand md:-right-8 md:-bottom-6 md:h-32 md:w-32">
            <span lang="ar" dir="rtl" className="font-arabic text-2xl leading-none text-gold md:text-4xl">
              تلبينة
            </span>
            <span className="mt-1 text-[0.5rem] font-semibold tracking-eyebrow text-on-night-soft uppercase md:mt-1.5 md:text-[0.6rem]">Talbeenah</span>
          </div>
        </Reveal>

        <Reveal direction="left">
          <SectionHeading
            eyebrow="The Sunnah Superfood"
            title="Comfort for the heart,"
            emphasis="nourishment for the day"
            className="mb-3 md:mb-6"
          />
          <p className="text-[0.9375rem] leading-relaxed text-ink-soft md:text-base">
            Talbeenah is a soft, milky porridge of finely ground barley — a food the Prophet ﷺ recommended in times of
            grief. Ours is whole barley, cleaned, slow-roasted and finely milled, with nothing else added.
          </p>

          <figure className="mt-5 rounded-2xl border-l-4 border-gold bg-pearl/80 p-4 md:mt-7 md:p-6">
            <Quote size={22} aria-hidden className="text-gold-deep max-md:hidden" />
            <blockquote className="text-base leading-snug font-medium text-ink md:mt-2 md:text-xl">
              <p>“At-Talbina gives rest to the heart of the sick person and relieves some of his sorrow.”</p>
            </blockquote>
            <figcaption className="mt-2 text-[0.8125rem] text-ink-soft md:mt-3 md:text-sm">
              The Prophet Muhammad ﷺ — <cite className="font-semibold text-gold-ink not-italic">Sahih al-Bukhari 5417</cite>
            </figcaption>
          </figure>

          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 md:mt-8 md:gap-x-5 md:gap-y-6">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-2.5 md:gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pearl text-gold-ink ring-1 ring-gold-deep/40 md:h-10 md:w-10">
                  <p.icon size={18} className="max-md:size-4" />
                </span>
                <span>
                  <span className="block text-[0.8125rem] leading-snug font-semibold text-ink md:text-sm md:leading-5">{p.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-soft md:text-[0.82rem]">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <Link href="/talbeenah" className={buttonClass('navy', 'mt-6 max-md:w-full md:mt-9')}>
            Shop Talbeenah <ArrowRight size={16} />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
