import { adminOnly } from '@/lib/server/admin-auth';
import { ProductPatch, refreshStorefront, withVariantIds } from '@/lib/server/catalog-admin';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { CategoryModel, ProductModel, toProduct } from '@/lib/server/models';
import { isObjectId } from '@/lib/server/slug';

type Ctx = { params: Promise<{ id: string }> };
const NOT_FOUND = 'That product was not found.';

export const GET = handle(async (req: Request, { params }: Ctx) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const { id } = await params;
  await connectDb();
  const doc = isObjectId(id) ? await ProductModel.findById(id).lean() : null;
  return doc ? ok({ product: toProduct(doc) }) : fail(404, NOT_FOUND);
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  const patch = ProductPatch.parse(await readJson(req));
  await connectDb();
  const current = isObjectId(id) ? await ProductModel.findById(id).lean() : null;
  if (!current) return fail(404, NOT_FOUND);
  if (patch.slug !== undefined && !patch.slug) return fail(400, 'Please use letters or numbers in the link name.');
  if (patch.slug && patch.slug !== current.slug && (await ProductModel.exists({ slug: patch.slug }))) {
    return fail(409, 'Another product already uses that link name.');
  }
  if (patch.category && !(await CategoryModel.exists({ slug: patch.category }))) return fail(400, 'That category does not exist.');
  const update = { ...patch, ...(patch.variants ? { variants: withVariantIds(patch.variants) } : {}) };
  const doc = await ProductModel.findByIdAndUpdate(id, update, { new: true }).lean();
  refreshStorefront();
  return ok({ product: toProduct(doc!) });
});

export const DELETE = handle(async (req: Request, { params }: Ctx) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const { id } = await params;
  await connectDb();
  const hit = isObjectId(id) ? await ProductModel.findByIdAndDelete(id) : null;
  if (!hit) return fail(404, NOT_FOUND);
  refreshStorefront();
  return ok({ ok: true });
});
