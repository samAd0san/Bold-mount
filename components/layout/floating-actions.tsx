'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { whatsappGeneralLink } from '@/lib/whatsapp';
import { WhatsAppGlyph } from '@/components/ui/whatsapp-glyph';
import { cn } from '@/lib/utils';

/** WhatsApp button (always) + back-to-top (after scrolling), bottom-right. */
export function FloatingActions() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed right-[calc(1.25rem+env(safe-area-inset-right))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          // Hidden on phones: the sticky header is always one swipe away and the button would cover card actions.
          'hidden h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-night/85 text-on-night shadow-lg backdrop-blur transition-all duration-300 hover:text-gold md:flex',
          scrolled ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <ArrowUp size={18} />
      </button>
      <a
        href={whatsappGeneralLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        // Phones only: from md up the sticky header always shows "Order on WhatsApp".
        className="relative flex h-14 w-14 items-center justify-center md:hidden rounded-full bg-whatsapp text-white shadow-[0_10px_30px_-8px_rgb(37_211_102/0.7)] transition-transform duration-300 hover:scale-110"
      >
        <span className="absolute inset-0 rounded-full bg-whatsapp opacity-40 motion-safe:animate-ping-soft" />
        <WhatsAppGlyph size={30} className="relative" />
      </a>
    </div>
  );
}
