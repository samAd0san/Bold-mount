import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'bm_session';
export const SESSION_DAYS = 30;
const UID = /^[0-9a-f]{24}$/;

const secret = () => process.env.AUTH_SECRET || '';
export const authReady = () => secret().length >= 32;

// The purpose is part of the signed text, so an OAuth cookie can never pass as a session.
const mac = (purpose: string, body: string) => createHmac('sha256', secret()).update(`${purpose}:${body}`).digest('base64url');

/** `<base64url JSON>.<HMAC>`; throws without a usable AUTH_SECRET. */
export function signToken(purpose: string, payload: Record<string, unknown>): string {
  if (!authReady()) throw new Error('AUTH_SECRET is not set');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${mac(purpose, body)}`;
}

/** The payload if the signature is ours and `exp` (ms) hasn't passed. */
export function readToken<T extends { exp: number }>(purpose: string, token: string | undefined): T | null {
  if (!token || !authReady() || token.length > 2000) return null;
  const [body, sig, extra] = token.split('.');
  if (!body || !sig || extra !== undefined) return null;
  const want = Buffer.from(mac(purpose, body));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    return typeof data.exp === 'number' && data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

/** Signed-in user id from the session cookie (no database call), or null. */
export async function sessionUid(): Promise<string | null> {
  const data = readToken<{ uid: string; exp: number }>('session', (await cookies()).get(SESSION_COOKIE)?.value);
  return data && typeof data.uid === 'string' && UID.test(data.uid) ? data.uid : null;
}
