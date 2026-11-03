import type { Metadata } from 'next';
import { Camera, Check, HandHeart, House, MapPin, UserCheck } from 'lucide-react';
import type { FormField } from '@/components/forms/whatsapp-form';
import { PageHero } from '@/components/ui/page-hero';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { buttonClass } from '@/components/ui/button-styles';
import { Reveal } from '@/components/motion/reveal';
import { ServeIntro } from '@/components/serve/serve-intro';
import { InfoCards } from '@/components/serve/info-cards';
import { Steps } from '@/components/serve/steps';
import { QuoteBand } from '@/components/serve/quote-band';
import { FormSection } from '@/components/serve/form-section';
import { ServeForm } from '@/components/serve/serve-form';
import { PrefillButton } from '@/components/serve/prefill-button';
import { ServeFaq } from '@/components/serve/serve-faq';
import { MoreWays } from '@/components/serve/more-ways';
import { UmrahFee } from '@/components/serve/umrah-fee';
import { getSection } from '@/lib/sections';
import { STOCK } from '@/lib/media';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

const section = getSection('umrah');
const BOOKING_FORM = 'umrah-booking';

export const metadata: Metadata = {
  title: 'Umrah Badal — Umrah on Behalf of a Loved One',
  description:
    'Umrah Badal performed in Makkah for a loved one who has passed away or cannot travel due to age or illness. Photos or video and a completion message on WhatsApp.',
};

// Placeholder prices; the final amount is confirmed on WhatsApp.
const PACKAGES = [
  {
    name: 'Umrah Badal',
    price: 9999,
    blurb: 'A complete Umrah performed in Makkah with the niyyah in your loved one’s name.',
    includes: ['Performed by someone who has done their own Umrah', 'Your du‘a requests remembered', 'Photos and a completion message on WhatsApp'],
  },
  {
    name: 'Umrah Badal + video updates',
    price: 12999,
    blurb: 'Everything in Umrah Badal, with short video updates so you can follow along.',
    includes: ['Everything in Umrah Badal', 'Video updates during the Umrah', 'Completion message on WhatsApp'],
  },
  {
    name: 'Ramadan Umrah Badal',
    price: 14999,
    blurb: 'Umrah Badal performed during the blessed month of Ramadan.',
    includes: ['Performed in Ramadan', 'Your du‘a requests remembered', 'Photos and a completion message on WhatsApp'],
  },
].map((p) => ({ ...p, option: `${p.name} — ${formatINR(p.price)}` }));

const BOOKING_FIELDS: FormField[] = [
  { name: 'yourName', label: 'Your name', required: true },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, placeholder: '10-digit mobile number' },
  { name: 'package', label: 'Package', type: 'select', required: true, full: true, options: PACKAGES.map((p) => p.option) },
  { name: 'forName', label: 'Name of the person (Umrah for)', required: true },
  { name: 'fatherName', label: 'Their father’s name' },
  { name: 'relation', label: 'Relation to you', required: true, placeholder: 'e.g. Mother, Father, Grandparent' },
  {
    name: 'status',
    label: 'Living or deceased?',
    type: 'select',
    required: true,
    options: ['Deceased', 'Living but unable to travel'],
  },
  { name: 'month', label: 'Preferred month', placeholder: 'e.g. Rajab, or December' },
  { name: 'duas', label: 'Special du‘a requests', type: 'textarea', placeholder: 'Du‘as you would like made on your behalf' },
];

export default function UmrahPage() {
  return (
    <>
      <PageHero
        eyebrow="Serve & Give"
        title="Umrah Badal for"
        emphasis="your loved ones"
        intro="An Umrah performed in Makkah on behalf of a parent or loved one who has passed away, or who can no longer travel because of age or illness."
        image={section.image}
        crumbs={[{ label: 'Serve & Give' }, { label: section.title }]}
      >
        <a href="#packages" className={buttonClass('gold')}>
          See packages
        </a>
        <a href="#book" className={buttonClass('outline-light')}>
          Book Umrah Badal
        </a>
      </PageHero>

      <ServeIntro
        eyebrow="Umrah Badal"
        title="An Umrah for someone"
        emphasis="you love"
        aside={
          <div className="grid gap-4">
            <div className="rounded-2xl bg-pearl p-6 shadow-card ring-1 ring-line">
              <HandHeart size={22} className="text-gold-ink" aria-hidden />
              <h3 className="mt-3 text-lg text-ink">For those who have passed away</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                A gift of worship on behalf of a parent or loved one who has returned to Allah.
              </p>
            </div>
            <div className="rounded-2xl bg-pearl p-6 shadow-card ring-1 ring-line">
              <House size={22} className="text-gold-ink" aria-hidden />
              <h3 className="mt-3 text-lg text-ink">For those who cannot travel</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                For a loved one who is alive but unable to make the journey because of old age or long-term illness.
              </p>
            </div>
          </div>
        }
      >
        <p>
          Umrah Badal is an Umrah performed in Makkah on behalf of another person — a parent or loved one who has
          passed away, or who is alive but cannot travel because of age or illness.
        </p>
        <p>
          It is performed by a Muslim who has already completed their own Umrah. The niyyah (intention) is made in
          your loved one’s name, and every rite is completed with your du‘as remembered.
        </p>
        <p>When it is done, you receive photos — or video, if you choose — and a completion message on WhatsApp.</p>
      </ServeIntro>

      <InfoCards
        eyebrow="What it includes"
        title="Performed with"
        emphasis="care and sincerity"
        cards={[
          {
            icon: MapPin,
            title: 'Performed in Makkah',
            text: 'Every rite of Umrah — ihram, tawaf, sa‘i and cutting of the hair — completed in full.',
          },
          {
            icon: UserCheck,
            title: 'By someone who has done their own',
            text: 'Performed only by a Muslim who has already completed their own Umrah.',
          },
          {
            icon: HandHeart,
            title: 'Niyyah in their name',
            text: 'The intention is made for your loved one, and your du‘a requests are remembered.',
          },
          {
            icon: Camera,
            title: 'Updates on WhatsApp',
            text: 'Photos, or video updates if you choose, and a completion message when it is done.',
          },
        ]}
      />

      <section id="packages" className="scroll-mt-32 py-16 md:py-24">
        <Container>
          <SectionHeading
            eyebrow="Packages"
            title="Choose a"
            emphasis="package"
            intro="One Umrah, for one person. The final amount and date are confirmed with you on WhatsApp before you pay."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {PACKAGES.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.08} className="h-full">
                <article
                  className={cn(
                    'flex h-full flex-col rounded-2xl p-6 ring-1 sm:p-7',
                    i === 1 ? 'bg-navy bg-lattice text-on-night ring-navy' : 'bg-pearl shadow-card ring-line',
                  )}
                >
                  <h3 className={cn('text-xl', i === 1 ? 'text-on-night' : 'text-ink')}>{p.name}</h3>
                  <p className={cn('mt-2 text-sm leading-relaxed', i === 1 ? 'text-on-night-soft' : 'text-ink-soft')}>{p.blurb}</p>
                  <p className={cn('mt-5 text-3xl font-semibold', i === 1 ? 'text-gold' : 'text-navy')}>{formatINR(p.price)}</p>
                  <ul className="mt-5 mb-7 space-y-2.5">
                    {p.includes.map((x) => (
                      <li key={x} className={cn('flex gap-2.5 text-sm', i === 1 ? 'text-on-night' : 'text-ink')}>
                        <Check size={17} className={cn('mt-0.5 shrink-0', i === 1 ? 'text-gold' : 'text-gold-ink')} aria-hidden />
                        {x}
                      </li>
                    ))}
                  </ul>
                  <PrefillButton
                    formId={BOOKING_FORM}
                    values={{ package: p.option }}
                    targetId="book"
                    className={buttonClass(i === 1 ? 'gold' : 'navy', 'mt-auto w-full')}
                  >
                    Book<span className="sr-only"> {p.name}</span>
                  </PrefillButton>
                </article>
              </Reveal>
            ))}
          </div>
          <a href="#why-fee" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline-offset-4 hover:underline">
            Why is there a fee? →
          </a>
        </Container>
      </section>

      <UmrahFee />

      <Steps
        className="bg-sand/50"
        title="How Umrah Badal"
        emphasis="works"
        steps={[
          { title: 'Choose a package', text: 'Pick a package and share your loved one’s details in the form below.' },
          { title: 'Confirm on WhatsApp', text: 'We confirm the date with you and share payment details personally.' },
          { title: 'The Umrah is performed', text: 'In Makkah, with the niyyah made in your loved one’s name.' },
          { title: 'Receive your update', text: 'Photos or video, and a completion message, sent to you on WhatsApp.' },
        ]}
      />

      <QuoteBand
        lead="A woman from the tribe of Khath‘am asked the Prophet ﷺ:"
        text="O Messenger of Allah, the duty of Hajj has come upon my father, but he is very old and cannot sit firmly on a mount. May I perform Hajj on his behalf?"
        after="He ﷺ said: “Yes.”"
        source="Sahih al-Bukhari 1513 · on Hajj; scholars apply the same to Umrah"
        image={STOCK.nabawi}
      />

      <FormSection
        id="book"
        eyebrow="Book Umrah Badal"
        title="Book an Umrah for"
        emphasis="your loved one"
        intro="Share your loved one’s details. We’ll confirm the date and share payment details with you personally on WhatsApp."
        points={[
          'Nothing is paid on this website.',
          'Date and payment are confirmed with you personally on WhatsApp.',
          'Photos or video and a completion message are sent to you.',
          'Your du‘a requests are passed on to the person performing the Umrah.',
        ]}
      >
        <ServeForm
          formId={BOOKING_FORM}
          title="I would like to book Umrah Badal."
          fields={BOOKING_FIELDS}
          submitLabel="Send booking on WhatsApp"
          note="Prices shown are per Umrah; the final amount is confirmed with you on WhatsApp."
        />
      </FormSection>

      <ServeFaq
        topic="Umrah Badal"
        items={[
          {
            q: 'Can I book Umrah Badal for a parent who is alive?',
            a: 'Only if they are unable to travel because of old age or a long-term illness. If they are able to go, they should perform their own Umrah.',
          },
          {
            q: 'Who performs the Umrah?',
            a: 'A Muslim who has already completed their own Umrah, who makes the niyyah in your loved one’s name.',
          },
          {
            q: 'Can I book for more than one person?',
            a: 'Each Umrah Badal is for one person. To book for more than one loved one, mention it in your message and a separate Umrah is arranged for each.',
          },
          {
            q: 'How do I pay?',
            a: 'After we confirm your booking, payment details are shared with you personally on WhatsApp. This website never asks for bank, UPI or card details.',
          },
        ]}
      />

      <MoreWays current={section.slug} />
    </>
  );
}
