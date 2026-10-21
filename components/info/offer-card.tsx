import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Section } from '@/lib/sections';
import { cn } from '@/lib/utils';

// Linked icon card for one site section; `dark` is the night-band variant.
export function OfferCard({ section, dark = false, className }: { section: Section; dark?: boolean; className?: string }) {
  const Icon = section.icon;
  return (
    <Link
      href={section.href}
      className={cn(
        'group flex h-full flex-col rounded-2xl p-6 transition-all duration-300 ease-expo hover:-translate-y-1',
        dark
          ? 'border border-on-night/10 bg-night-2 hover:border-gold/50'
          : 'border border-line bg-pearl shadow-card hover:shadow-card-hover',
        className,
      )}
    >
      <span className={cn('flex size-12 items-center justify-center rounded-full', dark ? 'bg-gold text-night' : 'bg-navy text-gold')}>
        <Icon size={22} aria-hidden />
      </span>
      <h3 className={cn('mt-5 text-xl', dark ? 'text-on-night' : 'text-ink')}>{section.title}</h3>
      <p className={cn('mt-1 text-sm font-medium', dark ? 'text-gold' : 'text-gold-ink')}>{section.tagline}</p>
      <p className={cn('mt-3 text-sm leading-relaxed', dark ? 'text-on-night-soft' : 'text-ink-soft')}>{section.blurb}</p>
      <span className={cn('mt-auto flex items-center gap-2 pt-5 text-sm font-semibold', dark ? 'text-gold' : 'text-navy')}>
        {section.cta}
        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}
