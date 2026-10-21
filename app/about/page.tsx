import Image from 'next/image';
import Link from 'next/link';
import { Anchor, HandHeart, Handshake, Leaf, Mountain, Sunrise } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { SectionHeading } from '@/components/ui/section-heading';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { Reveal } from '@/components/motion/reveal';
import { OfferCard } from '@/components/info/offer-card';
import { pageMeta } from '@/components/info/page-meta';
import { BRAND, STOCK } from '@/lib/media';
import { SERVE_SECTIONS, SHOP_SECTIONS } from '@/lib/sections';
import { SITE } from '@/lib/site';
import { whatsappGeneralLink } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

export const metadata = pageMeta({
  title: 'Our Story',
  description:
    'Bold Mount is rooted in the Sunnah and built to serve: Talbeenah, dates, Sidr honey and modest wear, alongside Zakat, Umrah Badal, Qur’an giveaways and volunteer guidance.',
  path: '/about',
});

const PILLARS = [
  { icon: Anchor, title: 'Steady', text: 'Simple, honest food and fair dealing, day after day.' },
  { icon: Sunrise, title: 'Rising', text: 'Always reaching a little higher in quality and in service.' },
  { icon: Mountain, title: 'Strong', text: 'Strength that is used to lift others, not to stand apart.' },
];

const PROMISES = [
  {
    icon: Leaf,
    title: 'Natural products',
    text: 'Whole barley, whole dates, pure honey. We keep ingredients simple and say plainly what is in every pack.',
  },
  {
    icon: Handshake,
    title: 'Honest sourcing',
    text: 'We tell you what a product is and where it comes from, and we confirm every order with you personally.',
  },
  {
    icon: HandHeart,
    title: 'A share that gives back',
    text: 'A share of every order supports people in need, so everyday shopping also helps someone else.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Story"
        title="Rooted in the Sunnah."
        emphasis="Built to serve."
        intro="Bold Mount is a brand with one idea: good food from the Sunnah, and a hand extended to those who need it."
        image={STOCK.mountain}
        crumbs={[{ label: 'Our Story' }]}
      />

      {/* The name */}
      <section className="bg-sand bg-lattice-ink py-16 md:py-24">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="The name"
              title="Why"
              emphasis="Bold Mount?"
              intro="A mountain does not hurry and it does not bend. It stands steady, rises toward the light, and shelters everything that grows at its foot. That is the kind of brand we want to be: grounded in the Sunnah, and strong enough to carry others."
              className="mb-0 md:mb-0"
            />
          </Reveal>
          <ul className="grid gap-4">
            {PILLARS.map((p, i) => (
              <li key={p.title}>
                <Reveal delay={i * 0.08} className="flex items-start gap-4 rounded-2xl border border-line bg-pearl p-5 shadow-card">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy text-gold">
                    <p.icon size={22} aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg text-ink">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* The Sunnah store */}
      <section className="py-16 md:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="What we offer · The Sunnah store"
              title="Food and wear rooted in"
              emphasis="the Sunnah."
              intro="Four everyday essentials, kept simple and honest. Talbeenah is our own product; dates, honey and modest wear complete the store."
              link={{ label: 'Visit the shop', href: '/shop' }}
            />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SHOP_SECTIONS.map((s, i) => (
              <Reveal key={s.slug} delay={i * 0.06} className="h-full">
                <OfferCard section={s} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Serve & Give */}
      <section className="bg-night bg-lattice py-16 text-on-night md:py-24">
        <Container>
          <Reveal>
            <SectionHeading
              dark
              eyebrow="What we offer · Serve & Give"
              title="Five ways we give"
              emphasis="back."
              intro="Alongside the store we run five community services. Each one is arranged personally with you on WhatsApp."
            />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
            {SERVE_SECTIONS.map((s, i) => (
              <Reveal
                key={s.slug}
                delay={i * 0.06}
                className={cn('h-full lg:col-span-2', i === 3 && 'lg:col-span-3', i === 4 && 'sm:col-span-2 lg:col-span-3')}
              >
                <OfferCard section={s} dark />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Our promise */}
      <section className="py-16 md:py-24">
        <Container>
          <Reveal>
            <SectionHeading eyebrow="Our promise" title="Three things we" emphasis="stand behind." align="center" />
          </Reveal>
          <ul className="grid gap-5 md:grid-cols-3">
            {PROMISES.map((p, i) => (
              <li key={p.title}>
                <Reveal delay={i * 0.08} className="h-full rounded-2xl border border-line bg-pearl p-6 shadow-card">
                  <span className="flex size-12 items-center justify-center rounded-full bg-gold text-night">
                    <p.icon size={22} aria-hidden />
                  </span>
                  <h3 className="mt-5 text-xl text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>

          <Reveal>
            <figure className="mx-auto mt-10 max-w-3xl rounded-2xl bg-navy px-6 py-8 text-center text-on-night md:mt-14 md:px-12 md:py-10">
              <blockquote className="font-display text-xl leading-snug md:text-2xl">
                “The best of people are those most beneficial to people.”
              </blockquote>
              <figcaption className="mt-4 text-sm text-on-night-soft">
                Prophet Muhammad ﷺ · <cite className="not-italic">al-Mu‘jam al-Awsat (al-Tabarani), graded hasan</cite>
              </figcaption>
            </figure>
          </Reveal>
        </Container>
      </section>

      {/* Closing brand moment */}
      <section className="border-t border-line bg-cream pt-14 pb-20 md:pt-20 md:pb-28">
        <Container className="flex flex-col items-center text-center">
          <Reveal>
            <Image
              src={BRAND.logo}
              alt="Bold Mount"
              width={1217}
              height={667}
              sizes="(min-width: 768px) 320px, 256px"
              className="mx-auto h-auto w-64 md:w-80"
            />
          </Reveal>
          <div className="rule-gold mt-6" />
          <p className="eyebrow mt-4">{SITE.tagline}</p>
          <p className="mt-4 max-w-md text-ink-soft">Steady, rising, strong. Thank you for being part of the climb.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className={buttonClass('gold')}>
              Shop the store
            </Link>
            <a href={whatsappGeneralLink()} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp')}>
              <WhatsAppGlyph size={18} /> Message us
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
