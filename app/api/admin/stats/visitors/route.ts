import { adminOnly } from '@/lib/server/admin-auth';
import { readPeriod } from '@/lib/server/admin-stats';
import { fail, handle, ok } from '@/lib/server/http';
import { listVisitors } from '@/lib/server/visitors';

// A page of visitors for the period, newest first. ?page=0&size=20 (size 1–50).
export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const sp = new URL(req.url).searchParams;
  const r = readPeriod(sp);
  if ('error' in r) return fail(400, r.error);
  const page = Math.min(Math.max(Math.floor(Number(sp.get('page'))) || 0, 0), 1000);
  const size = Math.min(Math.max(Math.floor(Number(sp.get('size'))) || 20, 1), 50);
  return ok(await listVisitors(r.period, r.custom, page, size));
});
