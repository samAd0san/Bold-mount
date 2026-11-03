import { cookies } from 'next/headers';
import { publicOrigin } from '@/lib/server/auth';
import { googleAuthUrl, googleReady, newOAuthAttempt, OAUTH_COOKIE, OAUTH_PATH, OAUTH_TTL_MS, safeNext, withSignin } from '@/lib/server/auth-google';
import { authReady, signToken } from '@/lib/server/auth-token';
import { handle } from '@/lib/server/http';

const go = (location: string) => new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store' } });

// Starts "Continue with Google": remembers state + PKCE verifier in a 10-minute cookie, then sends the browser to Google.
export const GET = handle(async (req: Request) => {
  const next = safeNext(new URL(req.url).searchParams.get('next'));
  if (!googleReady() || !authReady()) return go(withSignin(next, 'unavailable'));
  const attempt = newOAuthAttempt();
  (await cookies()).set(OAUTH_COOKIE, signToken('oauth', { ...attempt, next, exp: Date.now() + OAUTH_TTL_MS }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: OAUTH_PATH,
    maxAge: OAUTH_TTL_MS / 1000,
  });
  return go(googleAuthUrl(publicOrigin(req), attempt));
});
