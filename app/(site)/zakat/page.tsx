import type { Metadata } from 'next';
import { GraduationCap, HandHeart, House, Mic } from 'lucide-react';
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
import { ZakatCalculator } from '@/components/serve/zakat-calculator';
import { ServeFaq } from '@/components/serve/serve-faq';
import { MoreWays } from '@/components/serve/more-ways';
import { getSection } from '@/lib/sections';
import { STOCK } from '@/lib/media';

const section = getSection('zakat');
const PLEDGE_FORM = 'zakat-pledge';

export const metadata: Metadata = {
  title: 'Zakat & Sadaqah for the Needy',
  description:
    'Give Zakat or Sadaqah to madrasa students, imams, mu‘azzins and needy families. Zakat goes only to eligible recipients. Free Zakat calculator; pledge on WhatsApp.',
};

const PLEDGE_FIELDS: FormField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, placeholder: '10-digit mobile number' },
  { name: 'type', label: 'Type', type: 'select', required: true, options: ['Zakat', 'Sadaqah'] },
  { name: 'amount', label: 'Amount (₹)', type: 'number', required: true, placeholder: 'e.g. 5000' },
  {
    name: 'support',
    label: 'Who should it support?',
    type: 'select',
    options: ['Wherever most needed', 'Madrasa students', 'Imams & mu‘azzins', 'Needy families'],
  },
  { name: 'city', label: 'City' },
  { name: 'note', label: 'Note', type: 'textarea', placeholder: 'Anything we should know (optional)' },
];

export default function ZakatPage() {
  return (
    <>
      <PageHero
        eyebrow="Serve & Give"
        title="Your Zakat,"
        emphasis="delivered with care"
        intro="Zakat and Sadaqah for madrasa students, imams, mu‘azzins and families in need — given only where it is due, with an update back to you."
        image={section.image}
        crumbs={[{ label: 'Serve & Give' }, { label: section.title }]}
      >
        <a href="#pledge" className={buttonClass('gold')}>
          Pledge Zakat or Sadaqah
        </a>
        <a href="#calculator" className={buttonClass('outline-light')}>
          Zakat calculator
        </a>
      </PageHero>

      <ServeIntro
        eyebrow="Zakat & Sadaqah"
        title="Giving that reaches"
        emphasis="the right hands"
        image={STOCK.mihrab}
        imageAlt="The prayer niche (mihrab) inside a quiet mosque"
      >
        <p>
          Many madrasa students, imams and mu‘azzins serve our communities on very little, and many families struggle
          quietly. Bold Mount helps your Zakat and Sadaqah reach them.
        </p>
        <p>
          Zakat has clear rules on who may receive it — the poor, the needy and the other groups named in the Qur’an
          (9:60). So we treat Zakat and Sadaqah differently:
        </p>
        <ul className="space-y-2 border-l-2 border-gold-deep/60 pl-4 text-ink">
          <li>Zakat is given only to people who are eligible to receive it.</li>
          <li>
            Imams, mu‘azzins and madrasa staff receive Zakat only where they themselves qualify as needy — otherwise,
            gifts for them are given as Sadaqah.
          </li>
          <li>You choose Zakat or Sadaqah when you pledge, and we follow your choice.</li>
        </ul>
      </ServeIntro>

      <InfoCards
        eyebrow="Who your gift supports"
        title="Four places your"
        emphasis="giving goes"
        cards={[
          {
            icon: GraduationCap,
            title: 'Madrasa students',
            text: 'Food, books and basic needs for students learning the Qur’an and the Deen.',
          },
          {
            icon: Mic,
            title: 'Imams & mu‘azzins',
            text: 'Support for those who lead our prayers and call the adhan — as Zakat where they are needy, otherwise as Sadaqah.',
          },
          {
            icon: House,
            title: 'Needy families',
            text: 'Help with rations, rent, school fees or medical bills for families going through hardship.',
          },
          {
            icon: HandHeart,
            title: 'Wherever most needed',
            text: 'Leave the choice to us and your gift goes where the need is greatest — Zakat to eligible people only.',
          },
        ]}
      />

      <section id="calculator" className="scroll-mt-32 py-16 md:py-24">
        <Container>
          <SectionHeading
            eyebrow="Zakat calculator"
            title="Work out your"
            emphasis="Zakat"
            intro="Enter what you own today, in rupees. Zakat is 2.5% of your zakatable wealth, once it has stayed above the nisab for a full lunar year."
          />
          <Reveal>
            <ZakatCalculator formId={PLEDGE_FORM} targetId="pledge" />
          </Reveal>
        </Container>
      </section>

      <Steps
        className="bg-sand/50"
        title="From pledge to"
        emphasis="update"
        steps={[
          {
            title: 'Calculate',
            text: 'Use the calculator above to work out 2.5% of your zakatable wealth — or choose any amount of Sadaqah.',
          },
          {
            title: 'Send your pledge',
            text: 'Choose Zakat or Sadaqah, the amount and who it should support. It opens on WhatsApp.',
          },
          {
            title: 'Pay personally',
            text: 'We share payment details with you personally on WhatsApp. Nothing is paid on this website.',
          },
          {
            title: 'Receive an update',
            text: 'We send a receipt and an update back to you on WhatsApp.',
          },
        ]}
      />

      <QuoteBand
        arabic="إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ"
        text="Zakah is only for the poor and the needy, for those employed to collect it, for bringing hearts together, for freeing captives, for those in debt, for the cause of Allah and for the stranded traveller — an obligation from Allah. And Allah is Knowing and Wise."
        source="Qur’an, Surah at-Tawbah 9:60 (meaning)"
      />

      <FormSection
        id="pledge"
        eyebrow="Make a pledge"
        title="Pledge your"
        emphasis="Zakat or Sadaqah"
        intro="Tell us the amount and who it should support. Payment details are shared with you personally on WhatsApp."
        points={[
          'No bank, UPI or card details are asked for on this website.',
          'Payment details are shared with you personally on WhatsApp.',
          'You receive a receipt and an update back on WhatsApp.',
          'Zakat is given only to eligible recipients.',
        ]}
      >
        <ServeForm
          formId={PLEDGE_FORM}
          title="I would like to pledge Zakat / Sadaqah."
          fields={PLEDGE_FIELDS}
          initial={{ support: 'Wherever most needed' }}
          submitLabel="Send pledge on WhatsApp"
          note="No payment is taken here — we’ll share payment details with you personally on WhatsApp."
        />
      </FormSection>

      <ServeFaq
        topic="Zakat and Sadaqah"
        items={[
          {
            q: 'Can imams and mu‘azzins receive Zakat?',
            a: 'Only if they themselves are eligible — for example, if they are poor or needy. Zakat cannot be given as a salary or payment for their work. Where they don’t qualify, support for them comes from Sadaqah.',
          },
          {
            q: 'What is the nisab?',
            a: 'It is the minimum wealth on which Zakat becomes due: the value of 87.48 g of gold or 612.36 g of silver. If your zakatable wealth stays above it for a full lunar year, 2.5% is due. Ask a scholar you trust which standard to follow.',
          },
          {
            q: 'What is the difference between Zakat and Sadaqah?',
            a: 'Zakat is an obligation on wealth above the nisab, and it may only go to the groups named in the Qur’an (9:60). Sadaqah is voluntary charity — any amount, at any time, for anyone in need.',
          },
          {
            q: 'How do I pay?',
            a: 'Send your pledge using the form. We share payment details with you personally on WhatsApp — this website never asks for bank, UPI or card details.',
          },
        ]}
      />

      <MoreWays current={section.slug} />
    </>
  );
}
