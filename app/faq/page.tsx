import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { Reveal } from '@/components/motion/reveal';
import { FaqAccordion } from '@/components/info/faq-accordion';
import { FAQ_GROUPS } from '@/components/info/faq-data';
import { pageMeta } from '@/components/info/page-meta';
import { STOCK } from '@/lib/media';
import { whatsappGeneralLink } from '@/lib/whatsapp';

export const metadata = pageMeta({
  title: 'FAQ',
  description:
    'Answers about ordering, doorstep delivery, Talbeenah, dates and honey, plus Zakat, Umrah Badal, free giveaways and volunteer guidance at Bold Mount.',
  path: '/faq',
});

// FAQPage structured data lets search engines show these answers directly.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_GROUPS.flatMap((g) =>
    g.items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  ),
};

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Questions,"
        emphasis="answered."
        intro="Ordering, delivery, our products and our services. Can’t find what you need? Ask us on WhatsApp."
        image={STOCK.datesHero}
        crumbs={[{ label: 'FAQ' }]}
      />

      <section className="py-14 md:py-20">
        <Container className="max-w-3xl">
          <nav aria-label="FAQ topics" className="mb-12 flex flex-wrap gap-2 md:mb-16">
            {FAQ_GROUPS.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="inline-flex min-h-11 items-center rounded-full border border-line bg-pearl px-5 text-sm font-medium text-ink transition-colors hover:border-navy hover:bg-navy hover:text-on-night"
              >
                {g.title}
              </a>
            ))}
          </nav>
          <FaqAccordion groups={FAQ_GROUPS} />
        </Container>
      </section>

      <section className="bg-night bg-lattice py-14 text-on-night md:py-20">
        <Container className="flex flex-col items-center text-center">
          <Reveal>
            <p className="eyebrow text-gold">Still curious?</p>
            <div className="rule-gold mx-auto mt-3" />
            <h2 className="mt-4 text-3xl md:text-4xl">Ask us anything on WhatsApp</h2>
            <p className="mx-auto mt-3 max-w-md text-on-night-soft">We’re happy to help with orders, gifts or any of our services.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={whatsappGeneralLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass('whatsapp')}
              >
                <WhatsAppGlyph size={18} /> Chat on WhatsApp
              </a>
              <Link href="/contact" className={buttonClass('outline-light')}>
                Contact page
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  );
}
