import Link from 'next/link';
import { cn } from '@/lib/utils';

// Eyebrow + gold rule + serif title (+ italic gold emphasis), optional "view all" link on the right.
export function SectionHeading({
  eyebrow,
  title,
  emphasis,
  intro,
  align = 'left',
  dark = false,
  link,
  className,
}: {
  eyebrow?: string;
  title: string;
  emphasis?: string;
  intro?: string;
  align?: 'left' | 'center';
  dark?: boolean;
  link?: { label: string; href: string };
  className?: string;
}) {
  const center = align === 'center';
  return (
    <div className={cn('mb-8 flex items-end justify-between gap-6 md:mb-12', center && 'justify-center text-center', className)}>
      <div className={cn('max-w-2xl', center && 'mx-auto')}>
        {eyebrow && <p className={cn('eyebrow', dark && 'text-gold')}>{eyebrow}</p>}
        {eyebrow && <div className={cn('rule-gold mt-3', center && 'mx-auto')} />}
        <h2 className={cn('mt-4 text-3xl leading-tight md:text-[2.75rem]', dark ? 'text-on-night' : 'text-ink')}>
          {title} {emphasis && <span className={dark ? 'text-gold' : 'text-gold-ink'}>{emphasis}</span>}
        </h2>
        {intro && <p className={cn('mt-4 leading-relaxed', dark ? 'text-on-night-soft' : 'text-ink-soft')}>{intro}</p>}
      </div>
      {link && !center && (
        <Link
          href={link.href}
          className={cn(
            'hidden shrink-0 text-sm font-semibold underline-offset-4 hover:underline sm:inline',
            dark ? 'text-gold' : 'text-navy',
          )}
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}
