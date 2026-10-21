import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';

/** Short two-column intro: heading + body copy, beside a photo or a custom aside. */
export function ServeIntro({
  eyebrow,
  title,
  emphasis,
  image,
  imageAlt = '',
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  emphasis?: string;
  image?: string;
  imageAlt?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="py-16 md:py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <SectionHeading eyebrow={eyebrow} title={title} emphasis={emphasis} className="mb-6 md:mb-6" />
          <div className="space-y-4 leading-relaxed text-ink-soft">{children}</div>
        </Reveal>
        <Reveal delay={0.1}>
          {image ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand shadow-card">
              <Image src={image} alt={imageAlt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
          ) : (
            aside
          )}
        </Reveal>
      </Container>
    </section>
  );
}
