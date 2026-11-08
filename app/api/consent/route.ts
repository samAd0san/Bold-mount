import { cookies } from 'next/headers';
import { CONSENT_COOKIE, CONSENT_MAX_AGE } from '@/lib/consent';
import { VID_COOKIE } from '@/lib/server/analytics';
import { rejectCrossSite } from '@/lib/server/auth';
import { fail, handle, ok, readJson } from '@/lib/server/http';

// Saves the visitor's cookie choice for a week. "No" also removes the visit cookie, which only the server can do.
export const POST = handle(async (req: Request) => {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const { choice } = (await readJson(req)) as { choice?: unknown };
  if (choice !== 'yes' && choice !== 'no') return fail(400, 'Please choose OK or No thanks.');

  const jar = await cookies();
  // Readable by the page (not httpOnly) so the notice knows whether to show; it holds only "yes" or "no".
  jar.set(CONSENT_COOKIE, choice, { sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: CONSENT_MAX_AGE });
  if (choice === 'no') jar.delete(VID_COOKIE);
  return ok({ choice });
});
