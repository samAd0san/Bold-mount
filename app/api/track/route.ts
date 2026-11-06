import { isBot } from '@/lib/server/analytics';
import { publicOrigin } from '@/lib/server/auth';
import { trackBeacon, type Beacon } from '@/lib/server/track';

const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

// One page opened, or one thing a visitor did. Bots, other sites, /admin and the owner are ignored.
export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') ?? '';
  const site = req.headers.get('sec-fetch-site');
  const origin = req.headers.get('origin');
  if (isBot(ua) || (site && site !== 'same-origin') || (origin && origin !== publicOrigin(req))) return done();
  let body: Beacon;
  try {
    body = JSON.parse((await req.text()).slice(0, 1500));
  } catch {
    return done();
  }
  if (!body || typeof body !== 'object') return done();
  await trackBeacon(ua, body).catch((err) => console.error('[track]', err));
  return done();
}
