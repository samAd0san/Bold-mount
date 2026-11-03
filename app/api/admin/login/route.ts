import { z } from 'zod';
import { checkTries, failTry, logIn, pinMatches, tooMany } from '@/lib/server/admin-auth';
import { rejectCrossSite } from '@/lib/server/auth';
import { fail, handle, ok, readJson } from '@/lib/server/http';

const Body = z.object({ pin: z.string('Please enter your PIN.').max(12) });

export const POST = handle(async (req: Request) => {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const { pin } = Body.parse(await readJson(req));
  const guard = await checkTries();
  if (!guard.ok) return fail(429, tooMany(guard.waitMinutes), { waitMinutes: guard.waitMinutes });
  if (!(await pinMatches(pin))) {
    const { left, waitMinutes } = await failTry(guard);
    if (left <= 0) return fail(429, tooMany(waitMinutes), { waitMinutes });
    return fail(401, `Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left.`, { left });
  }
  await logIn(guard.key);
  return ok({ ok: true });
});
