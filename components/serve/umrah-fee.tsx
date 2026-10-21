import { BadgeCheck, HandCoins, HeartHandshake, MessageCircle } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';

// Rulings as cited by Islam Question & Answer (IslamQA), supplied by Bold Mount; wording kept close to the source.
const RULINGS = [
  {
    who: 'Shaykh Ibn Baz',
    rahimahullah: true,
    text: 'Permitted receiving money for performing Hajj on behalf of another, provided the person has a proper religious intention and is not driven solely by worldly gain.',
  },
  {
    who: 'Shaykh Ibn ‘Uthaymeen',
    rahimahullah: true,
    text: 'Distinguished between taking money to enable oneself to perform the pilgrimage — which is permissible — and undertaking it solely to earn money, which he described as blameworthy.',
  },
  {
    who: 'The Permanent Committee (Saudi Arabia)',
    rahimahullah: false,
    text: 'In Fatawa al-Lajnah al-Da’imah (11/60), ruled that a person appointed to perform Hajj on behalf of someone else may receive payment, even if it exceeds travel, food and other expenses.',
  },
];

const COMMITMENTS = [
  { Icon: HandCoins, title: 'The fee covers the journey', text: 'Travel and stay in Makkah, local transport, food and the time of the person who performs it.' },
  { Icon: HeartHandshake, title: 'Done for the sake of Allah', text: 'It is an act of worship carried out with sincere intention — never treated as mere business.' },
  { Icon: BadgeCheck, title: 'Performed by the named person', text: 'The person we confirm with you performs it. It is never quietly passed to someone else without your consent.' },
  { Icon: MessageCircle, title: 'Agreed upfront', text: 'The amount, date and performer are confirmed with you on WhatsApp before you pay anything.' },
];

/** Explains why Umrah Badal carries a fee, with scholars' rulings and our commitments. */
export function UmrahFee() {
  return (
    <section id="why-fee" className="scroll-mt-32 border-t border-line py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Transparency"
          title="Why is there a"
          emphasis="fee?"
          intro="Performing Umrah on someone’s behalf means a real journey to Makkah. The fee pays for that journey and the performer’s time — and scholars have permitted taking payment for it, with the right intention."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {RULINGS.map((r, i) => (
            <Reveal key={r.who} delay={i * 0.06} className="h-full">
              <figure className="flex h-full flex-col rounded-2xl bg-pearl p-6 ring-1 ring-line sm:p-7">
                <figcaption className="text-sm font-semibold text-navy">
                  {r.who} {r.rahimahullah && <span className="font-arabic font-normal text-gold-ink">رحمه الله</span>}
                </figcaption>
                <blockquote className="mt-3 flex-1 leading-relaxed text-ink-soft">{r.text}</blockquote>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 rounded-[1.75rem] bg-navy bg-lattice p-6 text-on-night sm:p-8 md:p-10">
          <h3 className="text-2xl text-on-night md:text-3xl">
            Our <span className="text-gold">commitments</span> to you
          </h3>
          <ul className="mt-7 grid gap-6 sm:grid-cols-2">
            {COMMITMENTS.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-gold ring-1 ring-gold/40">
                  <Icon size={20} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-on-night">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-on-night-soft">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
