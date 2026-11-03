import { clearSession, rejectCrossSite } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';

export const POST = handle(async (req: Request) => {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  await clearSession();
  return ok({ ok: true });
});
