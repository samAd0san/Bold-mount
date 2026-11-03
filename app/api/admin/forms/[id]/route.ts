import { z } from 'zod';
import { adminOnly } from '@/lib/server/admin-auth';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { FormModel } from '@/lib/server/models';
import { isObjectId } from '@/lib/server/slug';

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({ read: z.boolean('Say whether it is read or not.') });

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  const { read } = Body.parse(await readJson(req));
  await connectDb();
  const hit = isObjectId(id) ? await FormModel.findByIdAndUpdate(id, { read }, { timestamps: false }) : null;
  return hit ? ok({ ok: true }) : fail(404, 'That message was not found.');
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  await connectDb();
  const hit = isObjectId(id) ? await FormModel.findByIdAndDelete(id) : null;
  return hit ? ok({ ok: true }) : fail(404, 'That message was not found.');
});
