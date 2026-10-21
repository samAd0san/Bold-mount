import type { Metadata } from 'next';
import { BookHeart, BookOpen, Gift, HandHeart } from 'lucide-react';
import type { FormField } from '@/components/forms/whatsapp-form';
import { PageHero } from '@/components/ui/page-hero';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { ServeIntro } from '@/components/serve/serve-intro';
import { InfoCards } from '@/components/serve/info-cards';
import { Steps } from '@/components/serve/steps';
import { QuoteBand } from '@/components/serve/quote-band';
import { FormSection } from '@/components/serve/form-section';
import { ServeForm } from '@/components/serve/serve-form';
import { ServeFaq } from '@/components/serve/serve-faq';
import { MoreWays } from '@/components/serve/more-ways';
import { getSection } from '@/lib/sections';
import { STOCK } from '@/lib/media';
import { whatsappLink } from '@/lib/whatsapp';

const section = getSection('giveaway');
const SPONSOR_LINK = whatsappLink(
  'Assalamu alaikum Bold Mount, I would like to sponsor a copy of the Qur’an for someone who cannot afford one.',
);

export const metadata: Metadata = {
  title: 'Free Qur’an & Islamic Books',
  description:
    'Request a free copy of the Qur’an with Urdu, English or Hindi translation, or Islamic books for children. One per household, limited stock. Or sponsor a copy for someone.',
};

const REQUEST_FIELDS: FormField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, placeholder: '10-digit mobile number' },
  {
    name: 'item',
    label: 'Item',
    type: 'select',
    required: true,
    full: true,
    options: [
      'Qur’an with Urdu translation',
      'Qur’an with English translation',
      'Qur’an with Hindi translation',
      'Islamic books for children',
      'Other',
    ],
  },
  { name: 'address', label: 'Full address', type: 'textarea', required: true, placeholder: 'House, street, area, landmark' },
  { name: 'city', label: 'City', required: true },
  { name: 'pincode', label: 'Pincode', type: 'tel', required: true, placeholder: '6-digit pincode' },
  { name: 'why', label: 'Why do you need it?', type: 'textarea', placeholder: 'A line or two is enough.' },
];

export default function GiveawayPage() {
  return (
    <>
      <PageHero
        eyebrow="Serve & Give"
        title="A Qur’an in"
        emphasis="every home"
        intro="Request a free copy of the Qur’an with translation, or Islamic books for your children — or sponsor a copy for someone who can’t afford one."
        image={section.image}
        crumbs={[{ label: 'Serve & Give' }, { label: section.title }]}
      >
        <a href="#request" className={buttonClass('gold')}>
          Request a free copy
        </a>
        <a href={SPONSOR_LINK} target="_blank" rel="noopener noreferrer" className={buttonClass('outline-light')}>
          Sponsor a copy
        </a>
      </PageHero>

      <ServeIntro
        eyebrow="Free giveaways"
        title="The words of Allah,"
        emphasis="free to every home"
        image={STOCK.books}
        imageAlt="A stack of Islamic books"
      >
        <p>
          We give free copies of the Qur’an — the Arabic text with a translation in Urdu, English or Hindi — and
          Islamic books for children, along with other items when we have them.
        </p>
        <p>They are free, with one gentle request: ask only if you will truly use it, so a copy can reach every home that needs one.</p>
        <ul className="grid gap-2 text-sm text-ink sm:grid-cols-2">
          {['Completely free', 'Limited stock', 'One per household', 'Priority to those who can’t afford one'].map((t) => (
            <li key={t} className="flex items-center gap-2 rounded-full bg-sand px-4 py-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-deep" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </ServeIntro>

      <InfoCards
        eyebrow="What you can request"
        title="Free copies,"
        emphasis="given with love"
        cards={[
          {
            icon: BookOpen,
            title: 'Qur’an with translation',
            text: 'The Arabic text with a translation in Urdu, English or Hindi, depending on stock.',
          },
          {
            icon: BookHeart,
            title: 'Islamic books for children',
            text: 'Simple books to help children learn about Allah, the Prophets and good character.',
          },
          {
            icon: Gift,
            title: 'Other items, as available',
            text: 'From time to time we have other things to give. Choose “Other” and ask us what is available.',
          },
          {
            icon: HandHeart,
            title: 'Sponsor a copy',
            text: 'If you can afford one, sponsor a copy so it reaches a home that can’t.',
          },
        ]}
      />

      <Steps
        title="Three simple"
        emphasis="steps"
        steps={[
          { title: 'Request a copy', text: 'Fill the form with your address and which copy you would like.' },
          { title: 'We confirm on WhatsApp', text: 'We check what is in stock and confirm your request with you.' },
          { title: 'It reaches your home', text: 'We arrange how the copy reaches you and keep you posted on WhatsApp.' },
        ]}
      />

      <QuoteBand
        arabic="خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"
        lead="The Prophet ﷺ said:"
        text="The best of you are those who learn the Qur’an and teach it."
        source="Sahih al-Bukhari 5027"
      />

      <FormSection
        id="request"
        eyebrow="Request a free copy"
        title="Request your"
        emphasis="free copy"
        intro="One per household, while stock lasts. Priority goes to those who cannot afford a copy."
        points={[
          'Completely free of cost.',
          'Limited stock — one per household.',
          'Priority to those who cannot afford a copy.',
          'Your address is used only to send your copy.',
        ]}
        aside={
          <div className="rounded-2xl bg-navy bg-lattice p-6 text-on-night">
            <p className="eyebrow text-gold">Can you give one?</p>
            <p className="mt-3 text-xl font-semibold leading-snug">Sponsor a copy for someone</p>
            <p className="mt-2 text-sm leading-relaxed text-on-night-soft">
              Help a Qur’an reach a home that can’t afford one. Message us and we’ll share the details.
            </p>
            <a
              href={SPONSOR_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass('whatsapp', 'mt-5')}
            >
              <WhatsAppGlyph size={18} /> Sponsor on WhatsApp
            </a>
          </div>
        }
      >
        <ServeForm
          title="I would like to request a free copy (Giveaway)."
          fields={REQUEST_FIELDS}
          submitLabel="Send request on WhatsApp"
          note="We’ll confirm availability with you on WhatsApp before sending anything."
        />
      </FormSection>

      <ServeFaq
        topic="the free Qur’an giveaway"
        items={[
          {
            q: 'Is it really free?',
            a: 'Yes. The copies are given free, for the sake of Allah. If you would like to give something back, you can sponsor a copy for someone else.',
          },
          {
            q: 'Why only one per household?',
            a: 'Our stock is limited, and we want as many homes as possible to have a copy.',
          },
          {
            q: 'Which translations do you have?',
            a: 'The Arabic text with Urdu, English or Hindi translation, depending on stock. If your choice is not available, we will tell you before sending anything.',
          },
          {
            q: 'Can I request copies for a masjid or madrasa?',
            a: 'Please message us on WhatsApp with the details and how many copies you need, and we will see what we can do.',
          },
        ]}
      />

      <MoreWays current={section.slug} />
    </>
  );
}
