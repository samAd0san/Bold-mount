import type { Metadata } from 'next';
import { MapPin, Package, Snowflake, Sun } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/motion/reveal';
import { CategoryPage } from '@/components/shop/category-page';
import { ScriptureBand } from '@/components/shop/scripture-band';
import { STOCK } from '@/lib/media';
import { productsBySection } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Premium Dates — Ajwa, Medjool, Safawi & more',
  description:
    'Hand-picked dates from Madinah, Jordan, Iraq, Tunisia and Saudi Arabia — Ajwa, Medjool, Safawi, Mabroom, Sukkary and a gift hamper. Order on WhatsApp.',
};

// Regions come from the catalogue so the chips never list a place we don't stock.
const ORIGINS = [...new Set(productsBySection('dates').flatMap((p) => (p.origin ? [p.origin.split(',')[0]] : [])))];

const STORAGE_TIPS = [
  { icon: Package, title: 'Keep them airtight', text: 'A sealed box or jar, away from heat, sunlight and moisture.' },
  { icon: Snowflake, title: 'Refrigerate for longer', text: 'Soft dates like Ajwa and Medjool stay fresh much longer in the fridge.' },
  { icon: Sun, title: 'Serve at room temperature', text: 'Take them out a little before eating for the softest, sweetest bite.' },
];

export default function DatesPage() {
  return (
    <CategoryPage
      slug="dates"
      heroImage={STOCK.datesHero}
      intro={{
        eyebrow: 'Our dates',
        title: 'From Madinah, Jordan, Iraq, Tunisia…',
        body: (
          <>
            <p>
              Every date has its own character — the soft, near-black Ajwa of Madinah, the big caramel-like Medjool of the
              Jordan Valley, the nutty Zahdi of Iraq and the amber Deglet Noor of Tunisia.
            </p>
            <p>Pick a soft date for iftar, a firmer one for snacking and travel, or a hamper to share with family.</p>
          </>
        ),
        aside: (
          <ul aria-label="Where our dates come from" className="flex flex-wrap gap-2">
            {ORIGINS.map((o) => (
              <li
                key={o}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-pearl px-3.5 py-2 text-sm font-medium text-ink"
              >
                <MapPin size={14} aria-hidden className="text-gold-ink" />
                {o}
              </li>
            ))}
          </ul>
        ),
      }}
      before={
        <ScriptureBand
          arabic="عجوة"
          quote="He who eats seven ʿAjwa dates every morning will not be affected by poison or magic on the day he eats them."
          narrator="The Prophet ﷺ, narrated by Saʿd ibn Abī Waqqāṣ (may Allah be pleased with him)"
          source="Sahih al-Bukhari 5445"
        />
      }
      gridTitle="All dates"
      gridIntro="Soft or firm, rich or mild — most varieties come in 500 g and 1 kg packs."
    >
      <section className="bg-sand">
        <Container className="py-12 md:py-16">
          <Reveal className="grid gap-8 md:grid-cols-12 md:items-center md:gap-12">
            <div className="md:col-span-4">
              <p className="eyebrow">Good to know</p>
              <div className="rule-gold mt-3" />
              <h2 className="mt-4 text-2xl leading-tight text-ink md:text-3xl">How to store dates</h2>
            </div>
            <ul className="grid gap-4 sm:grid-cols-3 md:col-span-8">
              {STORAGE_TIPS.map((t) => (
                <li key={t.title} className="rounded-2xl bg-pearl p-5 ring-1 ring-line ring-inset">
                  <t.icon size={20} aria-hidden className="text-gold-ink" />
                  <p className="mt-3 font-semibold text-ink">{t.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{t.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>
    </CategoryPage>
  );
}
