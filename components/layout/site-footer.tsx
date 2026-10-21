import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';
import { BRAND } from '@/lib/media';
import { SHOP_SECTIONS, SERVE_SECTIONS } from '@/lib/sections';
import { SITE } from '@/lib/site';
import { whatsappGeneralLink } from '@/lib/whatsapp';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { FooterColumn } from './footer-column';

const HELP = [
  { label: 'Our Story', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Delivery & Returns', href: '/policies/shipping' },
  { label: 'Privacy Policy', href: '/policies/privacy' },
  { label: 'Terms of Service', href: '/policies/terms' },
];

export function SiteFooter() {
  return (
    <footer className="bg-lattice bg-night text-on-night">
      <div className="mx-auto max-w-site px-5 pt-14 pb-8 md:px-8 md:pt-20 lg:px-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          <div className="space-y-5">
            <Image src={BRAND.logoIvory} alt="Bold Mount" width={150} height={82} className="h-16 w-auto" />
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
            <a
              href={whatsappGeneralLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-white"
            >
              <WhatsAppGlyph size={17} /> Chat with us
            </a>
          </div>

          <FooterColumn heading="Shop" links={[...SHOP_SECTIONS.map((s) => ({ label: s.title, href: s.href })), { label: 'Gift Boxes', href: '/shop?filter=gifts' }]} />
          <FooterColumn heading="Serve & Give" links={SERVE_SECTIONS.map((s) => ({ label: s.title, href: s.href }))} />
          <FooterColumn heading="Help" links={HELP} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-on-night-soft md:flex-row">
          <p>© {new Date().getFullYear()} Bold Mount. All rights reserved.</p>
          <p>Every order is confirmed personally on WhatsApp</p>
        </div>
      </div>
    </footer>
  );
}
