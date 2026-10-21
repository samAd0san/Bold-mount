import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Landmark, PackageCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { PRODUCT_IMG } from '@/lib/media';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/motion/reveal';
import { RfVines } from './rf-vines';
import { RfFloatCard } from './rf-float-card';

const PILL_TONE = {
  green: 'bg-whatsapp/20',
  gold: 'bg-gold/30',
  sand: 'bg-sand',
};

function Pill({ tone, children }: { tone: keyof typeof PILL_TONE; children: ReactNode }) {
  return (
    <span
      className={cn(
        'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight text-ink',
        PILL_TONE[tone],
      )}
    >
      {tone === 'green' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-whatsapp-ink" />}
      {children}
    </span>
  );
}

function Thumb({ src }: { src: string }) {
  return (
    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-sand">
      <Image src={src} alt="" fill sizes="36px" className="object-contain p-0.5" />
    </span>
  );
}

function IconDot({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/25 text-gold-ink">
      {children}
    </span>
  );
}

function Row({ lead, title, sub }: { lead: ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      {lead}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold leading-tight">{title}</p>
        <p className="mt-0.5 text-[10px] leading-tight text-ink-soft">{sub}</p>
      </div>
    </div>
  );
}

/** Dark inset panel: vines draw in behind a big mission statement, with small illustrative status cards around it. */
export function MissionPanel() {
  return (
    <section className="bg-night pb-16 pt-2 md:pb-24" aria-labelledby="mission-title">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy px-4 py-14 sm:px-8 md:px-12 md:py-24 xl:flex xl:min-h-[44rem] xl:items-center xl:justify-center xl:py-32">
          <RfVines />

          <Reveal className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-gold">Our mission</p>
            <div className="rule-gold mt-3" />
            <h2
              id="mission-title"
              className="mt-6 text-4xl font-normal leading-[1.08] text-on-night md:text-6xl"
            >
              Nourishing bodies. <span className="text-gold">Serving people.</span> One order at a time.
            </h2>
            <p className="mt-6 max-w-xl leading-relaxed text-on-night-soft md:text-lg">
              Bold Mount pairs Sunnah foods with service. A share of every order feeds a family in need, and your
              Zakat reaches madrasa students, imams and families who need it.
            </p>
            <Link
              href="/zakat"
              className="group mt-8 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-gold"
            >
              <span className="underline-offset-4 group-hover:underline">See how we give</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/60 transition-colors duration-300 group-hover:bg-gold group-hover:text-night">
                <ArrowRight size={16} />
              </span>
            </Link>
          </Reveal>

          {/* Illustrations of the flow, not real orders: a 2×2 grid on phones, floating around the text from xl. */}
          <div aria-hidden="true" className="relative z-10 mt-12 grid grid-cols-2 gap-3 sm:mx-auto sm:max-w-md xl:contents">
            <RfFloatCard className="xl:absolute xl:left-8 xl:top-14 xl:z-10 xl:w-52 2xl:left-16" duration={6}>
              <Row lead={<Thumb src={PRODUCT_IMG.talbeenahPouch} />} title="Talbeenah · 500 g" sub="Your order" />
              <Pill tone="green">Confirmed on WhatsApp</Pill>
            </RfFloatCard>

            <RfFloatCard className="xl:absolute xl:right-8 xl:top-28 xl:z-10 xl:w-52 2xl:right-16" delay={0.15} duration={7}>
              <Row lead={<Thumb src={PRODUCT_IMG.dates.ajwa} />} title="Ajwa dates · Madinah" sub="Premium dates" />
              <Pill tone="sand">Hand-picked</Pill>
            </RfFloatCard>

            <RfFloatCard className="xl:absolute xl:bottom-24 xl:left-12 xl:z-10 xl:w-52 2xl:left-24" delay={0.3} duration={6.5}>
              <Row
                lead={
                  <IconDot>
                    <PackageCheck size={18} />
                  </IconDot>
                }
                title="Ration kit"
                sub="Khidmat-e-Khalq"
              />
              <Pill tone="green">Delivered</Pill>
            </RfFloatCard>

            <RfFloatCard className="xl:absolute xl:bottom-16 xl:right-10 xl:z-10 xl:w-52 2xl:right-24" delay={0.45} duration={7.5}>
              <Row
                lead={
                  <IconDot>
                    <Landmark size={18} />
                  </IconDot>
                }
                title="Umrah Badal"
                sub="For a loved one"
              />
              <Pill tone="gold">Completed ✓</Pill>
            </RfFloatCard>
          </div>
        </div>
      </Container>
    </section>
  );
}
