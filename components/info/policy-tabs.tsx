import Link from 'next/link';
import { cn } from '@/lib/utils';
import { POLICIES } from './policy-data';

// Pills on phones, a vertical list beside the text on large screens.
export function PolicyTabs({ active }: { active: string }) {
  return (
    <nav aria-label="Policies" className="lg:sticky lg:top-28 lg:self-start">
      <ul className="flex flex-wrap gap-2 lg:flex-col">
        {POLICIES.map((p) => {
          const current = p.slug === active;
          return (
            <li key={p.slug}>
              <Link
                href={`/policies/${p.slug}`}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center rounded-full border px-5 text-sm font-medium transition-colors lg:rounded-xl',
                  current
                    ? 'border-navy bg-navy text-on-night'
                    : 'border-line bg-pearl text-ink hover:border-navy/50',
                )}
              >
                {p.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
