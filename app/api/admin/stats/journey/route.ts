import { adminOnly } from '@/lib/server/admin-auth';
import { VID_RE } from '@/lib/server/analytics';
import { readPeriod } from '@/lib/server/admin-stats';
import { fail, handle, ok } from '@/lib/server/http';
import { visitorJourney } from '@/lib/server/visitors';

// One visitor's steps in the period. ?vid=<id from the visitors list>
export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const sp = new URL(req.url).searchParams;
  const r = readPeriod(sp);
  if ('error' in r) return fail(400, r.error);
  const vid = sp.get('vid') ?? '';
  if (!VID_RE.test(vid)) return fail(400, 'Pick a visitor first.');
  return ok(await visitorJourney(vid, r.period, r.custom));
});
