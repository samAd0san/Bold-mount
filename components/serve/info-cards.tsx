import type { LucideIcon } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

export interface InfoCard {
  icon: LucideIcon;
  title: string;
  text: string;
}

/** "What we do" band: icon cards on a soft sand background. */
export function InfoCards({
  id,
  eyebrow,
  title,
  emphasis,
  intro,
  cards,
  className,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  emphasis?: string;
  intro?: string;
  cards: InfoCard[];
  className?: string;
}) {
  return (
    <section id={id} className={cn('scroll-mt-32 bg-sand/50 py-16 md:py-24', className)}>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} emphasis={emphasis} intro={intro} />
        <div className={cn('grid gap-4 sm:grid-cols-2 md:gap-5', cards.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 0.08} className="h-full">
                <article className="h-full rounded-2xl bg-pearl p-6 shadow-card ring-1 ring-line">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold">
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg text-ink">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.text}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
