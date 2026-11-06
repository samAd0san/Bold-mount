'use client';

import { buttonClass } from '@/components/ui/button-styles';
import { useConsent } from '@/store/consent';

/** "Change my choice" in the privacy policy: shows the cookie notice again. */
export function CookieChoiceButton() {
  const ask = useConsent((s) => s.ask);
  return (
    <button type="button" onClick={ask} className={buttonClass('outline', 'mt-4 min-h-11 px-5 py-2')}>
      Change my choice
    </button>
  );
}
