import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';
import { BRAND } from '@/lib/media';
import { SERVE_SECTIONS, shopSections } from '@/lib/sections';
import type { Category } from '@/lib/types';
import { SITE } from '@/lib/site';
import { FooterColumn } from './footer-column';

const HELP = [
  { label: 'Our Story', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Delivery & Returns', href: '/policies/shipping' },
  { label: 'Privacy Policy', href: '/policies/privacy' },
  { label: 'Terms of Service', href: '/policies/terms' },
  { label: 'Photo credits', href: '/credits' },
];

export function SiteFooter({ categories }: { categories: Category[] }) {
  return (
    <footer className="bg-lattice bg-night text-on-night">
      <div className="mx-auto max-w-site px-5 pt-14 pb-8 md:px-8 md:pt-20 lg:px-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          <div className="space-y-5">
            <Image src={BRAND.logoIvorySm} alt="Bold Mount" width={294} height={160} unoptimized className="h-16 w-auto" />
            <p className="max-w-sm text-sm leading-relaxed text-on-night-soft">
              Sunnah superfoods from blessed lands — and a community that serves. A share of every order supports
              families, madrasas and people in need.
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`tel:+${SITE.whatsapp}`} className="flex items-center gap-3 text-on-night-soft hover:text-gold">
                  <Phone size={16} className="anim-ring text-gold" /> {SITE.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 text-on-night-soft hover:text-gold">
                  <Mail size={16} className="anim-bob text-gold" /> {SITE.email}
                </a>
              </li>
              <li className="flex items-center gap-3 text-on-night-soft">
                <MapPin size={16} className="text-gold" /> Doorstep delivery — share your location
              </li>
            </ul>
          </div>

          <FooterColumn heading="Shop" links={[...shopSections(categories).map((s) => ({ label: s.title, href: s.href })), { label: 'Gift Boxes', href: '/shop?filter=gifts' }]} />
          <FooterColumn heading="Serve & Give" links={SERVE_SECTIONS.map((s) => ({ label: s.title, href: s.href }))} />
          <FooterColumn heading="Help" links={HELP} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-on-night-soft md:flex-row">
          <p>© {new Date().getFullYear()} Bold Mount. All rights reserved.</p>
          <p>We confirm every order personally</p>
        </div>
      </div>
    </footer>
  );
}
