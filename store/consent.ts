'use client';

import { create } from 'zustand';
import { readConsent, type Consent } from '@/lib/consent';

interface ConsentState {
  choice: Consent | null; // null until the visitor chooses
  ready: boolean; // the cookie has been read (only after the page has loaded, so server and browser agree first)
  asking: boolean; // the visitor reopened the notice from the privacy policy
  load: () => void;
  ask: () => void;
  choose: (choice: Consent) => Promise<boolean>;
}

export const useConsent = create<ConsentState>()((set) => ({
  choice: null,
  ready: false,
  asking: false,
  load: () => set({ choice: readConsent(document.cookie), ready: true }),
  ask: () => set({ asking: true }),
  // The server saves the choice (a cookie set by the server lasts the full year even on Safari); the browser then just reads it back.
  choose: async (choice) => {
    const res = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice }),
      credentials: 'same-origin',
    }).catch(() => null);
    if (!res?.ok) return false;
    set({ choice: readConsent(document.cookie), asking: false });
    return true;
  },
}));
