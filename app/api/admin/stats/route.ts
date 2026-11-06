import { adminOnly } from '@/lib/server/admin-auth';
import { adminStats, readPeriod } from '@/lib/server/admin-stats';
import { fail, handle, ok } from '@/lib/server/http';

export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const r = readPeriod(new URL(req.url).searchParams);
  return 'error' in r ? fail(400, r.error) : ok(await adminStats(r.period, r.custom));
});
