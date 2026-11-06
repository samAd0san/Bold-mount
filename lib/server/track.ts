import 'server-only';
import { after } from 'next/server';
import { cookies, headers } from 'next/headers';
import { applyShopQuery } from '@/components/shop/shop-filters';
import { parseShopQuery } from '@/components/shop/shop-query';
import { isAdmin } from '@/lib/server/admin-auth';
import { deviceFrom, describePath, isBot, landingFields, recordVisits, VID_COOKIE, VID_RE, type VisitDoc } from '@/lib/server/analytics';
import { sessionUid } from '@/lib/server/auth-token';
import { getCatalog } from '@/lib/catalog';

const SLUG = /^[a-z0-9-]{1,80}$/;

export type Beacon = { path?: unknown; q?: unknown; land?: unknown; checkout?: unknown; ev?: unknown; slug?: unknown };

/** How many products the shop search finds for these words, by the same rule the Shop page uses. */
async function searchHits(q: string) {
  const { products } = await getCatalog();
  return applyShopQuery(parseShopQuery({ q }, []), products).length;
}

/** Saves what one browser beacon reports. The owner's own visits and unreadable beacons are dropped; each browser gets an anonymous id cookie. */
export async function trackBeacon(ua: string, b: Beacon) {
  const where = describePath(b.path);
  if (!where || (await isAdmin())) return;
  const jar = await cookies();
  let vid = jar.get(VID_COOKIE)?.value;
  if (!vid || !VID_RE.test(vid)) {
    vid = crypto.randomUUID();
    jar.set(VID_COOKIE, vid, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  const uid = await sessionUid();
  const at = Date.now();
  const base = { vid, path: where.path, device: deviceFrom(ua), ...(uid ? { uid } : {}) };

  if (b.ev === 'cart') {
    if (typeof b.slug !== 'string' || !SLUG.test(b.slug)) return;
    const doc: VisitDoc = { ...base, ts: new Date(at), ev: 'cart', slug: b.slug };
    after(() => recordVisits([doc]).catch((err) => console.error('[track]', err)));
    return;
  }

  const q = where.path === '/shop' && typeof b.q === 'string' ? b.q.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 60) : '';
  const view: VisitDoc = { ...base, ts: new Date(at), ...(q ? { q } : {}), ...landingFields(b.land) };
  // The checkout step goes in a millisecond later so the journey always reads "Cart, then checkout".
  const docs = [view];
  if (b.checkout === true && (where.path === '/cart' || where.path === '/checkout')) docs.push({ ...base, ts: new Date(at + 1), ev: 'checkout' });
  after(async () => {
    const hits = q ? await searchHits(q).catch(() => null) : null;
    if (hits !== null) view.n = hits;
    await recordVisits(docs).catch((err) => console.error('[track]', err));
  });
}

/** Links an order number to the visitor who placed it, so the stats can follow it from first visit to payment. Never throws. */
export async function trackOrder(number: string) {
  try {
    const ua = (await headers()).get('user-agent') ?? '';
    const vid = (await cookies()).get(VID_COOKIE)?.value;
    if (isBot(ua) || !vid || !VID_RE.test(vid) || (await isAdmin())) return;
    const uid = await sessionUid();
    const doc: VisitDoc = { vid, path: '/cart', device: deviceFrom(ua), ts: new Date(), ev: 'order', order: number, ...(uid ? { uid } : {}) };
    after(() => recordVisits([doc]).catch((err) => console.error('[track]', err)));
  } catch (err) {
    console.error('[track]', err);
  }
}
