import { MapPin } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { WhatsAppForm, type FormField } from '@/components/forms/whatsapp-form';
import { ContactCards } from '@/components/info/contact-cards';
import { pageMeta } from '@/components/info/page-meta';
import { STOCK } from '@/lib/media';
import { SITE } from '@/lib/site';

export const metadata = pageMeta({
  title: 'Contact Us',
  description: `Message Bold Mount on WhatsApp at ${SITE.phoneDisplay}, call us or email ${SITE.email}. Questions about orders, gifts, Zakat, Umrah Badal or volunteer services are welcome.`,
  path: '/contact',
});

const TOPICS = [
  'Order / product question',
  'Bulk or gift order',
  'Zakat / donations',
  'Umrah Badal',
  'Volunteer services',
  'Something else',
];

const FIELDS: FormField[] = [
  { name: 'name', label: 'Name', required: true, placeholder: 'Your name' },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true, placeholder: '10-digit mobile number' },
  { name: 'topic', label: 'Topic', type: 'select', options: TOPICS, required: true, placeholder: 'What is this about?', full: true },
  { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'How can we help?' },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title="Let’s"
        emphasis="talk."
        intro="A question about an order, a gift box or one of our services? Message us on WhatsApp and we’ll take it from there."
        image={STOCK.porridgeBowl}
        crumbs={[{ label: 'Contact' }]}
      />

      <section className="py-16 md:py-24">
        <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Reveal>
            <SectionHeading
              eyebrow="Reach us"
              title="Pick whatever is"
              emphasis="easiest."
              intro="WhatsApp is best, but a call or an email works too."
              className="mb-6 md:mb-8"
            />
            <ContactCards />
            <ul className="mt-6 grid gap-3 text-sm text-ink-soft">
              <li className="flex items-center gap-3">
                <MapPin size={16} className="shrink-0 text-gold-ink" aria-hidden /> Doorstep delivery — share your location
              </li>
            </ul>
          </Reveal>

          <Reveal delay={0.1} className="self-start">
            <div className="rounded-2xl border border-line bg-pearl p-6 shadow-card md:p-8">
              <h2 className="text-2xl text-ink md:text-3xl">Send us a message</h2>
              <p className="mb-6 mt-2 text-sm text-ink-soft">Fill this in and we’ll open WhatsApp with your message ready to send.</p>
              <WhatsAppForm
                title="I’d like to get in touch."
                fields={FIELDS}
                submitLabel="Send on WhatsApp"
                note="We aim to reply on WhatsApp within a few hours, in shā’ Allāh."
              />
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
