import { ChevronDown } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { buttonClass } from '@/components/ui/button-styles';
import { whatsappLink } from '@/lib/whatsapp';

export interface Faq {
  q: string;
  a: string;
}

/** Small FAQ with native <details>, plus a WhatsApp "ask us" button. */
export function ServeFaq({ items, topic }: { items: Faq[]; topic: string }) {
  return (
    <section className="py-16 md:py-24">
      <Container className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Questions"
            title="Good to"
            emphasis="know"
            intro="Anything else on your mind? Ask us on WhatsApp — we’re happy to help."
            className="mb-6 md:mb-6"
          />
          <a
            href={whatsappLink(`Assalamu alaikum Bold Mount, I have a question about ${topic}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass('whatsapp')}
          >
            <WhatsAppGlyph size={18} /> Ask a question
          </a>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {items.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-ink transition-colors hover:text-navy [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown size={18} className="shrink-0 text-gold-ink transition-transform duration-300 group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-5 pr-8 text-sm leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
