import type { LucideIcon } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';

export interface Point {
  icon: LucideIcon;
  title: string;
  text: string;
}

const COLS = {
  2: 'sm:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const;

/** Icon + title + one-liner cards, gently staggered in. */
export function PointGrid({ points, cols = 3 }: { points: Point[]; cols?: keyof typeof COLS }) {
  return (
    <ul className={`grid gap-4 md:gap-6 ${COLS[cols]}`}>
      {points.map((p, i) => {
        const Icon = p.icon;
        return (
          <li key={p.title}>
            <Reveal delay={i * 0.08} className="h-full rounded-2xl bg-pearl p-6 ring-1 ring-line ring-inset md:p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold-ink">
                <Icon size={22} aria-hidden />
              </span>
              <h3 className="mt-5 text-lg text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.text}</p>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}
