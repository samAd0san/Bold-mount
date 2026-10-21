import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { buttonClass } from '@/components/ui/button-styles';
import { BRAND } from '@/lib/media';

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This page could not be found. Head back to the Bold Mount home page or shop.',
};

export default function NotFound() {
  return (
    <section className="bg-lattice-ink py-20 md:py-28">
      <Container className="flex flex-col items-center text-center">
        <div className="relative h-24 w-48 overflow-hidden md:h-28 md:w-56">
          <Image src={BRAND.mark} alt="Bold Mount mountain logo" fill sizes="224px" className="object-cover" />
        </div>
        <p className="eyebrow mt-6">Error 404</p>
        <div className="rule-gold mt-3" />
        <h1 className="mt-5 max-w-xl text-4xl md:text-5xl">This path took a wrong turn.</h1>
        <p className="mt-4 max-w-md text-ink-soft md:text-lg">
          We couldn’t find the page you were looking for, but there is plenty more to explore.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonClass('gold')}>
            Back to Home
          </Link>
          <Link href="/shop" className={buttonClass('navy')}>
            Shop
          </Link>
          <Link href="/talbeenah" className={buttonClass('outline')}>
            Talbeenah
          </Link>
        </div>
      </Container>
    </section>
  );
}
