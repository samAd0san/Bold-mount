import { isAdmin } from '@/lib/server/admin-auth';
import { sessionUid } from '@/lib/server/auth-token';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok } from '@/lib/server/http';
import { liveEnabled, liveGrant } from '@/lib/server/live';

export const dynamic = 'force-dynamic';

// Ably token for this browser: what it may listen to follows its own sign-in and admin cookies.
export const GET = handle(async () => {
  if (!liveEnabled()) return fail(503, 'Live updates are off.');
  await connectDb();
  const [uid, admin] = await Promise.all([sessionUid(), isAdmin()]);
  return ok(await liveGrant({ uid, admin }));
});
