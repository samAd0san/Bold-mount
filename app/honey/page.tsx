import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Droplets, Flower2, ShieldCheck, Snowflake } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { buttonClass } from '@/components/ui/button-styles';
import { Reveal } from '@/components/motion/reveal';
import { CategoryPage } from '@/components/shop/category-page';
import { ScriptureBand } from '@/components/shop/scripture-band';
import { PointGrid, type Point } from '@/components/shop/point-grid';
import { PRODUCT_IMG, STOCK } from '@/lib/media';
import { getProduct, productsBySection } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Raw Sidr Honey',
  description:
    'Pure, raw and unheated Sidr (Ber) honey — thick, buttery and deeply flavoured, with nothing added. The perfect sweetener for Talbeenah. Order on WhatsApp.',
};

const TRIO = getProduct('sunnah-trio-gift-box');
// The gift box carries a jar too, so it belongs next to the single honey product.
const HONEY = [...productsBySection('honey'), ...(TRIO ? [TRIO] : [])];

const WHY: Point[] = [
  {
    icon: Droplets,
    title: 'Raw and unheated',
    text: 'Not heated or pasteurised, so it keeps its natural aroma, enzymes and thick texture.',
  },
  {
    icon: Flower2,
    title: 'From Sidr blossom',
    text: 'Bees forage on the flowers of the Sidr (Ber) tree, giving a buttery honey with deep caramel notes.',
  },
  {
    icon: ShieldCheck,
    title: 'Nothing added',
    text: 'No sugar, syrup or flavouring — just honey, jarred as it is.',
  },
];

export default function HoneyPage() {
  return (
    <CategoryPage
      slug="honey"
      heroImage={STOCK.honeyHero}
      heroIntro="Thick, buttery and deeply flavoured — raw honey from the blossom of the Sidr (Ber) tree."
      before={
        <>
          <ScriptureBand
            light
            arabic="فِيهِ شِفَاءٌ لِّلنَّاسِ"
            quote="There emerges from their bellies a drink, varying in colours, in which there is healing for people. Indeed in that is a sign for a people who give thought."
            source="Qur’an · Sūrat an-Naḥl 16:69"
          />

          <section className="bg-cream">
            <Container className="py-14 md:py-20">
              <SectionHeading eyebrow="Why raw Sidr honey" title="Honey, just as" emphasis="the bees made it" />
              <PointGrid points={WHY} cols={3} />

              <Reveal className="mt-6 flex flex-col gap-5 rounded-2xl bg-sand p-6 md:mt-8 md:flex-row md:items-start md:gap-8 md:p-8">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-gold">
                  <Snowflake size={22} aria-hidden />
                </span>
                <div>
                  <h3 className="text-xl text-ink">Is crystallised honey pure?</h3>
                  <p className="mt-2 max-w-3xl leading-relaxed text-ink-soft">
                    Crystallising is natural. Honey is full of natural sugars that slowly form crystals, especially in cool
                    weather — it is normal for raw honey and does not mean sugar was added. To loosen it, stand the closed jar
                    in warm (not boiling) water for a few minutes, then stir with a dry spoon.
                  </p>
                </div>
              </Reveal>
            </Container>
          </section>
        </>
      }
      products={HONEY}
      gridTitle="Shop honey"
      gridIntro="Pure Sidr Honey in three jar sizes — or find it in our Sunnah Trio gift box."
      divided
    >
      {/* Cross-sell: honey → Talbeenah */}
      <section className="bg-navy bg-lattice text-on-night">
        <Container className="py-14 md:py-20">
          <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-20">
            <Reveal className="order-2 md:order-1">
              <p className="eyebrow text-gold">Perfect pairing</p>
              <div className="rule-gold mt-3" />
              <h2 className="mt-4 text-3xl leading-tight md:text-[2.75rem]">
                Honey makes the perfect <span className="text-gold">Talbeenah</span> sweetener
              </h2>
              <p className="mt-4 text-on-night-soft md:text-lg">
                Stir a spoonful of Sidr honey into a warm bowl of Talbeenah and top it with a few dates — a simple, wholesome
                breakfast.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/talbeenah" className={buttonClass('gold')}>
                  Shop Talbeenah
                </Link>
                {TRIO && (
                  <Link href={`/product/${TRIO.slug}`} className={buttonClass('outline-light')}>
                    See the Sunnah Trio
                  </Link>
                )}
              </div>
            </Reveal>

            <Reveal direction="left" className="order-1 md:order-2">
              <div className="relative mx-auto aspect-square w-full max-w-[260px] md:max-w-md">
                <div className="absolute inset-[6%] rounded-full bg-gold/10" />
                <div className="absolute inset-[10%] animate-float">
                  <Image
                    src={PRODUCT_IMG.talbeenahPouch}
                    alt="Bold Mount Talbeenah pouch"
                    fill
                    sizes="(max-width: 768px) 260px, 40vw"
                    className="object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </CategoryPage>
  );
}
