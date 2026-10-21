import type { Metadata } from 'next';
import { Briefcase, GraduationCap, Smartphone, Store } from 'lucide-react';
import type { FormField } from '@/components/forms/whatsapp-form';
import { PageHero } from '@/components/ui/page-hero';
import { buttonClass } from '@/components/ui/button-styles';
import { ServeIntro } from '@/components/serve/serve-intro';
import { InfoCards } from '@/components/serve/info-cards';
import { Steps } from '@/components/serve/steps';
import { QuoteBand } from '@/components/serve/quote-band';
import { FormSection } from '@/components/serve/form-section';
import { FormTabs } from '@/components/serve/form-tabs';
import { ServeFaq } from '@/components/serve/serve-faq';
import { MoreWays } from '@/components/serve/more-ways';
import { getSection } from '@/lib/sections';
import { STOCK } from '@/lib/media';

const section = getSection('volunteer');

export const metadata: Metadata = {
  title: 'Free Volunteer Guidance — Business, Jobs & Careers',
  description:
    'Free guidance from Bold Mount volunteers: business set-up, job consultation, career guidance for students and digital help for small shops. Or join as a volunteer mentor.',
};

const SERVICES = [
  'Business set-up guidance',
  'Job consultation',
  'Students & career guidance',
  'Small-shop digital help',
  'Something else',
];

const GUIDANCE_FIELDS: FormField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, placeholder: '10-digit mobile number' },
  { name: 'service', label: 'Service', type: 'select', required: true, options: SERVICES },
  { name: 'city', label: 'City' },
  {
    name: 'situation',
    label: 'Tell us about your situation',
    type: 'textarea',
    placeholder: 'e.g. I want to start a home food business / I have an interview next week',
  },
];

const MENTOR_FIELDS: FormField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, placeholder: '10-digit mobile number' },
  { name: 'expertise', label: 'Your expertise', required: true, placeholder: 'e.g. accounts, HR, marketing, software' },
  { name: 'hours', label: 'Hours per month', type: 'number', placeholder: 'e.g. 4' },
  { name: 'link', label: 'LinkedIn / portfolio', full: true, placeholder: 'Link (optional)' },
];

export default function VolunteerPage() {
  return (
    <>
      <PageHero
        eyebrow="Serve & Give"
        title="Free guidance from"
        emphasis="people who care"
        intro="Business set-up advice, job consultation, career guidance for students and digital help for small shops — given by volunteers, at no cost."
        image={section.image}
        crumbs={[{ label: 'Serve & Give' }, { label: section.title }]}
      >
        <a href="#guidance" className={buttonClass('gold')}>
          Get free guidance
        </a>
        <a href="#mentor" className={buttonClass('outline-light')}>
          Become a mentor
        </a>
      </PageHero>

      <ServeIntro
        eyebrow="Volunteer services"
        title="Good advice should"
        emphasis="not cost a fortune"
        image={STOCK.interview}
        imageAlt="A CV and notes laid out on a desk, ready for an interview"
      >
        <p>
          Starting a small business, looking for a job or choosing a career can feel overwhelming when there is no one
          to ask. Our volunteers share what they know — patiently, practically and free of charge.
        </p>
        <p>
          Ask for guidance below. And if you have experience to share, join us as a volunteer mentor — even a few hours
          a month can change someone’s direction.
        </p>
      </ServeIntro>

      <InfoCards
        eyebrow="What we offer"
        title="Four kinds of"
        emphasis="free guidance"
        cards={[
          {
            icon: Store,
            title: 'Business set-up guidance',
            text: 'Registration, GST and FSSAI basics, pricing your products and simple marketing for your first customers.',
          },
          {
            icon: Briefcase,
            title: 'Job consultation',
            text: 'CV review, interview preparation and honest advice on your next career step.',
          },
          {
            icon: GraduationCap,
            title: 'Students & career guidance',
            text: 'Help choosing a course or career path, and practical next steps after school or college.',
          },
          {
            icon: Smartphone,
            title: 'Small-shop digital help',
            text: 'Setting up WhatsApp Business and a simple social media presence so customers can find you.',
          },
        ]}
      />

      <Steps
        title="How guidance"
        emphasis="works"
        steps={[
          { title: 'Send a request', text: 'Choose a service and tell us a little about your situation.' },
          { title: 'We connect you', text: 'We put you in touch with a volunteer who has experience in that area.' },
          { title: 'Talk it through', text: 'A call, a WhatsApp video or a meeting — whatever works for you both.' },
          { title: 'Take the next step', text: 'Leave with clear next steps, and come back whenever you need more help.' },
        ]}
      />

      <QuoteBand
        arabic="وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ"
        text="And cooperate in righteousness and piety."
        source="Qur’an, Surah al-Mā’idah 5:2"
      />

      <FormSection
        id="get-guidance"
        eyebrow="Free of charge"
        title="Ask for guidance, or"
        emphasis="become a mentor"
        intro="Choose a form. Your details open in WhatsApp, so you can check them before sending."
        points={[
          'Guidance is free — there is nothing to pay.',
          'Nothing is sent until you press send in WhatsApp.',
          'General guidance only — for legal or tax filings, please use a qualified professional.',
          'Mentors choose how much time they can give.',
        ]}
      >
        <FormTabs
          tabs={[
            {
              id: 'guidance',
              label: 'Request free guidance',
              intro: 'Tell us what you need help with, and we will connect you with a volunteer.',
              title: 'I would like free guidance (Volunteer Services).',
              fields: GUIDANCE_FIELDS,
              submitLabel: 'Send request on WhatsApp',
            },
            {
              id: 'mentor',
              label: 'Become a mentor',
              intro: 'Share your experience with people who need it. Give as much or as little time as you can.',
              title: 'I would like to become a volunteer mentor.',
              fields: MENTOR_FIELDS,
              submitLabel: 'Send on WhatsApp',
            },
          ]}
        />
      </FormSection>

      <ServeFaq
        topic="volunteer guidance"
        items={[
          {
            q: 'Is it really free?',
            a: 'Yes. Our volunteers give their time for the sake of Allah. You will not be charged for any guidance.',
          },
          {
            q: 'Can you file my GST or FSSAI registration?',
            a: 'We explain the process and what you need, so you can go ahead with confidence. For the actual filings and tax advice, please use a qualified CA or consultant.',
          },
          {
            q: 'Who are the mentors?',
            a: 'Volunteers from the community with experience in business, hiring, careers and digital work. Feel free to ask about their background when we connect you.',
          },
          {
            q: 'How do I become a mentor?',
            a: 'Choose “Become a mentor” in the form above, share your area of expertise and how many hours a month you can give. We will get in touch on WhatsApp.',
          },
        ]}
      />

      <MoreWays current={section.slug} />
    </>
  );
}
