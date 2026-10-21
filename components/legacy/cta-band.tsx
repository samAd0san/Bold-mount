import Link from 'next/link';
import { SITE } from '@/lib/site';
import { whatsappGeneralLink } from '@/lib/whatsapp';
import { buttonClass } from '@/components/ui/button-styles';
import { Container } from '@/components/ui/container';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { Reveal } from '@/components/motion/reveal';

/** Gold pre-footer band: WhatsApp first, the shop second. */
export function CtaBand() {
  return (
    <section className="bg-gold bg-lattice-ink">
      <Container className="py-14 md:py-16">
        <Reveal className="flex flex-col items-center gap-7 text-center md:flex-row md:justify-between md:text-left">
          <div className="max-w-xl">
            <h2 className="text-3xl leading-tight text-ink md:text-4xl">
              Questions? We’re <span className="text-navy">one message</span> away.
            </h2>
            <p className="mt-3 text-ink/80">
              Orders, Zakat, Umrah Badal or anything else — message us on WhatsApp or call{' '}
              <a href={`tel:+${SITE.whatsapp}`} className="font-semibold whitespace-nowrap text-ink underline-offset-4 hover:underline">
                {SITE.phoneDisplay}
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={whatsappGeneralLink()} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'px-7')}>
              <WhatsAppGlyph size={19} /> Chat on WhatsApp
            </a>
            <Link href="/shop" className={buttonClass('navy', 'px-7')}>
              Browse the shop
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
