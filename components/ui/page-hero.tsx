import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { Container } from './container';

// Full-bleed photo header for inner pages: breadcrumb, eyebrow, title, intro, optional CTAs.
export function PageHero({
  eyebrow,
  title,
  emphasis,
  intro,
  image,
  crumbs = [],
  children,
}: {
  eyebrow?: string;
  title: string;
  emphasis?: string;
  intro?: string;
  image: string;
  crumbs?: { label: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-night text-on-night">
      <Image src={image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-90" />
      <div className="absolute inset-0 -z-10 scrim-l" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night/70 to-transparent" />
      <Container className="flex min-h-[340px] flex-col justify-end py-10 md:min-h-[440px] md:py-16">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-on-night-soft">
          <Link href="/" className="hover:text-gold">Home</Link>
          {crumbs.map((c) => (
            <span key={c.label} className="flex items-center gap-1">
              <ChevronRight size={12} />
              {c.href ? <Link href={c.href} className="hover:text-gold">{c.label}</Link> : <span className="text-on-night">{c.label}</span>}
            </span>
          ))}
        </nav>
        {eyebrow && <p className="eyebrow text-gold">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-4xl leading-[1.08] md:text-6xl">
          {title} {emphasis && <span className="text-gold">{emphasis}</span>}
        </h1>
        {intro && <p className="mt-4 max-w-xl text-on-night-soft md:text-lg">{intro}</p>}
        {children && <div className="mt-7 flex flex-wrap gap-3">{children}</div>}
      </Container>
    </section>
  );
}
