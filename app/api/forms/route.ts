import { clientKey, FormBody } from '@/lib/server/forms';
import { connectDb } from '@/lib/server/db';
import { rejectCrossSite } from '@/lib/server/auth';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { FormModel } from '@/lib/server/models';

// A form someone filled on the site (contact, zakat, volunteer…). Saved for the owner to read in /admin.
export const POST = handle(async (req: Request) => {
  const blocked = rejectCrossSite(req);
  if (blocked) return blocked;
  const body = FormBody.parse(await readJson(req));
  if (body.website) return ok({ ok: true }, 201);
  if (!body.fields.some((f) => f.value)) return fail(400, 'Please fill in the form.');
  await connectDb();
  const client = clientKey(req);
  const recent = await FormModel.countDocuments({ client, createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } });
  if (recent >= 10) return fail(429, 'You have sent a few forms already. Please try again in an hour.');
  await FormModel.create({ form: body.form, page: body.page, fields: body.fields, client });
  return ok({ ok: true }, 201);
});
