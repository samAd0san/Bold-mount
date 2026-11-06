import 'server-only';
import type { mongo } from 'mongoose';
import { z } from 'zod';
import { SOURCE_LABEL, statsDb, visitsOf, type Device, type SourceKind } from '@/lib/server/analytics';
import { pageNamer, productNames } from '@/lib/server/page-names';

// The owner's clock: Today / Yesterday / This week are cut at midnight here, not UTC.
export const ADMIN_TZ = 'Asia/Kolkata';

export const PERIODS = ['today', 'yesterday', 'week', 'custom'] as const;
export type Period = (typeof PERIODS)[number];
/** Inclusive calendar days in ADMIN_TZ, "YYYY-MM-DD". */
export type DayRange = { from: string; to: string };
export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const ACTIVE_MS = 5 * 60 * 1000;
const DAY_MS = 86_400_000;
const PAID = ['paid', 'refunded'];
// Past this many days the trend shows weeks, so the bars stay readable.
const MAX_DAY_BARS = 31;

/** How many visitors got as far as each step; every step counts people who got at least that far. */
export type Funnel = { visitors: number; looked: number; carted: number; checkout: number; placed: number; paid: number };

export type AdminStats = {
  period: Period;
  range: DayRange & { label: string };
  visitors: number;
  pagesOpened: number;
  activeNow: number;
  orders: number;
  paidOrders: number;
  revenue: number;
  signups: number;
  funnel: Funnel;
  topPages: { label: string; path: string; views: number; visitors: number }[];
  topProducts: { slug: string; name: string; views: number; carts: number }[];
  sources: { key: string; label: string; other: boolean; visitors: number }[];
  searches: { term: string; times: number; results: number | null }[];
  noResults: { term: string; times: number }[];
  trend: { unit: 'day' | 'week'; bars: { key: string; label: string; full: string; visitors: number }[] } | null;
  busiest: { label: string; visitors: number } | null;
  dayParts: { label: string; hours: string; visitors: number }[];
  devices: Record<Device, number>;
};

/* ---------- time in ADMIN_TZ ---------- */

const wallFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: ADMIN_TZ, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
});

function wall(t: number) {
  const p: Record<string, number> = {};
  for (const x of wallFmt.formatToParts(new Date(t))) if (x.type !== 'literal') p[x.type] = Number(x.value);
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

// Zone offset at instant t, so midnight is exact even if the zone ever had DST.
function offset(t: number) {
  const w = wall(t);
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(t / 1000) * 1000;
}

/** Instant of local midnight for a calendar day; day may overflow (Date.UTC normalises it). */
function midnight(y: number, m: number, d: number) {
  const guess = Date.UTC(y, m - 1, d);
  return new Date(guess - offset(guess - offset(guess)));
}

const pad = (n: number) => String(n).padStart(2, '0');
const dayString = (t: number) => {
  const w = wall(t);
  return `${w.year}-${pad(w.month)}-${pad(w.day)}`;
};

const dayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: ADMIN_TZ, weekday: 'short', day: 'numeric', month: 'short' });
const shortFmt = new Intl.DateTimeFormat('en-GB', { timeZone: ADMIN_TZ, day: 'numeric', month: 'short' });

/** The period as exact instants [from, to) plus the inclusive India calendar days and a label like "Mon, 3 Nov". */
export function periodRange(period: Period, custom?: DayRange, now = Date.now()) {
  let from: Date;
  let to: Date;
  if (period === 'custom' && custom) {
    const [fy, fm, fd] = custom.from.split('-').map(Number);
    const [ty, tm, td] = custom.to.split('-').map(Number);
    from = midnight(fy, fm, fd);
    to = midnight(ty, tm, td + 1);
  } else {
    const w = wall(now);
    const mondayIdx = (new Date(Date.UTC(w.year, w.month - 1, w.day)).getUTCDay() + 6) % 7;
    const day = (k: number) => midnight(w.year, w.month, w.day + k);
    const span = { today: [0, 1], yesterday: [-1, 0], week: [-mondayIdx, 7 - mondayIdx], custom: [0, 1] }[period];
    from = day(span[0]);
    to = day(span[1]);
  }
  const last = to.getTime() - 1;
  const days = { from: dayString(from.getTime()), to: dayString(last) };
  const label = days.from === days.to ? dayFmt.format(from) : `${shortFmt.format(from)} – ${shortFmt.format(last)}`;
  return { from, to, days, label };
}

const Query = z.object({
  period: z.enum(PERIODS, 'Period must be today, yesterday, week or custom.').default('today'),
  from: z.string().regex(DAY_RE, 'Pick a valid date.').optional(),
  to: z.string().regex(DAY_RE, 'Pick a valid date.').optional(),
});

/** Reads ?period=&from=&to= from an admin stats request; `error` is a plain sentence for the 400 reply. */
export function readPeriod(sp: URLSearchParams): { period: Period; custom?: DayRange } | { error: string } {
  const q = Query.parse({ period: sp.get('period') ?? undefined, from: sp.get('from') ?? undefined, to: sp.get('to') ?? undefined });
  if (q.period !== 'custom') return { period: q.period };
  if (!q.from || !q.to) return { error: 'Pick a date first.' };
  const [from, to] = q.from <= q.to ? [q.from, q.to] : [q.to, q.from];
  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) return { error: 'Pick a valid date.' };
  // A year is plenty and keeps the aggregation quick.
  if ((Date.parse(to) - Date.parse(from)) / DAY_MS > 366) return { error: 'Pick a range of one year or less.' };
  return { period: 'custom', custom: { from, to } };
}

/* ---------- orders ---------- */

export type OrderInfo = {
  payment: string; total: number; method?: string; paidAt?: Date; updatedAt?: Date;
  status?: string; cancelledAt?: Date; cancelledBy?: string; refund?: { status?: string; amount?: number; updatedAt?: Date } | null;
};
export const isPaid = (o: OrderInfo) => PAID.includes(o.payment);

/** The saved orders for these numbers; the stats trust the order itself, never the browser, for "placed" and "paid". */
export async function orderInfo(d: mongo.Db, numbers: string[]): Promise<Map<string, OrderInfo>> {
  const unique = [...new Set(numbers)];
  if (!unique.length) return new Map();
  const found = await d.collection<OrderInfo & { number: string }>('orders')
    .find({ number: { $in: unique } }, { projection: { number: 1, payment: 1, total: 1, method: 1, paidAt: 1, updatedAt: 1, status: 1, cancelledAt: 1, cancelledBy: 1, refund: 1 } })
    .toArray();
  return new Map(found.map((o) => [o.number, o]));
}

/* ---------- stats ---------- */

const VIEW = { ev: { $exists: false } };
const isView = { $cond: [{ $eq: [{ $type: '$ev' }, 'missing'] }, 1, 0] };
const flag = (test: object) => ({ $max: { $cond: [test, 1, 0] } });
const hasOrder = { 'orders.0': { $exists: true } };

type EventFacets = {
  views: { n: number }[];
  pages: { _id: string; views: number; visitors: number }[];
  products: { _id: string; views: number }[];
  carts: { _id: string; n: number }[];
  trend: { _id: Date; visitors: number }[];
  hours: { _id: number; visitors: number }[];
  parts: { _id: number; visitors: number }[];
  searches: { _id: string; times: number; results: number | null }[];
};
type VisitorFacets = {
  total: { n: number }[];
  looked: { n: number }[];
  carted: { n: number }[];
  checkout: { n: number }[];
  buyers: { orders: string[] }[];
  devices: { _id: Device; n: number }[];
  sources: { _id: { src?: SourceKind; host?: string }; n: number }[];
};

const count = (f: { n: number }[]) => f[0]?.n ?? 0;

const hour12 = (h: number) => ((h + 11) % 12) + 1;
const ampm = (h: number) => (h % 24 < 12 ? 'am' : 'pm');
/** "8 – 9 pm", "11 am – 12 pm": the am/pm is written once when both ends share it. */
const span = (a: number, b: number) => (ampm(a) === ampm(b) ? `${hour12(a)} – ${hour12(b)} ${ampm(b)}` : `${hour12(a)} ${ampm(a)} – ${hour12(b)} ${ampm(b)}`);
const hourLabel = (h: number) => span(h, h + 1);

const PARTS = ['Late night', 'Early morning', 'Morning', 'Afternoon', 'Evening', 'Night'];

const keyFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric' });
const keyFull = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
const keyShort = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' });
const keyDate = (key: string) => new Date(`${key}T12:00:00Z`);

/** Every day (or Monday, for weeks) in the range, so quiet days show as empty bars instead of vanishing. */
function bucketKeys(days: DayRange, unit: 'day' | 'week') {
  const keys: string[] = [];
  const end = Date.parse(days.to);
  for (let t = Date.parse(days.from); t <= end; t += DAY_MS) {
    const monday = t - ((new Date(t).getUTCDay() + 6) % 7) * DAY_MS;
    const key = new Date(unit === 'week' ? monday : t).toISOString().slice(0, 10);
    if (keys[keys.length - 1] !== key) keys.push(key);
  }
  return keys;
}

export async function adminStats(period: Period, custom?: DayRange): Promise<AdminStats> {
  const d = await statsDb();
  const { from, to, days, label } = periodRange(period, custom);
  const inPeriod = { $gte: from, $lt: to };
  const created = { createdAt: inPeriod };
  const spanDays = (Date.parse(days.to) - Date.parse(days.from)) / DAY_MS + 1;
  const unit: 'day' | 'week' = spanDays > MAX_DAY_BARS ? 'week' : 'day';
  const hourOf = { $hour: { date: '$ts', timezone: ADMIN_TZ } };
  const bucket = { $dateTrunc: { date: '$ts', unit, ...(unit === 'week' ? { startOfWeek: 'monday' } : {}), timezone: ADMIN_TZ } };
  // People per group: each person counts once however often they show up in it.
  const peopleBy = (key: object) => [{ $group: { _id: { k: key, v: '$vid' } } }, { $group: { _id: '$_id.k', visitors: { $sum: 1 } } }];

  const [events, people, activeVids, orderAgg, signups] = await Promise.all([
    visitsOf(d).aggregate<EventFacets>([
      { $match: { ts: inPeriod } },
      {
        $facet: {
          views: [{ $group: { _id: null, n: { $sum: isView } } }],
          pages: [
            { $match: VIEW },
            // Older visits kept the order id in the path; count every order's tracking page as one page.
            { $group: { _id: { $cond: [{ $regexMatch: { input: '$path', regex: /^\/orders\/./ } }, '/orders/[id]', '$path'] }, views: { $sum: 1 }, vids: { $addToSet: '$vid' } } },
            { $project: { views: 1, visitors: { $size: '$vids' } } },
            { $sort: { views: -1, visitors: -1, _id: 1 } },
            { $limit: 10 },
          ],
          products: [
            { $match: { ...VIEW, path: /^\/product\/[a-z0-9-]+$/ } },
            { $group: { _id: '$path', views: { $sum: 1 } } },
            { $sort: { views: -1, _id: 1 } },
            { $limit: 5 },
          ],
          carts: [{ $match: { ev: 'cart' } }, { $group: { _id: '$slug', n: { $sum: 1 } } }],
          trend: peopleBy(bucket),
          hours: peopleBy(hourOf),
          parts: peopleBy({ $floor: { $divide: [hourOf, 4] } }),
          // The latest result count wins, so a word drops off "found nothing" once the shop adds it.
          searches: [
            { $match: { ...VIEW, q: { $exists: true } } },
            { $group: { _id: '$q', times: { $sum: 1 }, results: { $top: { sortBy: { ts: -1 }, output: { $ifNull: ['$n', null] } } } } },
            { $project: { times: 1, results: 1 } },
            { $sort: { times: -1, _id: 1 } },
            { $limit: 100 },
          ],
        },
      },
    ]).next(),
    // One row per person with what they did, then counted in different ways.
    visitsOf(d).aggregate<VisitorFacets>([
      { $match: { ts: inPeriod } },
      {
        $group: {
          _id: '$vid',
          product: flag({ $and: [{ $eq: [{ $type: '$ev' }, 'missing'] }, { $regexMatch: { input: '$path', regex: '^/product/' } }] }),
          cart: flag({ $eq: ['$ev', 'cart'] }),
          checkout: flag({ $eq: ['$ev', 'checkout'] }),
          orders: { $addToSet: { $cond: [{ $eq: ['$ev', 'order'] }, '$order', '$$REMOVE'] } },
          // One device per person: the one they used last in this period.
          device: { $top: { sortBy: { ts: -1 }, output: '$device' } },
          // Where they came from: the first visit-start recorded in this period.
          from: { $min: { $cond: [{ $ifNull: ['$src', false] }, { at: '$ts', src: '$src', host: '$host' }, null] } },
        },
      },
      {
        $facet: {
          total: [{ $count: 'n' }],
          looked: [{ $match: { $or: [{ product: 1 }, { cart: 1 }, { checkout: 1 }, hasOrder] } }, { $count: 'n' }],
          carted: [{ $match: { $or: [{ cart: 1 }, { checkout: 1 }, hasOrder] } }, { $count: 'n' }],
          checkout: [{ $match: { $or: [{ checkout: 1 }, hasOrder] } }, { $count: 'n' }],
          buyers: [{ $match: hasOrder }, { $project: { orders: 1 } }],
          devices: [{ $group: { _id: '$device', n: { $sum: 1 } } }],
          sources: [{ $group: { _id: { src: '$from.src', host: '$from.host' }, n: { $sum: 1 } } }],
        },
      },
    ]).next(),
    visitsOf(d).distinct('vid', { ts: { $gte: new Date(Date.now() - ACTIVE_MS) } }),
    // Paid includes orders refunded later; revenue is what the shop kept (total minus money sent back).
    d.collection('orders').aggregate<{ orders: number; paid: number; revenue: number }>([
      { $match: { ...created, payment: { $ne: 'failed' } } },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          paid: { $sum: { $cond: [{ $in: ['$payment', PAID] }, 1, 0] } },
          revenue: {
            $sum: {
              $cond: [
                { $in: ['$payment', PAID] },
                { $subtract: ['$total', { $cond: [{ $eq: ['$refund.status', 'refunded'] }, { $ifNull: ['$refund.amount', 0] }, 0] }] },
                0,
              ],
            },
          },
        },
      },
    ]).next(),
    d.collection('users').countDocuments(created),
  ]);

  const ev = events as EventFacets;
  const pp = people as VisitorFacets;

  // "Placed" and "paid" come from the saved orders themselves.
  const orders = await orderInfo(d, pp.buyers.flatMap((b) => b.orders));
  const placed = (b: { orders: string[] }) => b.orders.some((n) => orders.has(n) && orders.get(n)!.payment !== 'failed');
  const funnel: Funnel = {
    visitors: count(pp.total),
    looked: count(pp.looked),
    carted: count(pp.carted),
    checkout: count(pp.checkout),
    placed: pp.buyers.filter(placed).length,
    paid: pp.buyers.filter((b) => b.orders.some((n) => orders.has(n) && isPaid(orders.get(n)!))).length,
  };

  const [name, products] = await Promise.all([
    pageNamer(ev.pages.map((p) => p._id)),
    productNames(ev.products.map((p) => p._id.replace('/product/', ''))),
  ]);
  const carts = new Map(ev.carts.map((c) => [c._id, c.n]));

  const sources = pp.sources
    .map((s) => {
      const src = s._id.src;
      if (!src) return { key: 'unknown', label: 'Not known', other: false, visitors: s.n };
      if (src === 'other') return { key: `other:${s._id.host}`, label: s._id.host ?? 'Another website', other: true, visitors: s.n };
      return { key: src, label: SOURCE_LABEL[src], other: false, visitors: s.n };
    })
    .sort((a, b) => b.visitors - a.visitors || a.label.localeCompare(b.label));

  const searches = ev.searches.map((s) => ({ term: s._id, times: s.times, results: s.results ?? null }));

  const trendCount = new Map(ev.trend.map((t) => [dayString(t._id.getTime()), t.visitors]));
  const trend = spanDays === 1 ? null : {
    unit,
    bars: bucketKeys(days, unit).map((key) => ({
      key,
      label: unit === 'week' ? keyShort.format(keyDate(key)) : keyFmt.format(keyDate(key)),
      full: unit === 'week' ? `Week of ${keyShort.format(keyDate(key))}` : keyFull.format(keyDate(key)),
      visitors: trendCount.get(key) ?? 0,
    })),
  };

  const hours = Array.from({ length: 24 }, (_, h) => ev.hours.find((x) => x._id === h)?.visitors ?? 0);
  const best = Math.max(...hours);
  const devices: Record<Device, number> = { mobile: 0, tablet: 0, desktop: 0 };
  for (const x of pp.devices) if (x._id in devices) devices[x._id] = x.n;

  return {
    period,
    range: { ...days, label },
    visitors: funnel.visitors,
    pagesOpened: count(ev.views),
    activeNow: activeVids.length,
    orders: orderAgg?.orders ?? 0,
    paidOrders: orderAgg?.paid ?? 0,
    revenue: orderAgg?.revenue ?? 0,
    signups,
    funnel,
    topPages: ev.pages.map((p) => ({ label: name(p._id), path: p._id, views: p.views, visitors: p.visitors })),
    topProducts: ev.products.map((p) => {
      const slug = p._id.replace('/product/', '');
      return { slug, name: products.get(slug) ?? slug, views: p.views, carts: carts.get(slug) ?? 0 };
    }),
    sources,
    searches: searches.slice(0, 8),
    noResults: searches.filter((s) => s.results === 0).slice(0, 10).map((s) => ({ term: s.term, times: s.times })),
    trend,
    busiest: best > 0 ? { label: hourLabel(hours.indexOf(best)), visitors: best } : null,
    dayParts: PARTS.map((label, i) => ({ label, hours: span(i * 4, i * 4 + 4), visitors: ev.parts.find((x) => x._id === i)?.visitors ?? 0 })),
    devices,
  };
}
