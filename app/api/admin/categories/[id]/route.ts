import { adminOnly } from '@/lib/server/admin-auth';
import { CategoryPatch, refreshStorefront } from '@/lib/server/catalog-admin';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { CategoryModel, ProductModel, toCategory } from '@/lib/server/models';
import { isObjectId } from '@/lib/server/slug';

type Ctx = { params: Promise<{ id: string }> };
const NOT_FOUND = 'That category was not found.';

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  const patch = CategoryPatch.parse(await readJson(req));
  await connectDb();
  const current = isObjectId(id) ? await CategoryModel.findById(id).lean() : null;
  if (!current) return fail(404, NOT_FOUND);
  if (patch.slug !== undefined && !patch.slug) return fail(400, 'Please use letters or numbers in the link name.');
  if (patch.slug && patch.slug !== current.slug && (await CategoryModel.exists({ slug: patch.slug }))) {
    return fail(409, 'Another category already uses that link name.');
  }
  const doc = await CategoryModel.findByIdAndUpdate(id, patch, { new: true }).lean();
  // Products point at their category by slug, so a renamed slug has to follow.
  if (patch.slug && patch.slug !== current.slug) await ProductModel.updateMany({ category: current.slug }, { category: patch.slug });
  refreshStorefront();
  return ok({ category: toCategory(doc!) });
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  await connectDb();
  const current = isObjectId(id) ? await CategoryModel.findById(id).lean() : null;
  if (!current) return fail(404, NOT_FOUND);
  const n = await ProductModel.countDocuments({ category: current.slug });
  if (n > 0) return fail(409, `Move or delete its ${n} product${n === 1 ? '' : 's'} first.`);
  await CategoryModel.findByIdAndDelete(id);
  refreshStorefront();
  return ok({ ok: true });
});
