import { BadgeCheck, ExternalLink, HandCoins, HeartHandshake, MessageCircle } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';

// Verified 2026-10-21 against IslamQA (ar) answer 26978, which cites the Committee at 11/60. Add only rulings you can source.
const RULING = {
  who: 'The Permanent Committee for Scholarly Research and Ifta’',
  cite: 'Fatawa al-Lajnah al-Da’imah 11/60',
  text: 'It is permissible for the one appointed to perform Hajj on another’s behalf to take the payment agreed for it — even if it is more than he spent on transport, food and drink. He should intend to share in the good and to worship in the Sacred House, and not intend money alone.',
  source: 'https://islamqa.info/ar/answers/26978',
};

const COMMITMENTS = [
  { Icon: HandCoins, title: 'The fee covers the journey', text: 'Travel and stay in Makkah, local transport, food and the time of the person who performs it.' },
  { Icon: HeartHandshake, title: 'Done for the sake of Allah', text: 'It is an act of worship carried out with sincere intention — never treated as mere business.' },
  { Icon: BadgeCheck, title: 'Performed by the named person', text: 'The person we confirm with you performs it. It is never quietly passed to someone else without your consent.' },
  { Icon: MessageCircle, title: 'Agreed upfront', text: 'The amount, date and performer are confirmed with you on WhatsApp before you pay anything.' },
];

/** Explains why Umrah Badal carries a fee: one sourced ruling plus our commitments. */
export function UmrahFee() {
  return (
    <section id="why-fee" className="scroll-mt-32 border-t border-line py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Transparency"
          title="Why is there a"
          emphasis="fee?"
          intro="Performing Umrah on someone’s behalf means a real journey to Makkah. The fee pays for that journey and the performer’s time."
        />

        <Reveal>
          <figure className="rounded-2xl border-l-4 border-gold bg-pearl p-6 ring-1 ring-line sm:p-8">
            <blockquote className="text-lg leading-relaxed text-ink md:text-xl">“{RULING.text}”</blockquote>
            <figcaption className="mt-5 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>
                <span className="font-semibold text-navy">{RULING.who}</span>
                <span className="text-ink-soft"> · {RULING.cite} (translated summary)</span>
              </span>
              <a
                href={RULING.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-navy underline-offset-4 hover:underline"
              >
                Read the fatwa (Arabic) <ExternalLink size={14} aria-hidden />
              </a>
            </figcaption>
          </figure>
        </Reveal>

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
