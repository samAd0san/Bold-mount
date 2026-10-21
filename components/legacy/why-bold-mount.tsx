import type { ComponentType } from 'react';
import { HandHeart, Leaf, MapPin, PackageCheck, Truck } from 'lucide-react';
import { formatINR } from '@/lib/format';
import { SITE } from '@/lib/site';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { Reveal } from '@/components/motion/reveal';

// Only promises the brand already makes (lib/site.ts) — no numbers, ratings or certifications.
const FEATURES: { icon: ComponentType<{ size?: number; className?: string }>; title: string; text: string }[] = [
  { icon: Leaf, title: '100% natural', text: 'Nothing added, nothing hidden.' },
  { icon: MapPin, title: 'Sourced from blessed lands', text: 'Dates from Madinah, Jordan and beyond.' },
  { icon: PackageCheck, title: 'Freshly packed', text: 'Sealed fresh for every order.' },
  {
    icon: Truck,
    title: 'Doorstep delivery',
    text: `Free above ${formatINR(SITE.freeShippingAbove)}. Share your location on WhatsApp.`,
  },
  { icon: WhatsAppGlyph, title: 'Order easily on WhatsApp', text: 'No sign-up — just send a message.' },
  { icon: HandHeart, title: 'Every order gives', text: 'A share of every order feeds a family.' },
];

export function WhyBoldMount() {
  return (
    <section className="border-b border-line bg-pearl py-16 md:py-20">
      <Container>
        <Reveal>
          <SectionHeading align="center" eyebrow="Our promise" title="Why shop with" emphasis="Bold Mount" />
        </Reveal>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <li key={f.title}>
              <Reveal delay={i * 0.05} className="flex flex-col items-center px-1 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream text-gold-ink ring-1 ring-gold-deep/50 ring-offset-4 ring-offset-pearl">
                  <f.icon size={24} />
                </span>
                <h3 className="mt-5 text-[0.95rem] leading-snug text-ink">{f.title}</h3>
                <p className="mt-1.5 max-w-[15rem] text-[0.82rem] leading-snug text-ink-soft">{f.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
