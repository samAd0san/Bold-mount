import { parseDelivery } from '@/lib/delivery';
import { adminOnly } from '@/lib/server/admin-auth';
import { refreshStorefront } from '@/lib/server/catalog-admin';
import { readDelivery, saveDelivery } from '@/lib/server/delivery';
import { fail, handle, ok, readJson } from '@/lib/server/http';

export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  return ok(await readDelivery());
});

// Saves the delivery fee and free-delivery rule, then refreshes the shop pages and open carts.
export const PUT = handle(async (req: Request) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const parsed = parseDelivery(await readJson(req));
  if ('error' in parsed) return fail(400, parsed.error);
  await saveDelivery(parsed.settings);
  refreshStorefront();
  return ok(parsed.settings);
});
