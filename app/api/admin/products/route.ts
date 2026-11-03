import { adminOnly } from '@/lib/server/admin-auth';
import { ProductInput, refreshStorefront, withVariantIds } from '@/lib/server/catalog-admin';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { CategoryModel, ProductModel, toProduct } from '@/lib/server/models';
import { slugify } from '@/lib/server/slug';

export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  const category = new URL(req.url).searchParams.get('category');
  await connectDb();
  const docs = await ProductModel.find(category ? { category } : {}).sort({ sort: 1, createdAt: 1 }).lean();
  return ok({ products: docs.map(toProduct) });
});

export const POST = handle(async (req: Request) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const body = ProductInput.parse(await readJson(req));
  const slug = body.slug || slugify(body.name);
  if (!slug) return fail(400, 'Please use letters or numbers in the name.');
  await connectDb();
  if (!(await CategoryModel.exists({ slug: body.category }))) return fail(400, 'That category does not exist.');
  if (await ProductModel.exists({ slug })) return fail(409, 'Another product already uses that link name.');
  const last = await ProductModel.findOne({}, { sort: 1 }).sort({ sort: -1 }).lean();
  const created = await ProductModel.create({ ...body, slug, variants: withVariantIds(body.variants), sort: body.sort ?? (last?.sort ?? 0) + 1 });
  refreshStorefront();
  return ok({ product: toProduct(created.toObject()) }, 201);
});
