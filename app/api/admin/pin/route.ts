import { z } from 'zod';
import { adminOnly, changePin, checkTries, failTry, PIN_RE, pinMatches, tooMany } from '@/lib/server/admin-auth';
import { fail, handle, ok, readJson } from '@/lib/server/http';

const Body = z.object({ current: z.string('Please enter your current PIN.').max(12), next: z.string('Please enter a new PIN.').max(12) });

export const POST = handle(async (req: Request) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { current, next } = Body.parse(await readJson(req));
  if (!PIN_RE.test(next)) return fail(400, 'The new PIN must be 4 to 8 digits.');
  const guard = await checkTries();
  if (!guard.ok) return fail(429, tooMany(guard.waitMinutes), { waitMinutes: guard.waitMinutes });
  if (!(await pinMatches(current))) {
    const { left, waitMinutes } = await failTry(guard);
    if (left <= 0) return fail(429, tooMany(waitMinutes), { waitMinutes });
    return fail(400, `Current PIN is wrong. ${left} ${left === 1 ? 'try' : 'tries'} left.`, { left });
  }
  if (current === next) return fail(400, 'The new PIN is the same as the current one.');
  await changePin(guard.key, next);
  return ok({ ok: true });
});
