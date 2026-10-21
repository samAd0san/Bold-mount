import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { formatINR } from '@/lib/format';
import { SITE } from '@/lib/site';
import { whatsappGeneralLink } from '@/lib/whatsapp';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';

const FAQS = [
  {
    q: 'How do I place an order?',
    a: 'Add what you like to the cart and check out — your order opens in WhatsApp, already filled in. Send it and we confirm the details with you there.',
  },
  {
    q: 'How does delivery work?',
    a: `We deliver to your door. Share your drop address or location on WhatsApp and we confirm the time and any charge before dispatch. Delivery is free on orders above ${formatINR(SITE.freeShippingAbove)}.`,
  },
  {
    q: 'How do I prepare Talbeenah?',
    a: 'Stir 2–3 tablespoons into a cup of milk or water on low heat until it thickens, about 5–7 minutes. Sweeten with honey or dates.',
  },
  {
    q: 'Who receives the Zakat I give?',
    a: 'Your Zakat supports madrasa students, imams, mu‘azzins and families in need. Details are shared with you on WhatsApp.',
  },
];

/** Four common questions; native <details name> keeps one open at a time with no JavaScript. */
export function HomeFaq() {
  return (
    <section className="border-t border-line py-16 md:py-24">
      <Container className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <Reveal>
          <SectionHeading eyebrow="Good to know" title="Questions," emphasis="answered" className="mb-6 md:mb-8" />
          <Link href="/faq" className={buttonClass('outline')}>
            All FAQs <ArrowRight size={16} />
          </Link>
          {/* Replaces the old closing CTA band: the next step for anyone whose question isn't listed. */}
          <div className="mt-8 rounded-2xl bg-navy p-6 text-on-night">
            <p className="text-lg font-semibold">Still have a question?</p>
            <p className="mt-1 text-sm text-on-night-soft">Orders, Zakat, Umrah Badal or anything else — we&apos;re one message away.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a href={whatsappGeneralLink()} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp')}>
                <WhatsAppGlyph size={17} /> Chat on WhatsApp
              </a>
              <a href={`tel:+${SITE.whatsapp}`} className="text-sm font-semibold text-gold hover:underline">
                {SITE.phoneDisplay}
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="border-t border-line">
            {FAQS.map((f) => (
              <details key={f.q} name="home-faq" className="group border-b border-line">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink transition-colors hover:text-navy md:text-lg [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-navy transition-all duration-300 group-open:rotate-45 group-open:border-navy group-open:bg-navy group-open:text-on-night">
                    <Plus size={16} aria-hidden />
                  </span>
                </summary>
                <p className="pr-12 pb-5 leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
