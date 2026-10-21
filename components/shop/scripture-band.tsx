import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/motion/reveal';

/** Centred Qur'an / hadith quote under a large Arabic accent; `light` sits on sand instead of night. */
export function ScriptureBand({
  arabic,
  quote,
  source,
  narrator,
  light = false,
}: {
  arabic: string;
  quote: string;
  source: string;
  narrator?: string;
  light?: boolean;
}) {
  // Plain strings, not cn(): tailwind-merge would treat bg-lattice as a colour and drop bg-night.
  const band = light ? 'bg-sand bg-lattice-ink text-ink' : 'bg-night bg-lattice text-on-night';
  const accent = light ? 'text-gold-ink' : 'text-gold';

  return (
    <section className={band}>
      <Container className="py-16 md:py-24">
        <Reveal>
          <figure className="mx-auto max-w-3xl text-center">
            <p lang="ar" dir="rtl" aria-hidden="true" className={`font-arabic text-5xl leading-[1.5] md:text-7xl ${accent}`}>
              {arabic}
            </p>
            <div className="rule-gold mx-auto mt-5" />
            <blockquote className="mt-6 text-xl leading-relaxed md:text-[1.75rem] md:leading-relaxed">
              <p>“{quote}”</p>
            </blockquote>
            <figcaption className={`mt-6 text-sm ${light ? 'text-ink-soft' : 'text-on-night-soft'}`}>
              {narrator && <span className="block">{narrator}</span>}
              <cite className={`mt-1.5 block font-semibold tracking-wide not-italic ${light ? 'text-navy' : 'text-gold'}`}>
                {source}
              </cite>
            </figcaption>
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}
