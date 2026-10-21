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
    <section className="overflow-hidden bg-sand bg-lattice-ink py-16 md:py-24">
      <Container className="grid items-center gap-12 md:grid-cols-2 lg:gap-20">
        <Reveal direction="right" className="relative mx-auto w-full max-w-md md:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-night shadow-card">
            <Image
              src={PRODUCT_IMG.talbeenahPhoto}
              alt="A pouch of Bold Mount Premium Roasted Talbeenah"
              fill
              sizes="(min-width: 1024px) 42vw, (min-width: 768px) 46vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -right-3 -bottom-6 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-night text-center shadow-card ring-4 ring-sand md:-right-8 md:h-32 md:w-32">
            <span lang="ar" dir="rtl" className="font-arabic text-3xl leading-none text-gold md:text-4xl">
              تلبينة
            </span>
            <span className="mt-1.5 text-[0.6rem] font-semibold tracking-eyebrow text-on-night-soft uppercase">Talbeenah</span>
          </div>
        </Reveal>

        <Reveal direction="left">
          <SectionHeading
            eyebrow="The Sunnah Superfood"
            title="Comfort for the heart,"
            emphasis="nourishment for the day"
            className="mb-5 md:mb-6"
          />
          <p className="leading-relaxed text-ink-soft">
            Talbeenah is a soft, milky porridge of finely ground barley — a food the Prophet ﷺ recommended in times of
            grief. Ours is whole barley, cleaned, slow-roasted and finely milled, with nothing else added.
          </p>

          <figure className="mt-7 rounded-2xl border-l-4 border-gold bg-pearl/80 p-5 md:p-6">
            <Quote size={22} aria-hidden className="text-gold-deep" />
            <blockquote className="mt-2 text-lg leading-snug font-medium text-ink md:text-xl">
              <p>“At-Talbina gives rest to the heart of the sick person and relieves some of his sorrow.”</p>
            </blockquote>
            <figcaption className="mt-3 text-sm text-ink-soft">
              The Prophet Muhammad ﷺ — <cite className="font-semibold text-gold-ink not-italic">Sahih al-Bukhari 5417</cite>
            </figcaption>
          </figure>

          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-6">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pearl text-gold-ink ring-1 ring-gold-deep/40">
                  <p.icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{p.title}</span>
                  <span className="mt-0.5 block text-[0.82rem] leading-snug text-ink-soft">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <Link href="/talbeenah" className={buttonClass('navy', 'mt-9')}>
            Shop Talbeenah <ArrowRight size={16} />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
