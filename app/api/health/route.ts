import { connectDb, DB_NAME } from '@/lib/server/db';
import { handle, ok } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const GET = handle(async () => {
  const m = await connectDb();
  await m.connection.db?.command({ ping: 1 });
  return ok({ ok: true, db: DB_NAME });
});
