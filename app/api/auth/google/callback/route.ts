import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { publicOrigin, setSession } from '@/lib/server/auth';
import { exchangeCode, GoogleError, googleReady, OAUTH_COOKIE, OAUTH_PATH, safeNext, withSignin } from '@/lib/server/auth-google';
import { authReady, readToken } from '@/lib/server/auth-token';
import { upsertGoogleUser } from '@/lib/server/auth-users';

type Saved = { state: string; verifier: string; nonce: string; next: string; exp: number };

// Relative Location: the browser resolves it against the public site, even when this runs behind a proxy.
const go = (path: string) => new Response(null, { status: 302, headers: { Location: path, 'Cache-Control': 'no-store' } });

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// Google sends the browser back here: check state, trade the code for the profile, sign the customer in, go back to where they were.
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const jar = await cookies();
  const saved = readToken<Saved>('oauth', jar.get(OAUTH_COOKIE)?.value);
  // One use only: the attempt cookie is gone whatever happens next.
  jar.delete({ name: OAUTH_COOKIE, path: OAUTH_PATH });
  const next = safeNext(saved?.next);

  if (!googleReady() || !authReady()) return go(withSignin(next, 'unavailable'));
  const denied = params.get('error');
  if (denied) return go(withSignin(next, denied === 'access_denied' ? 'cancelled' : 'failed'));
  const code = params.get('code');
  if (!saved || !code || !same(params.get('state') ?? '', saved.state)) return go(withSignin(next, 'failed'));

  try {
    const profile = await exchangeCode(publicOrigin(req), code, saved.verifier, saved.nonce);
    const user = await upsertGoogleUser(profile);
    await setSession(user.id);
    return go(next);
  } catch (err) {
    if (err instanceof GoogleError) return go(withSignin(next, err.code));
    console.error('[auth] google callback failed', err instanceof Error ? err.message : err);
    return go(withSignin(next, 'failed'));
  }
}
