import type { Metadata, Viewport } from 'next';
import { Albert_Sans, Amiri } from 'next/font/google';
import './globals.css';
import { SITE } from '@/lib/site';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { CartDrawer } from '@/components/layout/cart-drawer';
import { FloatingActions } from '@/components/layout/floating-actions';

const albert = Albert_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-albert',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'Bold Mount — Talbeenah, Premium Dates & Sidr Honey',
    template: '%s · Bold Mount',
  },
  description: SITE.description,
  keywords: ['Talbeenah', 'Talbina', 'Ajwa dates', 'Sidr honey', 'Sunnah food', 'Umrah Badal', 'Zakat', 'Bold Mount'],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: 'Bold Mount — Sunnah Superfoods & Service',
    description: SITE.description,
    images: ['/images/products/talbeenah-real-photo.webp'],
  },
  icons: { icon: '/images/brand/icon-192.png', apple: '/images/brand/icon-512.png' },
};

export const viewport: Viewport = {
  themeColor: '#0b1b2b',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${albert.variable} ${amiri.variable}`}>
      <body>
        <AnnouncementBar />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <CartDrawer />
        <FloatingActions />
      </body>
    </html>
  );
}
