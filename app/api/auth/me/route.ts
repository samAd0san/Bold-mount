import { clearSession, getSessionUser } from '@/lib/server/auth';
import { googleReady } from '@/lib/server/auth-google';
import { sessionUid } from '@/lib/server/auth-token';
import { handle, ok } from '@/lib/server/http';

// `google` tells the UI whether to show the Google button (pages may be served by a host without the env vars).
export const GET = handle(async () => {
  const user = await getSessionUser();
  // A valid cookie for a deleted account: drop it.
  if (!user && (await sessionUid())) await clearSession();
  return ok({ user, google: googleReady() });
});
