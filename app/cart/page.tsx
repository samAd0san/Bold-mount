import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { CartView } from '@/components/product/cart-view';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Review your Bold Mount order and send it to us on WhatsApp — we confirm availability, delivery and payment there.',
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <Container className="pb-20 md:pb-28">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 py-4 text-xs text-ink-soft md:py-6">
        <Link href="/" className="hover:text-navy">Home</Link>
        <ChevronRight size={12} />
        <span aria-current="page" className="text-ink">Cart</span>
      </nav>
      <header className="mb-8 md:mb-10">
        <p className="eyebrow">Checkout</p>
        <div className="rule-gold mt-3" />
        <h1 className="mt-4 text-4xl text-ink md:text-6xl">Your cart</h1>
      </header>
      <CartView />
    </Container>
  );
}
