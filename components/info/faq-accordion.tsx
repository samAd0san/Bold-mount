'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FaqGroup } from './faq-data';

// One shared "open" id across all groups, so only a single answer is ever expanded.
export function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="grid gap-12 md:gap-16">
      {groups.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-28">
          <h2 id={`${g.id}-title`} className="text-2xl text-ink md:text-3xl">
            {g.title}
          </h2>
          <div className="rule-gold mt-3" />
          <div className="mt-6 rounded-2xl border border-line bg-pearl px-5 shadow-card md:px-8">
            {g.items.map((item, i) => {
              const id = `${g.id}-${i}`;
              const isOpen = open === id;
              return (
                <div key={id} className="border-b border-line last:border-b-0">
                  <h3 className="text-base md:text-lg">
                    <button
                      type="button"
                      id={`${id}-trigger`}
                      aria-expanded={isOpen}
                      aria-controls={`${id}-panel`}
                      onClick={() => setOpen(isOpen ? null : id)}
                      className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left font-semibold text-ink"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        size={20}
                        aria-hidden
                        className={cn('shrink-0 text-gold-ink transition-transform duration-300 ease-expo', isOpen && 'rotate-180')}
                      />
                    </button>
                  </h3>
                  <div
                    id={`${id}-panel`}
                    role="region"
                    aria-labelledby={`${id}-trigger`}
                    inert={!isOpen}
                    className={cn(
                      'grid transition-[grid-template-rows] duration-300 ease-expo',
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-5 pr-8 text-sm leading-relaxed text-ink-soft md:text-base">
                        <p>{item.a}</p>
                        {item.link && (
                          <Link href={item.link.href} className="mt-3 inline-block font-semibold text-navy underline-offset-4 hover:underline">
                            {item.link.label} →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
