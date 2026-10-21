import { Mail, Phone } from 'lucide-react';
import { SITE } from '@/lib/site';
import { whatsappGeneralLink } from '@/lib/whatsapp';
import { buttonClass } from '@/components/ui/button-styles';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';

const telHref = (display: string) => `tel:${display.replace(/[^\d+]/g, '')}`;

const CARD = 'rounded-2xl border border-line bg-pearl p-6 shadow-card';
const CHIP = 'flex size-12 shrink-0 items-center justify-center rounded-full';

// Three ways to reach us: WhatsApp (preferred), phone, email.
export function ContactCards() {
  const phones = [SITE.phoneDisplay, ...SITE.altPhones];
  return (
    <div className="grid gap-4">
      <div className={CARD}>
        <div className="flex items-center gap-4">
          <span className={`${CHIP} bg-whatsapp text-white`}>
            <WhatsAppGlyph size={24} />
          </span>
          <div>
            <h3 className="text-lg text-ink">WhatsApp</h3>
            <p className="text-sm text-ink-soft">{SITE.phoneDisplay}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">The quickest way to reach us. Orders and requests are all handled here.</p>
        <a href={whatsappGeneralLink()} target="_blank" rel="noopener noreferrer" className={buttonClass('whatsapp', 'mt-5 w-full sm:w-auto')}>
          <WhatsAppGlyph size={18} /> Chat on WhatsApp
        </a>
      </div>

      <div className={CARD}>
        <div className="flex items-center gap-4">
          <span className={`${CHIP} bg-navy text-gold`}>
            <Phone size={22} aria-hidden />
          </span>
          <h3 className="text-lg text-ink">Call us</h3>
        </div>
        <ul className="mt-4 grid gap-1">
          {phones.map((p) => (
            <li key={p}>
              <a href={telHref(p)} className="flex min-h-11 items-center text-base font-medium text-navy underline-offset-4 hover:underline">
                {p}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className={CARD}>
        <div className="flex items-center gap-4">
          <span className={`${CHIP} bg-navy text-gold`}>
            <Mail size={22} aria-hidden />
          </span>
          <h3 className="text-lg text-ink">Email</h3>
        </div>
        <a
          href={`mailto:${SITE.email}`}
          className="mt-4 flex min-h-11 items-center break-all text-base font-medium text-navy underline-offset-4 hover:underline"
        >
          {SITE.email}
        </a>
      </div>
    </div>
  );
}
