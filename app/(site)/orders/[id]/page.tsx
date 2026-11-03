import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { TrackOrderView } from '@/components/auth/track-order-view';

export const metadata: Metadata = { title: 'Track order', robots: { index: false, follow: true } };

export default async function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Container className="pb-20 md:pb-28">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 py-4 text-xs text-ink-soft md:py-6">
        <Link href="/" className="hover:text-navy">Home</Link>
        <ChevronRight size={12} />
        <Link href="/orders" className="hover:text-navy">Your orders</Link>
        <ChevronRight size={12} />
        <span aria-current="page" className="text-ink">Track order</span>
      </nav>
      <header className="mb-8 md:mb-10">
        <p className="eyebrow">Your account</p>
        <div className="rule-gold mt-3" />
        <h1 className="mt-4 text-4xl text-ink md:text-6xl">Track order</h1>
      </header>
      <div className="max-w-3xl">
        <TrackOrderView id={id} />
      </div>
    </Container>
  );
}
