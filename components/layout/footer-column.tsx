'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Footer link list: tap-to-open accordion on phones, always open from md up. */
export function FooterColumn({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 md:border-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 w-full items-center justify-between text-left font-semibold text-gold md:pointer-events-none md:mb-4 md:min-h-0"
      >
        {heading}
        <ChevronDown size={18} className={cn('transition-transform md:hidden', open && 'rotate-180')} />
      </button>
      <ul className={cn('space-y-1 pb-4 md:block md:space-y-2.5 md:pb-0', open ? 'block' : 'hidden')}>
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="inline-block py-1.5 text-sm text-on-night-soft transition-colors hover:text-gold md:py-0">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
