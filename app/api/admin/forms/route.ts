import { adminOnly } from '@/lib/server/admin-auth';
import { connectDb } from '@/lib/server/db';
import { handle, ok } from '@/lib/server/http';
import { FormModel, toForm } from '@/lib/server/models';

export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  await connectDb();
  const [docs, unread] = await Promise.all([
    FormModel.find({}, { client: 0 }).sort({ createdAt: -1 }).limit(300).lean(),
    FormModel.countDocuments({ read: false }),
  ]);
  return ok({ unread, forms: docs.map(toForm) });
});
