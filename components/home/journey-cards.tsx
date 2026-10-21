import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Home, MapPin, Navigation } from 'lucide-react';
import { formatINR } from '@/lib/format';
import { PRODUCT_IMG } from '@/lib/media';
import { SITE } from '@/lib/site';
import { whatsappGeneralLink } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';
import { buttonClass } from '@/components/ui/button-styles';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { Reveal } from '@/components/motion/reveal';

// Mini UI mock-ups: plain divs, no real data, hidden from screen readers (the caption says it all).
function PackIllustration() {
  return (
    <div className="w-40 rounded-xl bg-pearl p-2.5 shadow-card ring-1 ring-line">
      <div className="relative h-24 overflow-hidden rounded-lg bg-cream">
        <Image src={PRODUCT_IMG.talbeenahPouch} alt="" fill sizes="160px" className="object-contain p-2" />
      </div>
      <p className="mt-2 text-[11px] font-semibold leading-tight text-ink">Premium Roasted Talbeenah</p>
      <div className="mt-2 flex gap-1">
        {['250 g', '500 g', '1 kg'].map((label, i) => (
          <span
            key={label}
            className={cn(
              'flex-1 rounded-full py-1 text-center text-[10px] font-semibold',
              i === 1 ? 'bg-navy text-on-night' : 'border border-navy/30 text-navy',
            )}
          >
            {label}
          </span>
        ))}
      </div>
      <span className="mt-2 block rounded-full bg-gold py-1.5 text-center text-[10px] font-semibold text-night">
        Add to order
      </span>
    </div>
  );
}

function ChatIllustration() {
  return (
    <div className="w-44 overflow-hidden rounded-xl bg-pearl shadow-card ring-1 ring-line">
      <div className="flex items-center gap-1.5 border-b border-line px-2.5 py-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-whatsapp text-night">
          <WhatsAppGlyph size={12} />
        </span>
        <span className="text-[10px] font-semibold text-ink">Bold Mount</span>
      </div>
      <div className="p-2.5">
        <div className="relative rounded-lg rounded-tr-none bg-whatsapp/25 p-2 text-[10px] leading-snug text-ink">
          <p className="font-semibold">Assalamu alaikum Bold Mount, I would like to order:</p>
          <p className="mt-1.5">• Talbeenah (500 g) × 1</p>
          <p>• Ajwa dates (500 g) × 1</p>
        </div>
        <p className="mt-1.5 text-right text-[9px] text-ink-soft">Sent ✓✓</p>
      </div>
    </div>
  );
}

function PinIllustration() {
  return (
    <div className="relative h-44 w-44 overflow-hidden rounded-xl bg-pearl shadow-card ring-1 ring-line">
      <div className="absolute inset-0 bg-lattice-ink" />
      <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-navy text-on-night">
        <Home size={14} />
      </span>
      <svg viewBox="0 0 176 176" aria-hidden="true" className="absolute inset-0 h-full w-full">
        <path d="M26 42 C26 96 70 104 114 104" fill="none" strokeWidth={2} strokeDasharray="4 4" className="stroke-navy/40" />
      </svg>
      <span className="absolute right-6 top-[5.4rem] flex h-9 w-9 items-center justify-center rounded-full bg-gold text-night ring-4 ring-gold/30">
        <MapPin size={18} />
      </span>
      <span className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-center gap-1 rounded-full bg-pearl px-2 py-1.5 text-[10px] font-semibold text-ink shadow-card ring-1 ring-line">
        <Navigation size={11} className="text-gold-ink" /> Share your location
      </span>
    </div>
  );
}

const STEPS: { title: string; text: string; art: ReactNode }[] = [
  {
    title: 'Pick your pack',
    text: 'Choose Talbeenah, dates or honey, then the pack size that suits your home.',
    art: <PackIllustration />,
  },
  {
    title: 'Send on WhatsApp',
    text: 'Your cart turns into a ready-written message. One tap and it is with us.',
    art: <ChatIllustration />,
  },
  {
    title: 'Delivered to your door',
    text: `Share your location and we confirm delivery with you. Free above ${formatINR(SITE.freeShippingAbove)}.`,
    art: <PinIllustration />,
  },
];

/** "How ordering works": three numbered cards with small UI mock-ups, then the two ways to start. */
export function JourneyCards() {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <Reveal>
          <SectionHeading align="center" eyebrow="How ordering works" title="Three easy steps to" emphasis="your door" />
        </Reveal>

        <ol className="grid gap-5 md:grid-cols-3 md:gap-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex">
              <Reveal delay={i * 0.08} className="flex w-full flex-col rounded-3xl bg-pearl p-4 shadow-card ring-1 ring-line md:p-5">
                <div
                  aria-hidden="true"
                  className="flex h-64 items-center justify-center rounded-2xl bg-sand bg-lattice-ink"
                >
                  {s.art}
                </div>
                <div className="px-1 pb-2 pt-6">
                  <span className="text-5xl font-normal leading-none text-gold-ink">{`0${i + 1}`}</span>
                  <h3 className="mt-3 text-xl text-ink">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </Reveal>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-[30px] top-32 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-cream text-gold-ink ring-1 ring-gold-deep/50 md:flex"
                >
                  <ArrowRight size={16} />
                </span>
              )}
            </li>
          ))}
        </ol>

        <Reveal className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center md:mt-12">
          <Link href="/shop" className={buttonClass('gold', 'px-8 py-3.5')}>
            Start shopping <ArrowRight size={16} />
          </Link>
          <a
            href={whatsappGeneralLink()}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass('whatsapp', 'px-8 py-3.5')}
          >
            <WhatsAppGlyph size={18} /> Ask on WhatsApp
          </a>
        </Reveal>
      </Container>
    </section>
  );
}
