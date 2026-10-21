import type { Metadata } from 'next';
import { HeartPulse, MoonStar, ShoppingBasket, Snowflake } from 'lucide-react';
import type { FormField } from '@/components/forms/whatsapp-form';
import { PageHero } from '@/components/ui/page-hero';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { ServeIntro } from '@/components/serve/serve-intro';
import { InfoCards } from '@/components/serve/info-cards';
import { Steps } from '@/components/serve/steps';
import { QuoteBand } from '@/components/serve/quote-band';
import { FormSection } from '@/components/serve/form-section';
import { FormTabs } from '@/components/serve/form-tabs';
import { ServeFaq } from '@/components/serve/serve-faq';
import { MoreWays } from '@/components/serve/more-ways';
import { getSection } from '@/lib/sections';
import { SITE } from '@/lib/site';
import { whatsappLink } from '@/lib/whatsapp';

const section = getSection('khidmat-e-khalq');

export const metadata: Metadata = {
  title: 'Khidmat-e-Khalq — Serving People',
  description:
    'Ration kits for families, help in illness and hardship, community iftars and winter drives. Ask Bold Mount for help, or volunteer and contribute — all on WhatsApp.',
};

const HELP_FIELDS: FormField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, placeholder: '10-digit mobile number' },
  { name: 'city', label: 'City / Area', required: true },
  {
    name: 'need',
    label: 'What do you need help with?',
    type: 'select',
    required: true,
    options: ['Food / ration', 'Medical help', 'Education fees', 'Other'],
  },
  { name: 'details', label: 'Details', type: 'textarea', placeholder: 'Share only what you are comfortable with.' },
];

const JOIN_FIELDS: FormField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, placeholder: '10-digit mobile number' },
  { name: 'city', label: 'City', required: true },
  {
    name: 'how',
    label: 'How would you like to help?',
    type: 'select',
    options: ['Volunteer time', 'Donate food/items', 'Donate money', 'Spread the word'],
  },
  { name: 'message', label: 'Message', type: 'textarea' },
];

export default function KhidmatPage() {
  return (
    <>
      <PageHero
        eyebrow="Serve & Give"
        title="Khidmat-e-Khalq —"
        emphasis="serving people"
        intro="For the sake of Allah: ration kits for families, help through illness and hardship, community iftars and winter drives. Ask for help, or join us in giving it."
        image={section.image}
        crumbs={[{ label: 'Serve & Give' }, { label: section.title }]}
      >
        <a href="#ask-help" className={buttonClass('gold')}>
          Ask for help
        </a>
        <a href="#join" className={buttonClass('outline-light')}>
          Volunteer or contribute
        </a>
      </PageHero>

      <ServeIntro
        eyebrow="Khidmat-e-Khalq"
        title="Small acts of service,"
        emphasis="done with dignity"
        aside={
          <div className="rounded-2xl bg-navy bg-lattice p-6 text-on-night shadow-card sm:p-8">
            <p className="eyebrow text-gold">Need help right now?</p>
            <p className="mt-3 text-2xl font-semibold leading-snug">Tell us what you are going through.</p>
            <p className="mt-3 text-sm leading-relaxed text-on-night-soft">
              We reply as soon as we can, in shā’ Allāh, and tell you honestly what we are able to do. You can also
              call or WhatsApp {SITE.phoneDisplay}.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#ask-help" className={buttonClass('gold')}>
                Ask for help
              </a>
              <a
                href={whatsappLink('Assalamu alaikum Bold Mount, I need some help.')}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass('whatsapp')}
              >
                <WhatsAppGlyph size={18} /> WhatsApp us
              </a>
            </div>
          </div>
        }
      >
        <p>
          Khidmat-e-Khalq means serving Allah’s creation. For us it is simple, practical help: a ration kit for a family
          going through a hard month, support when someone falls ill, an iftar shared with the neighbourhood, a warm
          blanket before winter.
        </p>
        <p>
          Every request is handled quietly and respectfully. Nobody has to explain more than they are comfortable with —
          and anyone who wants to help can join in, with their time, their skills or their giving.
        </p>
      </ServeIntro>

      <InfoCards
        eyebrow="What we do"
        title="Help that reaches"
        emphasis="real homes"
        cards={[
          {
            icon: ShoppingBasket,
            title: 'Food & ration kits',
            text: 'Everyday essentials like rice, flour, dal and oil for families going through a difficult time.',
          },
          {
            icon: HeartPulse,
            title: 'Help in illness & hardship',
            text: 'Support with medicines, hospital needs or a sudden hardship, arranged with people who can help.',
          },
          {
            icon: MoonStar,
            title: 'Community iftars',
            text: 'Iftars in Ramadan where neighbours, travellers and those fasting alone can break their fast together.',
          },
          {
            icon: Snowflake,
            title: 'Winter & relief drives',
            text: 'Blankets and warm clothes in winter, and relief for families hit by floods or other emergencies.',
          },
        ]}
      />

      <Steps
        title="Asking for help is"
        emphasis="simple"
        steps={[
          {
            title: 'Tell us what you need',
            text: 'Fill the short form below. It opens WhatsApp with your details — just press send.',
          },
          {
            title: 'We get in touch',
            text: 'Someone from our team replies on WhatsApp or calls you to understand your situation.',
          },
          {
            title: 'Help is arranged',
            text: 'We arrange what we can — food, support, or a connection to someone who can help.',
          },
          {
            title: 'Givers make it possible',
            text: 'Volunteers and donors from the community give the time, food and funds behind every kit.',
          },
        ]}
      />

      <QuoteBand
        arabic="خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ"
        lead="The Prophet ﷺ said:"
        text="The best of people are those who are most beneficial to people."
        source="al-Mu‘jam al-Awsat (al-Tabarani) · graded hasan"
      />

      <FormSection
        id="get-involved"
        eyebrow="Ask or offer"
        title="Ask for help, or"
        emphasis="lend a hand"
        intro="Choose a form. Your details open in WhatsApp, so you can check them before sending."
        points={[
          'Nothing is sent until you press send in WhatsApp.',
          'Requests are kept private and shared only with those arranging help.',
          'Share only what you are comfortable with.',
          `Can’t fill a form? Call or WhatsApp ${SITE.phoneDisplay}.`,
        ]}
      >
        <FormTabs
          tabs={[
            {
              id: 'ask-help',
              label: 'Ask for help',
              intro: 'Tell us a little about what you need. We will reply on WhatsApp.',
              title: 'I would like to ask for help (Khidmat-e-Khalq).',
              fields: HELP_FIELDS,
              submitLabel: 'Send request on WhatsApp',
            },
            {
              id: 'join',
              label: 'Volunteer or contribute',
              intro: 'Give your time, food or funds — or simply help spread the word.',
              title: 'I would like to join Khidmat-e-Khalq as a volunteer / contributor.',
              fields: JOIN_FIELDS,
              submitLabel: 'Send on WhatsApp',
            },
          ]}
        />
      </FormSection>

      <ServeFaq
        topic="Khidmat-e-Khalq"
        items={[
          {
            q: 'Who can ask for help?',
            a: 'Anyone going through a hard time — a family short on food, someone facing medical costs, or a student who can’t pay fees. Tell us your situation and we’ll reply honestly about what we can do.',
          },
          {
            q: 'Which cities do you reach?',
            a: 'Mention your city or area in the form. We’ll let you know whether we can help directly, or whether we know someone nearby who can.',
          },
          {
            q: 'Can I give food or items instead of money?',
            a: 'Yes. Choose “Donate food/items” in the volunteer form and tell us what you have. We’ll work out with you how it reaches a family who needs it.',
          },
          {
            q: 'Is my information kept private?',
            a: 'Yes. Your details are used only to arrange help and are not shared publicly.',
          },
        ]}
      />

      <MoreWays current={section.slug} />
    </>
  );
}
