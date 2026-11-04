import type { Metadata, Viewport } from 'next';
import { Albert_Sans, Amiri } from 'next/font/google';
import './globals.css';
import { SITE } from '@/lib/site';

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
    // Logo card for WhatsApp/Facebook/X link previews (product pages still show their own photo).
    images: [{ url: '/images/brand/og-image.png', width: 1200, height: 630, alt: 'Bold Mount — Sunnah Superfoods & Service' }],
  },
  twitter: { card: 'summary_large_image', images: ['/images/brand/og-image.png'] },
  icons: { icon: '/images/brand/icon-192.png', apple: '/images/brand/icon-512.png' },
};

export const viewport: Viewport = {
  themeColor: '#0b1b2b',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${albert.variable} ${amiri.variable}`}>
      <body>{children}</body>
    </html>
  );
}
