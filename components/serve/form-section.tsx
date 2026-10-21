import { CircleCheck } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

/** Anchored band: heading + reassurance points on the left, the form on a pearl card on the right. */
export function FormSection({
  id,
  eyebrow,
  title,
  emphasis,
  intro,
  points,
  aside,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  emphasis?: string;
  intro?: string;
  points: string[];
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // tabIndex -1: prefill buttons move focus here after scrolling.
    <section id={id} tabIndex={-1} className={cn('scroll-mt-32 bg-sand/60 py-16 outline-none md:py-24', className)}>
      <Container className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <Reveal>
          <SectionHeading eyebrow={eyebrow} title={title} emphasis={emphasis} intro={intro} className="mb-0 md:mb-0" />
          <ul className="mt-7 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex gap-3 text-sm leading-relaxed text-ink">
                <CircleCheck size={18} className="mt-0.5 shrink-0 text-gold-ink" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
          {aside && <div className="mt-8">{aside}</div>}
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-2xl bg-pearl p-5 shadow-card ring-1 ring-line sm:p-8">{children}</div>
        </Reveal>
      </Container>
    </section>
  );
}
