import type { Metadata } from 'next';
import { Ruler, Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { Reveal } from '@/components/motion/reveal';
import { CategoryPage } from '@/components/shop/category-page';
import { STOCK } from '@/lib/media';
import { SITE } from '@/lib/site';
import { whatsappLink } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Modest Wear — Thobes, Kurtas, Abayas & Hijabs',
  description:
    'Simple, dignified modest wear from Bold Mount — thobes, kurta sets, kufis, abayas and hijabs. A new range; ask on WhatsApp about sizes and custom stitching.',
};

const SIZE_MESSAGE = [
  'Assalamu alaikum Bold Mount,',
  'I am looking at your modest wear and need a different size / custom stitching.',
  '',
  'Item:',
  'Size or measurements:',
].join('\n');

export default function WearingsPage() {
  return (
    <CategoryPage
      slug="wearings"
      heroImage={STOCK.wear.thobe}
      heroEyebrow="New range"
      intro={{
        eyebrow: 'Modest wear',
        title: 'Simple, dignified, comfortable',
        body: (
          <p>
            Clothes for salah, Jumu‘ah and every day in between — breathable fabrics, relaxed cuts and modest lengths,
            without fuss. Thobes, kurtas and kufis for men; abayas and hijabs for women.
          </p>
        ),
        aside: (
          <p className="flex items-start gap-3 rounded-xl bg-sand px-4 py-3 text-sm leading-relaxed text-ink">
            <Sparkles size={16} aria-hidden className="mt-0.5 shrink-0 text-gold-ink" />
            This range is new. Photos show the style — ask us on WhatsApp for the exact fabric, colour and fit before you
            order.
          </p>
        ),
      }}
      gridTitle="Shop modest wear"
      divided
    >
      <section className="bg-night bg-lattice text-on-night">
        <Container className="py-14 md:py-20">
          <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Ruler size={24} aria-hidden />
            </span>
            <h2 className="mt-6 text-3xl leading-tight md:text-[2.5rem]">
              Need a different size or <span className="text-gold">custom stitching?</span>
            </h2>
            <p className="mt-4 text-on-night-soft md:text-lg">
              Tell us the piece and the size or measurements you need, and we&apos;ll let you know what&apos;s possible.
            </p>
            <a
              href={whatsappLink(SIZE_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass('whatsapp', 'mt-8')}
            >
              <WhatsAppGlyph size={18} /> Ask on WhatsApp
            </a>
            <p className="mt-3 text-sm text-on-night-soft">{SITE.phoneDisplay}</p>
          </Reveal>
        </Container>
      </section>
    </CategoryPage>
  );
}
