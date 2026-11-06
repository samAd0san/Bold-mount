/** Sends one small note to /api/track. Tracking must never get in a visitor's way, so every failure is ignored. */
export function sendTrack(body: Record<string, unknown>) {
  const json = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.('/api/track', new Blob([json], { type: 'application/json' }))) return;
  } catch {
    // Fall through to fetch.
  }
  fetch('/api/track', { method: 'POST', body: json, headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'same-origin' }).catch(() => {});
}

/** Notes that something was added to a cart (which product, never the cart itself). */
export const trackCartAdd = (slug: string) => sendTrack({ ev: 'cart', path: location.pathname, slug });
