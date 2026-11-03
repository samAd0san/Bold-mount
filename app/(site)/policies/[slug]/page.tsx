import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { PolicyTabs } from '@/components/info/policy-tabs';
import { POLICIES, POLICY_UPDATED, getPolicy } from '@/components/info/policy-data';
import { pageMeta } from '@/components/info/page-meta';
import { whatsappGeneralLink } from '@/lib/whatsapp';
import { cn } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) return {};
  return pageMeta({ title: policy.title, description: policy.description, path: `/policies/${policy.slug}` });
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();

  return (
    <>
      <section className="border-b border-line bg-sand bg-lattice-ink">
        <Container className="py-10 md:py-14">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-ink-soft">
            <Link href="/" className="hover:text-navy">
              Home
            </Link>
            <ChevronRight size={12} aria-hidden />
            <span>Policies</span>
            <ChevronRight size={12} aria-hidden />
            <span className="text-ink">{policy.title}</span>
          </nav>
          <p className="eyebrow mt-6">Policies</p>
          <h1 className="mt-3 text-4xl text-ink md:text-5xl">{policy.title}</h1>
          <p className="mt-3 max-w-xl text-ink-soft md:text-lg">{policy.intro}</p>
          <p className="mt-4 text-sm text-ink-soft">Last updated: {POLICY_UPDATED}</p>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-16">
          <PolicyTabs active={policy.slug} />

          <article className="max-w-3xl">
            <div className="grid gap-9">
              {policy.blocks.map((b) => {
                const List = b.ordered ? 'ol' : 'ul';
                return (
                  <section key={b.heading}>
                    <h2 className="text-xl text-ink md:text-2xl">{b.heading}</h2>
                    {b.paragraphs?.map((p) => (
                      <p key={p} className="mt-3 leading-relaxed text-ink-soft">
                        {p}
                      </p>
                    ))}
                    {b.list && (
                      <List
                        className={cn(
                          'mt-3 space-y-2 pl-5 leading-relaxed text-ink-soft marker:text-gold-deep',
                          b.ordered ? 'list-decimal' : 'list-disc',
                        )}
                      >
                        {b.list.map((li) => (
                          <li key={li}>{li}</li>
                        ))}
                      </List>
                    )}
                    {b.link && (
                      <Link href={b.link.href} className="mt-3 inline-block font-semibold text-navy underline-offset-4 hover:underline">
                        {b.link.label} →
                      </Link>
                    )}
                  </section>
                );
              })}
            </div>

            <div className="mt-12 rounded-2xl border border-line bg-pearl p-6 shadow-card md:p-8">
              <h2 className="text-xl text-ink">Questions about this page?</h2>
              <p className="mt-2 text-sm text-ink-soft">Message us on WhatsApp and we will be glad to help.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={whatsappGeneralLink()} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp')}>
                  <WhatsAppGlyph size={18} /> Chat on WhatsApp
                </a>
                <Link href="/contact" className={buttonClass('outline')}>
                  Contact us
                </Link>
              </div>
            </div>
          </article>
        </Container>
      </section>
    </>
  );
}
