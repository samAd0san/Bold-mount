import 'server-only';
import type { mongo } from 'mongoose';
import { db } from '@/lib/server/db';

export type Device = 'mobile' | 'tablet' | 'desktop';
export type VisitDoc = { vid: string; page: string; path: string; device: Device; ts: Date };

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python/i;
const VISIT_TTL_DAYS = 400;
export const VID_COOKIE = 'bm_vid';
export const VID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isBot = (ua: string) => !ua || BOT.test(ua);

export function deviceFrom(ua: string): Device {
  if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

/** A tidy page path for stats (no query or hash, max 4 parts); null for admin / api / internal paths. */
export function describePath(raw: unknown): { page: string; path: string } | null {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.length > 300) return null;
  const segs = raw.split(/[?#]/)[0].split('/').filter(Boolean).slice(0, 4);
  if (['admin', 'api', '_next'].includes(segs[0])) return null;
  const path = '/' + segs.map((s) => s.slice(0, 60).toLowerCase()).join('/');
  return { page: path === '/' ? 'Home' : path, path };
}

type Cache = { indexes?: Promise<unknown> };
const g = globalThis as unknown as { __bmAnalytics?: Cache };
const cache: Cache = g.__bmAnalytics ?? (g.__bmAnalytics = {});

/** The raw db with the indexes for visits, admin_attempts and orders-by-date in place (created once per process). */
export async function statsDb(): Promise<mongo.Db> {
  const d = await db();
  cache.indexes ??= Promise.all([
    visitsOf(d).createIndex({ ts: -1 }, { name: 'ts_ttl', expireAfterSeconds: VISIT_TTL_DAYS * 86400 }),
    visitsOf(d).createIndex({ vid: 1, ts: -1 }),
    d.collection('admin_attempts').createIndex({ ts: 1 }, { expireAfterSeconds: 600 }),
    d.collection('admin_attempts').createIndex({ key: 1, ts: -1 }),
  ]).catch((err) => {
    cache.indexes = undefined;
    console.error('[analytics] index setup failed', err);
  });
  return d;
}

export const visitsOf = (d: mongo.Db) => d.collection<VisitDoc>('visits');

export async function recordVisit(vid: string, ua: string, where: { page: string; path: string }) {
  await visitsOf(await statsDb()).insertOne({ vid, page: where.page, path: where.path, device: deviceFrom(ua), ts: new Date() });
}
