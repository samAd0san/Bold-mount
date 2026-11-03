import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import type { GoogleProfile } from '@/lib/server/auth-users';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

export const OAUTH_COOKIE = 'bm_oauth';
export const OAUTH_PATH = '/api/auth/google';
export const OAUTH_TTL_MS = 10 * 60 * 1000;

export const googleClientId = () => process.env.GOOGLE_CLIENT_ID?.trim() || '';
export const googleReady = () => !!googleClientId() && !!process.env.GOOGLE_CLIENT_SECRET?.trim();

export const redirectUri = (origin: string) => `${origin}${OAUTH_PATH}/callback`;

const rand = (bytes: number) => randomBytes(bytes).toString('base64url');

/** Fresh state, PKCE verifier and nonce for one sign-in attempt. */
export function newOAuthAttempt() {
  return { state: rand(24), verifier: rand(48), nonce: rand(24) };
}

export function googleAuthUrl(origin: string, a: { state: string; verifier: string; nonce: string }) {
  const q = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: redirectUri(origin),
    response_type: 'code',
    scope: 'openid email profile',
    state: a.state,
    nonce: a.nonce,
    code_challenge: createHash('sha256').update(a.verifier).digest('base64url'),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });
  return `${AUTH_URL}?${q}`;
}

/** Same-site path only (no "//host", no backslashes); anything else becomes "/". */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || raw.length > 300 || !raw.startsWith('/') || raw.startsWith('//') || /[\\\u0000-\u001f]/.test(raw)) return '/';
  return raw;
}

/** The path with `?signin=<code>` added (keeps any existing query and #hash). */
export function withSignin(path: string, code: 'unavailable' | 'failed' | 'cancelled'): string {
  const u = new URL(path, 'http://local');
  u.searchParams.set('signin', code);
  return `${u.pathname}${u.search}${u.hash}`;
}

type IdClaims = {
  iss?: string; aud?: string; exp?: number; sub?: string; nonce?: string;
  email?: string; email_verified?: boolean | string; name?: string; given_name?: string; picture?: string;
};

export class GoogleError extends Error {
  constructor(public code: 'failed' | 'cancelled') {
    super(code);
  }
}

/** Swaps the code for tokens and returns the checked profile from the id_token. */
export async function exchangeCode(origin: string, code: string, verifier: string, nonce: string): Promise<GoogleProfile> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: googleClientId(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET?.trim() || '',
      redirect_uri: redirectUri(origin),
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string };
  if (!res.ok || !body.id_token) {
    console.error('[auth] google token exchange failed', res.status, body.error ?? '');
    throw new GoogleError('failed');
  }
  // Signature check skipped on purpose: the token came straight from Google over TLS (OpenID Connect Core 3.1.3.7).
  let c: IdClaims;
  try {
    c = JSON.parse(Buffer.from(body.id_token.split('.')[1] ?? '', 'base64url').toString('utf8')) as IdClaims;
  } catch {
    throw new GoogleError('failed');
  }
  const fresh = typeof c.exp === 'number' && c.exp * 1000 > Date.now() - 60_000;
  if (!ISSUERS.has(c.iss ?? '') || c.aud !== googleClientId() || !fresh || c.nonce !== nonce || !c.sub || !c.email) {
    console.error('[auth] google id_token rejected', { iss: c.iss, audOk: c.aud === googleClientId(), fresh, nonceOk: c.nonce === nonce });
    throw new GoogleError('failed');
  }
  if (c.email_verified !== true && c.email_verified !== 'true') throw new GoogleError('failed');
  return {
    sub: c.sub,
    email: c.email.toLowerCase(),
    name: (c.name || c.given_name || c.email.split('@')[0]).slice(0, 80),
    picture: c.picture && /^https:\/\//.test(c.picture) ? c.picture.slice(0, 500) : null,
  };
}
