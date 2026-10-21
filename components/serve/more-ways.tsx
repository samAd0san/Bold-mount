import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { SERVE_SECTIONS } from '@/lib/sections';

/** "More ways to give" — small cards linking to the other serve pages. */
export function MoreWays({ current }: { current: string }) {
  const others = SERVE_SECTIONS.filter((s) => s.slug !== current);
  return (
    <section className="border-t border-line bg-pearl py-14 md:py-20">
      <Container>
        <SectionHeading eyebrow="Serve & Give" title="More ways to" emphasis="give" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.slug}>
                <Link
                  href={s.href}
                  className="group flex h-full items-center gap-4 rounded-2xl bg-cream p-3 ring-1 ring-line transition-shadow duration-300 hover:shadow-card"
                >
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                    <Image
                      src={s.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover transition-transform duration-700 ease-expo group-hover:scale-110"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gold-ink">
                      <Icon size={14} aria-hidden /> {s.short}
                    </span>
                    <span className="mt-1 block font-semibold leading-snug text-ink">{s.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{s.tagline}</span>
                  </span>
                  <ArrowRight
                    size={18}
                    className="mr-1 shrink-0 text-navy transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
