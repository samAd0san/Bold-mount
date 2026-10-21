import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf, Sparkles, Sun, Wheat } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { Reveal } from '@/components/motion/reveal';
import { CategoryPage } from '@/components/shop/category-page';
import { FeaturedProduct } from '@/components/shop/featured-product';
import { ScriptureBand } from '@/components/shop/scripture-band';
import { PosterGallery, type GalleryItem } from '@/components/shop/poster-gallery';
import { MiniFaq, type FaqItem } from '@/components/shop/mini-faq';
import { CAMPAIGN, STOCK } from '@/lib/media';
import { getProduct } from '@/lib/products';
import { formatINR } from '@/lib/format';
import { SITE } from '@/lib/site';
import { whatsappGeneralLink } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Talbeenah — the Sunnah superfood',
  description:
    'Premium roasted Talbeenah: slow-roasted whole-barley porridge mix, the comforting food recommended by the Prophet ﷺ (Sahih al-Bukhari 5417). What it is, how to make it, and packs to order.',
};

const PACK = getProduct('premium-roasted-talbeenah');

const NUTRIENTS = [
  { icon: Wheat, title: 'Fibre', text: 'Whole barley is rich in dietary fibre, including beta-glucan.' },
  { icon: Sparkles, title: 'Magnesium', text: 'A good natural source of this everyday mineral.' },
  { icon: Leaf, title: 'Potassium', text: 'Found naturally in whole-grain barley.' },
  { icon: Sun, title: 'B-vitamins', text: 'Including thiamine (B1), niacin and B6.' },
];

const STEPS = [
  { title: 'Mix', text: 'Stir 2–3 tablespoons of Talbeenah into a cup of milk or water.' },
  { title: 'Cook', text: 'Keep stirring on a low heat for 5–7 minutes, until smooth and thick.' },
  { title: 'Sweeten', text: 'Add a spoon of honey, then top with chopped dates or nuts.' },
];

// Only posters without medical claims (FSSAI); the rest promise cures, so they stay off the site.
const GALLERY: GalleryItem[] = [
  { src: CAMPAIGN.talbeenahBlue, alt: 'Talbeenah Sunnah poster — recommended by the Prophet ﷺ, Bukhari 5417' },
  { src: CAMPAIGN.pouchesOutdoors, alt: 'Two Bold Mount Talbeenah pouches outdoors' },
  { src: CAMPAIGN.griefLessener, alt: 'Talbeenah Sunnah Superfood poster with barley ears' },
  { src: STOCK.porridgeBowl, alt: 'A warm bowl of Talbeenah topped with crushed nuts' },
];

const FAQ: FaqItem[] = [
  {
    q: 'What does Talbeenah taste like?',
    a: 'Mild, nutty and creamy — like a smooth, warm barley porridge. Roasting gives it a gentle toasty aroma; honey and dates bring the sweetness.',
  },
  {
    q: 'Is there any sugar or additive in it?',
    a: 'No. It is 100% roasted whole barley — no sugar, preservatives or additives. You sweeten it the way you like.',
  },
  {
    q: 'Is Talbeenah gluten-free?',
    a: 'No. Barley naturally contains gluten, so it is not suitable if you need to avoid gluten. If you have a health condition, please check with your doctor first.',
  },
  {
    q: 'How do I order?',
    a: (
      <>
        Add a pack to your cart and send the order on WhatsApp, or message us directly on{' '}
        <a href={whatsappGeneralLink()} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline-offset-4 hover:underline">
          {SITE.phoneDisplay}
        </a>
        . Delivery is free on orders above {formatINR(SITE.freeShippingAbove)}.
      </>
    ),
  },
];

const inlineLink = 'font-semibold text-navy underline underline-offset-4 decoration-gold-deep/50 hover:decoration-navy';

export default function TalbeenahPage() {
  return (
    <CategoryPage
      slug="talbeenah"
      heroImage={STOCK.barleyField}
      heroActions={
        <>
          <Link href="/product/premium-roasted-talbeenah" className={buttonClass('gold')}>
            Choose pack
          </Link>
          <a href="#products" className={buttonClass('outline-light')}>
            See all Talbeenah
          </a>
        </>
      }
      gridTitle="All Talbeenah"
      gridIntro="Single packs, a value duo and our Sunnah Trio gift box."
      before={
        <>
          {PACK && <FeaturedProduct product={PACK} eyebrow="Our own Talbeenah" />}

          <ScriptureBand
            arabic="تلبينة"
            quote="At-Talbina gives rest to the heart of the sick person and relieves some of his sorrow."
            narrator="The Prophet ﷺ, narrated by ʿĀʾishah (may Allah be pleased with her)"
            source="Sahih al-Bukhari 5417"
          />

          {/* What is Talbeenah + nutrition */}
          <section className="bg-cream">
            <Container className="py-14 md:py-20">
              <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-20">
                <Reveal direction="right" className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                  <Image
                    src={STOCK.porridgeBowl}
                    alt="A warm bowl of Talbeenah topped with crushed nuts"
                    fill
                    sizes="(max-width: 768px) 100vw, 45vw"
                    className="object-cover"
                  />
                  <span
                    lang="ar"
                    aria-hidden="true"
                    className="absolute bottom-4 left-4 rounded-full bg-night/85 px-5 py-1.5 font-arabic text-2xl text-gold"
                  >
                    تلبينة
                  </span>
                </Reveal>

                <Reveal>
                  <p className="eyebrow">Know your food</p>
                  <div className="rule-gold mt-3" />
                  <h2 className="mt-4 text-3xl leading-tight text-ink md:text-[2.75rem]">
                    What is <span className="text-gold-ink">Talbeenah?</span>
                  </h2>
                  <div className="mt-5 space-y-4 leading-relaxed text-ink-soft md:text-lg">
                    <p>
                      Talbeenah is a soft, warm porridge made by cooking finely ground barley in milk or water. Its name comes
                      from the Arabic <em>laban</em> — milk — because the cooked porridge looks white and milky.
                    </p>
                    <p>
                      ʿĀʾishah (may Allah be pleased with her) would recommend it for the sick and for anyone grieving a loss.
                      Ours has a single ingredient: whole barley, cleaned, slow-roasted and finely milled.
                    </p>
                  </div>

                  <h3 className="mt-8 text-lg text-ink">Barley is naturally rich in</h3>
                  <ul className="mt-4 grid grid-cols-2 gap-3">
                    {NUTRIENTS.map((n) => (
                      <li key={n.title} className="rounded-xl bg-pearl p-4 ring-1 ring-line ring-inset">
                        <n.icon size={20} aria-hidden className="text-gold-ink" />
                        <p className="mt-2 font-semibold text-ink">{n.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-soft sm:text-sm">{n.text}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-ink-soft">
                    General nutrition facts for whole barley. Talbeenah is a wholesome food, not a medicine.
                  </p>
                </Reveal>
              </div>
            </Container>
          </section>

          {/* How to prepare */}
          <section className="bg-sand">
            <Container className="py-14 md:py-20">
              <SectionHeading eyebrow="How to prepare" title="Ready in" emphasis="about 5–7 minutes" align="center" />
              <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
                {STEPS.map((s, i) => (
                  <li key={s.title}>
                    <Reveal delay={i * 0.1} className="h-full rounded-2xl bg-pearl p-6 shadow-card md:p-8">
                      <span
                        aria-hidden="true"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-lg font-semibold text-gold"
                      >
                        {i + 1}
                      </span>
                      <h3 className="mt-5 text-xl text-ink">{s.title}</h3>
                      <p className="mt-2 leading-relaxed text-ink-soft">{s.text}</p>
                    </Reveal>
                  </li>
                ))}
              </ol>
              <p className="mt-8 text-center text-ink-soft">
                Sweeten it the traditional way with{' '}
                <Link href="/honey" className={inlineLink}>
                  Sidr honey
                </Link>{' '}
                and{' '}
                <Link href="/dates" className={inlineLink}>
                  Ajwa dates
                </Link>
                .
              </p>
            </Container>
          </section>

          {/* Campaign gallery */}
          <section className="bg-night bg-lattice text-on-night">
            <Container className="py-14 md:py-20">
              <SectionHeading eyebrow="Gallery" title="Talbeenah," emphasis="in pictures" dark />
              <Reveal>
                <PosterGallery items={GALLERY} label="Talbeenah pictures" />
              </Reveal>
              <p className="mt-4 text-xs text-on-night-soft sm:hidden">Swipe for more →</p>
            </Container>
          </section>
        </>
      }
    >
      {/* Mini FAQ */}
      <section className="bg-sand">
        <Container className="py-14 md:py-20">
          <div className="grid gap-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading eyebrow="Questions" title="Good to" emphasis="know" className="mb-4 md:mb-6" />
              <a
                href={whatsappGeneralLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy underline-offset-4 hover:underline"
              >
                <WhatsAppGlyph size={18} className="text-whatsapp-ink" /> Ask us anything on WhatsApp
              </a>
            </div>
            <Reveal className="md:col-span-8">
              <MiniFaq items={FAQ} />
            </Reveal>
          </div>
        </Container>
      </section>
    </CategoryPage>
  );
}
