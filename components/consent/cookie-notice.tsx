'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { buttonClass } from '@/components/ui/button-styles';
import { useConsent } from '@/store/consent';
import type { Consent } from '@/lib/consent';

const BUTTON = 'min-h-11 px-5 py-2';

/** The small cookie notice at the bottom of shop pages. It is not a pop-up: nothing is blocked and Tab simply moves on. */
export function CookieNotice() {
  const { ready, choice, asking, load, choose } = useConsent();
  const [busy, setBusy] = useState(false);
  const okRef = useRef<HTMLButtonElement>(null);
  const show = ready && (choice === null || asking);

  useEffect(load, [load]);

  // Reopened from the privacy policy: move focus here, and hand it back when the notice closes.
  useEffect(() => {
    if (!asking) return;
    const from = document.activeElement as HTMLElement | null;
    okRef.current?.focus();
    return () => from?.focus?.();
  }, [asking]);

  if (!show) return null;

  const pick = async (c: Consent) => {
    setBusy(true);
    await choose(c);
    setBusy(false);
  };

  return (
    <section
      aria-label="Cookie notice"
      // Phones leave the right edge free for the WhatsApp button; z-55 sits under the menu, cart drawer and pop-ups.
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-[calc(1rem+env(safe-area-inset-left))] right-[calc(5.5rem+env(safe-area-inset-right))] z-[55] rounded-2xl border border-white/15 bg-night/95 p-4 text-on-night shadow-2xl backdrop-blur motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 md:right-auto md:w-[31rem]"
    >
      <p className="text-[0.82rem] leading-relaxed">
        We use a small cookie to count visits and improve the shop.{' '}
        <Link href="/policies/privacy#cookies" className="whitespace-nowrap text-gold underline underline-offset-4 hover:text-gold-bright">
          Details
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button ref={okRef} type="button" disabled={busy} onClick={() => pick('yes')} className={buttonClass('gold', BUTTON)}>
          OK
        </button>
        <button type="button" disabled={busy} onClick={() => pick('no')} className={buttonClass('outline-light', BUTTON)}>
          No thanks
        </button>
      </div>
    </section>
  );
}
