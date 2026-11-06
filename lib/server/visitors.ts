import 'server-only';
import type { mongo } from 'mongoose';
import { SOURCE_LABEL, statsDb, visitsOf, type Device, type VisitDoc } from '@/lib/server/analytics';
import { isPaid, orderInfo, periodRange, type DayRange, type OrderInfo, type Period } from '@/lib/server/admin-stats';
import { connectDb } from '@/lib/server/db';
import { UserModel } from '@/lib/server/models';
import { pageNamer, productNames } from '@/lib/server/page-names';
import { formatINR } from '@/lib/format';

// Keeps one visitor's page of events small however busy they were.
const MAX_EVENTS = 4000;
const MAX_JOURNEY = 1000;

export type OutcomeKey = 'looked' | 'cart' | 'checkout' | 'placed' | 'paid' | 'failed';
export type VisitorRow = {
  id: string; // the anonymous visit id; only used to ask for this visitor's journey
  label: string; // "Visitor 3", or the customer's name when they were signed in
  signedIn: boolean;
  device: Device;
  source: { label: string; other: boolean; direct: boolean } | null; // null: the visit start wasn't recorded
  first: string;
  last: string;
  pages: number;
  lastPage: string;
  outcome: { key: OutcomeKey; text: string };
};
export type StepKind = 'start' | 'page' | 'search' | 'cart' | 'checkout' | 'order' | 'paid' | 'failed';
export type Step = { at: string; kind: StepKind; text: string; detail?: string };

type Ev = VisitDoc;
const isView = (e: Ev) => !e.ev;

const sourceOf = (e: Ev) => (e.src ? { label: e.src === 'other' ? (e.host ?? 'Another website') : SOURCE_LABEL[e.src], other: e.src === 'other', direct: e.src === 'direct' } : null);
const METHOD: Record<string, string> = { online: 'online payment', cod: 'cash on delivery' };

function outcomeOf(events: Ev[], orders: Map<string, OrderInfo>): VisitorRow['outcome'] {
  const tried = events.filter((e) => e.ev === 'order').map((e) => e.order!);
  const saved = tried.filter((n) => orders.has(n));
  const placed = saved.filter((n) => orders.get(n)!.payment !== 'failed');
  const paid = placed.filter((n) => isPaid(orders.get(n)!));
  if (paid.length) return { key: 'paid', text: `Paid ${paid.join(', ')}` };
  if (placed.length) return { key: 'placed', text: `Placed order ${placed.join(', ')}` };
  if (saved.length) return { key: 'failed', text: `Payment didn’t go through (${saved.join(', ')})` };
  if (tried.length || events.some((e) => e.ev === 'checkout')) return { key: 'checkout', text: 'Reached checkout' };
  if (events.some((e) => e.ev === 'cart')) return { key: 'cart', text: 'Added to cart' };
  return { key: 'looked', text: 'Just looked' };
}

const searchText = (q: string) => `Searched: ‘${q}’`;

const eventsFor = (d: mongo.Db, filter: object, limit: number) =>
  visitsOf(d).find(filter, { projection: { _id: 0 } }).sort({ ts: 1 }).limit(limit).toArray();

/** The saved orders behind a set of events, and the names of the customers who were signed in. */
async function lookups(d: mongo.Db, events: Ev[]) {
  const uids = [...new Set(events.map((e) => e.uid).filter((u): u is string => !!u))];
  const [orders, users] = await Promise.all([
    orderInfo(d, events.filter((e) => e.ev === 'order').map((e) => e.order!)),
    uids.length ? connectDb().then(() => UserModel.find({ _id: { $in: uids } }, { name: 1 }).lean()) : [],
  ]);
  return { orders, names: new Map(users.map((u) => [String(u._id), u.name?.trim() || 'Signed-in customer'])) };
}

/** One page of visitors for the period, most recently active first; "Visitor 1" is whoever came first in the period. */
export async function listVisitors(period: Period, custom: DayRange | undefined, page: number, size: number) {
  const d = await statsDb();
  const { from, to } = periodRange(period, custom);
  const inPeriod = { $gte: from, $lt: to };
  const res = await visitsOf(d).aggregate<{ rows: { _id: string; n: number }[]; total: { n: number }[] }>([
    { $match: { ts: inPeriod } },
    { $group: { _id: '$vid', first: { $min: '$ts' }, last: { $max: '$ts' } } },
    { $setWindowFields: { sortBy: { first: 1 }, output: { n: { $documentNumber: {} } } } },
    { $sort: { last: -1, _id: 1 } },
    { $facet: { rows: [{ $skip: page * size }, { $limit: size }], total: [{ $count: 'n' }] } },
  ], { allowDiskUse: true }).next();
  const rows = res?.rows ?? [];
  const total = res?.total[0]?.n ?? 0;
  if (!rows.length) return { visitors: [] as VisitorRow[], total, more: false };

  const events = await eventsFor(d, { vid: { $in: rows.map((r) => r._id) }, ts: inPeriod }, MAX_EVENTS);
  const [{ orders, names }, name] = await Promise.all([lookups(d, events), pageNamer(events.filter(isView).filter((e) => !e.q).map((e) => e.path))]);
  const byVisitor = new Map<string, Ev[]>();
  for (const e of events) byVisitor.set(e.vid, [...(byVisitor.get(e.vid) ?? []), e]);

  const visitors = rows.flatMap((r): VisitorRow[] => {
    const evs = byVisitor.get(r._id);
    if (!evs) return [];
    const views = evs.filter(isView);
    const lastView = views[views.length - 1];
    const uid = [...evs].reverse().find((e) => e.uid)?.uid;
    const start = evs.find((e) => e.src);
    return [{
      id: r._id,
      label: uid ? (names.get(uid) ?? 'Signed-in customer') : `Visitor ${r.n}`,
      signedIn: !!uid,
      device: evs[evs.length - 1].device,
      source: start ? sourceOf(start) : null,
      first: evs[0].ts.toISOString(),
      last: evs[evs.length - 1].ts.toISOString(),
      pages: views.length,
      lastPage: lastView ? (lastView.q ? searchText(lastView.q) : name(lastView.path)) : '—',
      outcome: outcomeOf(evs, orders),
    }];
  });
  return { visitors, total, more: (page + 1) * size < total };
}

/** Everything one visitor did in the period, oldest first, in plain words. */
export async function visitorJourney(vid: string, period: Period, custom?: DayRange) {
  const d = await statsDb();
  const { from, to } = periodRange(period, custom);
  const events = await eventsFor(d, { vid, ts: { $gte: from, $lt: to } }, MAX_JOURNEY);
  const [{ orders }, name, products] = await Promise.all([
    lookups(d, events),
    pageNamer(events.filter(isView).map((e) => e.path)),
    productNames(events.filter((e) => e.ev === 'cart' && e.slug).map((e) => e.slug!)),
  ]);

  const steps: Step[] = [];
  for (const e of events) {
    const at = e.ts.toISOString();
    if (e.src) {
      const s = sourceOf(e)!;
      steps.push({ at, kind: 'start', text: s.direct ? 'Typed the address or opened a saved link' : `Came from ${s.label}`, ...(e.utm?.campaign ? { detail: `Campaign: ${e.utm.campaign}` } : {}) });
    }
    if (e.ev === 'cart') steps.push({ at, kind: 'cart', text: `Added ${products.get(e.slug ?? '') ?? 'a product'} to cart` });
    else if (e.ev === 'checkout') steps.push({ at, kind: 'checkout', text: 'Reached checkout' });
    else if (e.ev === 'order') {
      const o = orders.get(e.order!);
      if (!o) continue;
      if (o.payment === 'failed') {
        steps.push({ at, kind: 'failed', text: 'Payment didn’t go through', detail: e.order });
        continue;
      }
      const method = METHOD[o.method ?? ''];
      steps.push({ at, kind: 'order', text: `Placed order ${e.order}`, detail: [formatINR(o.total), method].filter(Boolean).join(' · ') });
      if (isPaid(o)) steps.push({ at: (o.paidAt ?? o.updatedAt ?? e.ts).toISOString(), kind: 'paid', text: `Paid ${formatINR(o.total)}`, detail: e.order });
    } else if (e.q) {
      steps.push({ at, kind: 'search', text: searchText(e.q), detail: e.n === 0 ? 'Found nothing' : e.n == null ? undefined : `${e.n} ${e.n === 1 ? 'product' : 'products'} found` });
    } else {
      steps.push({ at, kind: 'page', text: name(e.path), detail: e.path });
    }
  }
  steps.sort((a, b) => a.at.localeCompare(b.at));
  return { steps, signedIn: events.some((e) => e.uid) };
}
