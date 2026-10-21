import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FaqItem {
  q: string;
  a: ReactNode;
}

/** Native <details> FAQ — opens without JavaScript, so the page stays a server component. */
export function MiniFaq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line rounded-2xl bg-pearl ring-1 ring-line ring-inset">
      {items.map((it) => (
        <details key={it.q} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-ink transition-colors hover:text-navy md:px-7 [&::-webkit-details-marker]:hidden">
            {it.q}
            <ChevronDown
              size={18}
              aria-hidden
              className="shrink-0 text-gold-ink transition-transform duration-300 group-open:rotate-180"
            />
          </summary>
          <div className="px-5 pb-5 leading-relaxed text-ink-soft md:px-7">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
