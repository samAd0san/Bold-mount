import { z } from 'zod';
import { adminOnly } from '@/lib/server/admin-auth';
import { adminStats, DAY_RE, PERIODS } from '@/lib/server/admin-stats';
import { fail, handle, ok } from '@/lib/server/http';

const Query = z.object({
  period: z.enum(PERIODS, 'Period must be today, yesterday, week or custom.').default('today'),
  from: z.string().regex(DAY_RE, 'Pick a valid date.').optional(),
  to: z.string().regex(DAY_RE, 'Pick a valid date.').optional(),
});

export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const sp = new URL(req.url).searchParams;
  const q = Query.parse({ period: sp.get('period') ?? undefined, from: sp.get('from') ?? undefined, to: sp.get('to') ?? undefined });
  if (q.period !== 'custom') return ok(await adminStats(q.period));
  if (!q.from || !q.to) return fail(400, 'Pick a date first.');
  const [from, to] = q.from <= q.to ? [q.from, q.to] : [q.to, q.from];
  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) return fail(400, 'Pick a valid date.');
  // A year is plenty and keeps the aggregation quick.
  if ((Date.parse(to) - Date.parse(from)) / 86_400_000 > 366) return fail(400, 'Pick a range of one year or less.');
  return ok(await adminStats('custom', { from, to }));
});
