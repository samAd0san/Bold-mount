import { sessionUid } from '@/lib/server/auth-token';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok } from '@/lib/server/http';
import { COD_OFF, codAllowed } from '@/lib/server/orders';

// Whether this signed-in customer may choose cash on delivery; the order itself is checked again when it is placed.
export const GET = handle(async () => {
  const uid = await sessionUid();
  if (!uid) return fail(401, 'Please sign in to place your order.');
  await connectDb();
  return ok((await codAllowed(uid)) ? { allowed: true } : { allowed: false, reason: COD_OFF });
});
