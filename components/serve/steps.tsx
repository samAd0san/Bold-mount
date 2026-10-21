import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

export interface Step {
  title: string;
  text: string;
}

/** Numbered "How it works" row — 3 or 4 steps. */
export function Steps({
  eyebrow = 'How it works',
  title,
  emphasis,
  intro,
  steps,
  className,
}: {
  eyebrow?: string;
  title: string;
  emphasis?: string;
  intro?: string;
  steps: Step[];
  className?: string;
}) {
  return (
    <section className={cn('py-16 md:py-24', className)}>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} emphasis={emphasis} intro={intro} />
        <ol className={cn('grid gap-4 sm:grid-cols-2 md:gap-5', steps.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {steps.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 0.08} className="h-full">
                <div className="h-full rounded-2xl border border-line bg-pearl p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-base font-bold text-night">
                      {i + 1}
                    </span>
                    <span className="h-px flex-1 bg-line" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
