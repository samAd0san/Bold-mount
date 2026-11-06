import { readConsent } from '@/lib/consent';

/** Sends one small note to /api/track, only if the visitor pressed OK on the cookie notice; true when sent. Failures are ignored so tracking never gets in a visitor's way. */
export function sendTrack(body: Record<string, unknown>) {
  if (readConsent(document.cookie) !== 'yes') return false;
  const json = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.('/api/track', new Blob([json], { type: 'application/json' }))) return true;
  } catch {
    // Fall through to fetch.
  }
  fetch('/api/track', { method: 'POST', body: json, headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'same-origin' }).catch(() => {});
  return true;
}

/** Notes that something was added to a cart (which product, never the cart itself). */
export const trackCartAdd = (slug: string) => sendTrack({ ev: 'cart', path: location.pathname, slug });
