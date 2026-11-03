import { after } from 'next/server';
import { cookies } from 'next/headers';
import { describePath, isBot, recordVisit, VID_COOKIE, VID_RE } from '@/lib/server/analytics';
import { publicOrigin } from '@/lib/server/auth';

const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

// One page view. Bots, other sites and /admin are ignored; each browser gets an anonymous id cookie (bm_vid).
export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') ?? '';
  const site = req.headers.get('sec-fetch-site');
  const origin = req.headers.get('origin');
  if (isBot(ua) || (site && site !== 'same-origin') || (origin && origin !== publicOrigin(req))) return done();
  let raw: unknown;
  try {
    raw = (JSON.parse((await req.text()).slice(0, 1000)) as { path?: unknown }).path;
  } catch {
    return done();
  }
  const where = describePath(raw);
  if (!where) return done();
  const jar = await cookies();
  let vid = jar.get(VID_COOKIE)?.value;
  if (!vid || !VID_RE.test(vid)) {
    vid = crypto.randomUUID();
    jar.set(VID_COOKIE, vid, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  const id = vid;
  after(() => recordVisit(id, ua, where).catch((err) => console.error('[track]', err)));
  return done();
}
