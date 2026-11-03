import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_DAYS, sessionUid, signToken } from '@/lib/server/auth-token';
import { findUserById } from '@/lib/server/auth-users';
import { fail } from '@/lib/server/http';
import type { Customer } from '@/lib/types';

const first = (v: string | null) => v?.split(',')[0]?.trim() || '';

/** The site origin the browser sees. The API may sit behind a proxy (Vercel → Render), so APP_URL wins when set. */
export function publicOrigin(req: Request): string {
  const app = process.env.APP_URL?.trim().replace(/\/+$/, '');
  if (app) return app;
  const host = first(req.headers.get('x-forwarded-host'));
  if (host) return `${first(req.headers.get('x-forwarded-proto')) || 'https'}://${host}`;
  return new URL(req.url).origin;
}

/** True when the browser's Origin header is our own site (CSRF guard for POST/PATCH/DELETE). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  return !!origin && origin === publicOrigin(req);
}

/** Error response for a write that did not come from our own site, or null when it did. */
export const rejectCrossSite = (req: Request): Response | null =>
  sameOrigin(req) ? null : fail(403, 'This request came from another site.');

export async function setSession(uid: string) {
  const ms = SESSION_DAYS * 24 * 60 * 60 * 1000;
  (await cookies()).set(SESSION_COOKIE, signToken('session', { uid, exp: Date.now() + ms }), {
    httpOnly: true,
    // Lax (not Strict) so the cookie is sent on the redirect back from Google.
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ms / 1000,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in customer, or null. Hits the database; use sessionUid() when only the id is needed. */
export async function getSessionUser(): Promise<Customer | null> {
  const uid = await sessionUid();
  return uid ? findUserById(uid) : null;
}
