import 'server-only';
import { statsDb, visitsOf, type Device } from '@/lib/server/analytics';
import { ProductModel } from '@/lib/server/models';

// The owner's clock: Today / Yesterday / This week are cut at midnight here, not UTC.
export const ADMIN_TZ = 'Asia/Kolkata';

export const PERIODS = ['today', 'yesterday', 'week', 'custom'] as const;
export type Period = (typeof PERIODS)[number];
/** Inclusive calendar days in ADMIN_TZ, "YYYY-MM-DD". */
export type DayRange = { from: string; to: string };
export const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const ACTIVE_MS = 5 * 60 * 1000;

export type AdminStats = {
  period: Period;
  range: DayRange & { label: string };
  visitors: number;
  pageViews: number;
  activeNow: number;
  orders: number;
  paidOrders: number;
  revenue: number;
  signups: number;
  topPages: { path: string; views: number; visitors: number }[];
  topProducts: { slug: string; name: string; views: number }[];
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

/* ---------- stats ---------- */

type Facets = {
  totals: { views: number; visitors: number }[];
  pages: { _id: string; views: number; visitors: number }[];
  devices: { _id: Device; n: number }[];
  products: { _id: string; views: number }[];
};

export async function adminStats(period: Period, custom?: DayRange): Promise<AdminStats> {
  const d = await statsDb();
  const { from, to, days, label } = periodRange(period, custom);
  const inPeriod = { $gte: from, $lt: to };
  const created = { createdAt: inPeriod };

  const [visitAgg, activeVids, orderAgg, signups] = await Promise.all([
    visitsOf(d).aggregate<Facets>([
      { $match: { ts: inPeriod } },
      {
        $facet: {
          totals: [{ $group: { _id: null, views: { $sum: 1 }, vids: { $addToSet: '$vid' } } }, { $project: { views: 1, visitors: { $size: '$vids' } } }],
          pages: [
            { $group: { _id: '$path', views: { $sum: 1 }, vids: { $addToSet: '$vid' } } },
            { $project: { views: 1, visitors: { $size: '$vids' } } },
            { $sort: { views: -1, visitors: -1, _id: 1 } },
            { $limit: 10 },
          ],
          // One device per visitor: the one they used last in this period.
          devices: [
            { $group: { _id: '$vid', device: { $top: { sortBy: { ts: -1 }, output: '$device' } } } },
            { $group: { _id: '$device', n: { $sum: 1 } } },
          ],
          products: [
            { $match: { path: /^\/product\/[a-z0-9-]+$/ } },
            { $group: { _id: '$path', views: { $sum: 1 } } },
            { $sort: { views: -1, _id: 1 } },
            { $limit: 5 },
          ],
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
          paid: { $sum: { $cond: [{ $in: ['$payment', ['paid', 'refunded']] }, 1, 0] } },
          revenue: {
            $sum: {
              $cond: [
                { $in: ['$payment', ['paid', 'refunded']] },
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

  const slugs = (visitAgg?.products ?? []).map((p) => p._id.replace('/product/', ''));
  const named = slugs.length ? await ProductModel.find({ slug: { $in: slugs } }, { slug: 1, name: 1 }).lean() : [];
  const names = new Map(named.map((p) => [p.slug, p.name]));
  const devices: Record<Device, number> = { mobile: 0, tablet: 0, desktop: 0 };
  for (const x of visitAgg?.devices ?? []) if (x._id in devices) devices[x._id] = x.n;

  const totals = visitAgg?.totals[0];
  return {
    period,
    range: { ...days, label },
    visitors: totals?.visitors ?? 0,
    pageViews: totals?.views ?? 0,
    activeNow: activeVids.length,
    orders: orderAgg?.orders ?? 0,
    paidOrders: orderAgg?.paid ?? 0,
    revenue: orderAgg?.revenue ?? 0,
    signups,
    topPages: (visitAgg?.pages ?? []).map((p) => ({ path: p._id, views: p.views, visitors: p.visitors })),
    topProducts: slugs.map((slug, i) => ({ slug, name: names.get(slug) ?? slug, views: visitAgg!.products[i].views })),
    devices,
  };
}
