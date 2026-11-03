import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { AccountView } from '@/components/auth/account-view';

export const metadata: Metadata = { title: 'My orders', robots: { index: false, follow: true } };

export default function AccountPage() {
  return (
    <Container className="pb-20 md:pb-28">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 py-4 text-xs text-ink-soft md:py-6">
        <Link href="/" className="hover:text-navy">Home</Link>
        <ChevronRight size={12} />
        <span aria-current="page" className="text-ink">My orders</span>
      </nav>
      <header className="mb-8 md:mb-10">
        <p className="eyebrow">Your account</p>
        <div className="rule-gold mt-3" />
        <h1 className="mt-4 text-4xl text-ink md:text-6xl">My orders</h1>
      </header>
      <div className="max-w-3xl">
        <AccountView />
      </div>
    </Container>
  );
}
