export const CONSENT_COOKIE = 'bm_consent';
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;
export type Consent = 'yes' | 'no';

const PATTERN = new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=(yes|no)\\s*(?:;|$)`);

/** The saved cookie choice from a Cookie header or document.cookie; null until the visitor has chosen. The one reader for the browser and the server. */
export function readConsent(cookies: string | null | undefined): Consent | null {
  return (cookies?.match(PATTERN)?.[1] as Consent | undefined) ?? null;
}
