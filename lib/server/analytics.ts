import 'server-only';
import type { mongo } from 'mongoose';
import { db } from '@/lib/server/db';

export type Device = 'mobile' | 'tablet' | 'desktop';
/** A page opened has no `ev`; the rest are things a visitor did. "order" is written by the server, the others by the browser. */
export type EventKind = 'cart' | 'checkout' | 'order';
export type SourceKind = 'whatsapp' | 'instagram' | 'facebook' | 'google' | 'youtube' | 'other' | 'direct';

export type VisitDoc = {
  vid: string;
  path: string;
  device: Device;
  ts: Date;
  ev?: EventKind;
  uid?: string; // signed-in customer
  q?: string; // shop search words (page opened on /shop?q=)
  n?: number; // products that search found
  src?: SourceKind; // only on the first page of a visit
  host?: string; // for "other": the site (or utm_source name) they came from
  utm?: { source?: string; medium?: string; campaign?: string };
  slug?: string; // product added to the cart
  order?: string; // order number, for ev "order"
};

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
export function describePath(raw: unknown): { path: string } | null {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.length > 300) return null;
  const segs = raw.split(/[?#]/)[0].split('/').filter(Boolean).slice(0, 4);
  if (['admin', 'api', '_next'].includes(segs[0])) return null;
  // An order's tracking link carries its id; the stats only need to know it was a tracking page.
  if (segs[0] === 'orders' && segs.length > 1) return { path: '/orders/[id]' };
  return { path: '/' + segs.map((s) => s.slice(0, 60).toLowerCase()).join('/') };
}

/* ---------- where visitors came from ---------- */

const SITES: [Exclude<SourceKind, 'other' | 'direct'>, RegExp][] = [
  ['whatsapp', /(^|\.)(whatsapp\.com|wa\.me|wl\.co)$/],
  ['instagram', /(^|\.)(instagram\.com|ig\.me)$/],
  ['facebook', /(^|\.)(facebook\.com|fb\.com|fb\.me|fb\.watch|messenger\.com)$/],
  ['google', /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/],
  ['youtube', /(^|\.)(youtube\.com|youtu\.be)$/],
];
// utm_source is whatever the link's author typed, so be generous with the common spellings.
const NAMES: [Exclude<SourceKind, 'other' | 'direct'>, RegExp][] = [
  ['whatsapp', /whatsapp|^wa$/],
  ['instagram', /insta|^ig$/],
  ['facebook', /facebook|^fb$/],
  ['google', /google/],
  ['youtube', /youtube|^yt$/],
];
// Sign-in and payment pages send people straight back to the shop; they are not where the visitor came from.
const NOT_A_SOURCE = /^(accounts\.google\.com|([a-z0-9-]+\.)?razorpay\.com)$/;

export const SOURCE_LABEL: Record<Exclude<SourceKind, 'other'>, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google',
  youtube: 'YouTube',
  direct: 'Typed the address / saved link',
};

/** utm_source wins over the referring site, because the person who shared the link chose it on purpose. */
export function classifySource(host?: string, utmSource?: string): { src: SourceKind; host?: string } {
  if (utmSource) {
    const hit = NAMES.find(([, re]) => re.test(utmSource));
    return hit ? { src: hit[0] } : { src: 'other', host: utmSource };
  }
  if (host) {
    const hit = SITES.find(([, re]) => re.test(host));
    return hit ? { src: hit[0] } : { src: 'other', host };
  }
  return { src: 'direct' };
}

const tidyHost = (v: unknown) => {
  const h = typeof v === 'string' ? v.trim().toLowerCase().replace(/^www\./, '') : '';
  return /^[a-z0-9.-]{3,100}$/.test(h) && !NOT_A_SOURCE.test(h) ? h : undefined;
};
const tidyWord = (v: unknown) => {
  const w = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return /^[\w .-]{1,40}$/.test(w) ? w : undefined;
};

export type Landing = { host?: string; utm?: string; medium?: string; campaign?: string };

/** The visit-start details the browser sent on its first page, cleaned up and grouped; undefined when it sent none. */
export function landingFields(raw: unknown): Pick<VisitDoc, 'src' | 'host' | 'utm'> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const l = raw as Record<string, unknown>;
  const utm = { source: tidyWord(l.utm), medium: tidyWord(l.medium), campaign: tidyWord(l.campaign) };
  const { src, host } = classifySource(tidyHost(l.host), utm.source);
  const kept = Object.fromEntries(Object.entries(utm).filter(([, v]) => v));
  return { src, ...(host ? { host } : {}), ...(Object.keys(kept).length ? { utm: kept } : {}) };
}

/* ---------- storage ---------- */

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

export async function recordVisits(docs: VisitDoc[]) {
  if (docs.length) await visitsOf(await statsDb()).insertMany(docs);
}
