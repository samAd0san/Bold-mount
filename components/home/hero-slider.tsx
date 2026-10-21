'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type PanInfo, type Variants } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { BRAND, CAMPAIGN, PRODUCT_IMG, STOCK } from '@/lib/media';
import { useHydrated } from '@/lib/use-hydrated';
import { cn } from '@/lib/utils';
import { buttonClass } from '@/components/ui/button-styles';
import { Container } from '@/components/ui/container';

interface Slide {
  image: string;
  alt: string;
  position?: string; // keeps the photo's subject clear of the text on narrow crops
  eyebrow: string;
  before: string;
  accent: string;
  after?: string;
  subtitle: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  showcase?: boolean; // Talbeenah pouch + poster stacked on the right
}

const SLIDES: Slide[] = [
  {
    image: BRAND.mountainHero,
    alt: 'Snow-capped mountain peak above the clouds',
    position: 'object-[60%_50%]',
    eyebrow: 'The Sunnah superfood',
    before: 'Nourish your body, relieve your ',
    accent: 'heart',
    subtitle: 'Discover Talbeenah — slow-roasted whole barley, the Sunnah superfood that restores vitality and calms the soul.',
    cta: { label: 'Shop Talbeenah', href: '/talbeenah' },
    secondary: { label: 'Browse the shop', href: '/shop' },
    showcase: true,
  },
  {
    image: STOCK.datesHero,
    alt: 'A white bowl of soft dark dates on a wooden table',
    position: 'object-[68%_50%]',
    eyebrow: 'Premium dates',
    before: 'Hand-picked ',
    accent: 'dates',
    after: ' from blessed lands',
    subtitle: 'Ajwa, Medjool, Safawi and more — from Madinah, Jordan and beyond.',
    cta: { label: 'Shop dates', href: '/dates' },
    secondary: { label: 'Gift boxes', href: '/shop?filter=gifts' },
  },
  {
    image: STOCK.kaaba,
    alt: 'The Kaaba at Masjid al-Haram in Makkah',
    eyebrow: 'Umrah Badal',
    before: 'An Umrah for the ones you ',
    accent: 'love',
    subtitle: 'Performed in Makkah on behalf of a parent or loved one who cannot travel.',
    cta: { label: 'Book Umrah Badal', href: '/umrah' },
  },
  {
    image: STOCK.givingHands,
    alt: 'Hands passing a food parcel to someone in need',
    eyebrow: 'Zakat for the needy',
    before: 'Your Zakat, delivered with ',
    accent: 'care',
    subtitle: 'Supporting madrasa students, imams, mu‘azzins and families in need.',
    cta: { label: 'Give Zakat', href: '/zakat' },
  },
];

// Real pouch photo in front of the Bukhari 5417 poster; the cure-claim posters stay off the site (FSSAI).
function TalbeenahShowcase() {
  return (
    <div className="pointer-events-none absolute top-4 right-4 h-[22%] w-[30%] max-w-[140px] md:top-1/2 md:right-[6%] md:h-[66%] md:w-[30%] md:max-w-[420px] md:-translate-y-1/2">
      <div className="absolute top-0 right-0 aspect-[9/16] h-full rotate-6 overflow-hidden rounded-2xl opacity-90 shadow-card-hover ring-1 ring-white/20">
        <Image src={CAMPAIGN.griefLessener} alt="" fill sizes="(max-width: 768px) 120px, 300px" className="object-cover" />
      </div>
      <div className="absolute bottom-0 left-0 aspect-[2/3] h-[88%] -rotate-3 motion-safe:animate-float">
        <Image
          src={PRODUCT_IMG.talbeenahPouch}
          alt="Bold Mount Talbeenah pouch"
          fill
          sizes="(max-width: 768px) 130px, 320px"
          className="object-contain drop-shadow-[0_24px_40px_rgb(0_0_0/0.45)]"
        />
      </div>
    </div>
  );
}

const INTERVAL = 6500;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// New slide fades in on top while the old one holds, so the crossfade never dips to black.
const SLIDE_V: Variants = {
  enter: { opacity: 0, zIndex: 1 },
  center: { opacity: 1, zIndex: 1, transition: { duration: 1, ease: 'easeInOut' } },
  exit: { opacity: 0, zIndex: 0, transition: { duration: 0.4, delay: 0.8 } },
};

const textV = (lift: number): Variants => ({
  enter: { opacity: 0, y: lift },
  center: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.3 + i * 0.1, ease: EASE } }),
  exit: { opacity: 0, transition: { duration: 0.25 } },
});

export function HeroSlider() {
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);

  const count = SLIDES.length;
  const slide = SLIDES[index];
  const next = SLIDES[(index + 1) % count];
  // Reduced-motion is only read after hydration so server and client markup match.
  const ticking = hydrated && !reduce && !hover;
  const item = textV(hydrated && reduce ? 0 : 18);

  const go = (n: number) => setIndex((n + count) % count);

  useEffect(() => {
    if (!ticking) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearTimeout(t);
  }, [index, ticking, count]);

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const { x, y } = info.offset;
    if (Math.abs(x) < 50 || Math.abs(x) < Math.abs(y)) return;
    go(index + (x < 0 ? 1 : -1));
  };

  return (
    <motion.section
      aria-roledescription="carousel"
      aria-label="Featured at Bold Mount"
      className="relative isolate h-[62svh] min-h-[460px] overflow-hidden bg-night md:h-[86vh] md:min-h-[580px]"
      style={{ touchAction: 'pan-y' }}
      onPanEnd={onPanEnd}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      {/* Warm the cache for the next photo so its fade-in never shows an empty frame. */}
      <Image src={next.image} alt="" aria-hidden fill sizes="100vw" className="pointer-events-none -z-10 object-cover opacity-0" />

      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${count}`}
          variants={SLIDE_V}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className={cn('object-cover motion-safe:animate-ken-burns', slide.position)}
          />
          {/* Copy spans the full width on phones, so it needs an even tint over bright photos. */}
          <div className="absolute inset-0 bg-night/35 md:hidden" />
          <div className="absolute inset-0 scrim-full md:hidden" />
          <div className="absolute inset-0 hidden scrim-l md:block" />

          {slide.showcase && <TalbeenahShowcase />}

          <Container className="relative flex h-full flex-col justify-end pb-16 md:justify-center md:pb-8">
            <div className="max-w-xl lg:max-w-2xl">
              <motion.p
                variants={item}
                custom={0}
                className="inline-flex items-center rounded-full border border-gold/60 bg-night/30 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-eyebrow text-gold uppercase backdrop-blur-sm"
              >
                {slide.eyebrow}
              </motion.p>
              <motion.p
                variants={item}
                custom={1}
                className="mt-5 font-display text-[2.3rem] leading-[1.05] font-semibold tracking-tight text-balance text-on-night sm:text-5xl md:mt-6 md:text-6xl lg:text-7xl"
              >
                {slide.before}
                <span className="text-gold">{slide.accent}</span>
                {slide.after}
              </motion.p>
              <motion.p
                variants={item}
                custom={2}
                className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-on-night-soft md:mt-6 md:text-lg"
              >
                {slide.subtitle}
              </motion.p>
              <motion.div variants={item} custom={3} className="mt-6 flex flex-wrap gap-3 md:mt-9">
                <Link href={slide.cta.href} className={buttonClass('gold', 'md:px-8 md:py-3.5')}>
                  {slide.cta.label} <ArrowRight size={16} />
                </Link>
                {slide.secondary && (
                  <Link href={slide.secondary.href} className={buttonClass('outline-light', 'md:px-8 md:py-3.5')}>
                    {slide.secondary.label}
                  </Link>
                )}
              </motion.div>
            </div>
          </Container>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 z-10">
        <Container className="flex items-center justify-between pb-4 md:pb-9">
          <div className="flex items-center">
            {SLIDES.map((s, i) => (
              <button
                key={s.eyebrow}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1} of ${count}: ${s.eyebrow}`}
                aria-current={i === index ? 'true' : undefined}
                className="group flex h-11 items-center px-1"
              >
                <span
                  className={cn(
                    'block h-1 rounded-full transition-all duration-500 ease-expo',
                    i === index ? 'w-10 bg-gold' : 'w-5 bg-on-night/35 group-hover:bg-on-night/70',
                  )}
                />
              </button>
            ))}
          </div>

          <div className="hidden gap-3 md:flex">
            {([-1, 1] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => go(index + d)}
                aria-label={d < 0 ? 'Previous slide' : 'Next slide'}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-on-night/30 text-on-night transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-night"
              >
                {d < 0 ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            ))}
          </div>
        </Container>
      </div>
    </motion.section>
  );
}
