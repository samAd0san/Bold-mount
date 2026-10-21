import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/motion/reveal';

/** Dark lattice band for one ayah or hadith: optional Arabic, meaning in English, and its citation. */
export function QuoteBand({
  arabic,
  lead,
  text,
  after,
  source,
  image,
}: {
  arabic?: string;
  lead?: string; // e.g. "The Prophet ﷺ said:"
  text: string;
  after?: string; // a closing line outside the quote, e.g. the reply
  source: string;
  image?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-night bg-lattice py-16 text-on-night md:py-24">
      {image && (
        <>
          <Image src={image} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25" />
          <div className="absolute inset-0 -z-10 bg-night/60" />
        </>
      )}
      <Container>
        <Reveal>
          <figure className="mx-auto max-w-3xl text-center">
            {arabic && (
              <p lang="ar" dir="rtl" className="font-arabic text-3xl leading-loose text-gold md:text-4xl">
                {arabic}
              </p>
            )}
            {lead && <p className="mt-6 text-sm text-on-night-soft">{lead}</p>}
            <blockquote className="mt-3 text-xl leading-relaxed text-on-night md:text-2xl">
              <p>“{text}”</p>
            </blockquote>
            {after && <p className="mt-3 text-lg text-on-night md:text-xl">{after}</p>}
            <figcaption className="mt-7 flex items-center justify-center gap-3 text-sm text-on-night-soft">
              <span className="rule-gold hidden shrink-0 sm:block" aria-hidden />
              <cite className="not-italic">{source}</cite>
              <span className="rule-gold hidden shrink-0 sm:block" aria-hidden />
            </figcaption>
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}
