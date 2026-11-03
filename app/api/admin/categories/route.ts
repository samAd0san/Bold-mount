import { adminOnly } from '@/lib/server/admin-auth';
import { CategoryInput, refreshStorefront } from '@/lib/server/catalog-admin';
import { connectDb } from '@/lib/server/db';
import { fail, handle, ok, readJson } from '@/lib/server/http';
import { CategoryModel, ProductModel, toCategory } from '@/lib/server/models';
import { slugify } from '@/lib/server/slug';

export const GET = handle(async (req: Request) => {
  const denied = await adminOnly(req);
  if (denied) return denied;
  await connectDb();
  const [cats, counts] = await Promise.all([
    CategoryModel.find({}).sort({ sort: 1, name: 1 }).lean(),
    ProductModel.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$category', n: { $sum: 1 } } }]),
  ]);
  const byCat = new Map(counts.map((c) => [c._id, c.n]));
  return ok({ categories: cats.map((c) => ({ ...toCategory(c), products: byCat.get(c.slug) ?? 0 })) });
});

export const POST = handle(async (req: Request) => {
  const denied = await adminOnly(req, true);
  if (denied) return denied;
  const body = CategoryInput.parse(await readJson(req));
  const slug = body.slug || slugify(body.name);
  if (!slug) return fail(400, 'Please use letters or numbers in the name.');
  await connectDb();
  if (await CategoryModel.exists({ slug })) return fail(409, 'Another category already uses that link name.');
  const last = await CategoryModel.findOne({}, { sort: 1 }).sort({ sort: -1 }).lean();
  const created = await CategoryModel.create({ ...body, slug, short: body.short || body.name, sort: body.sort ?? (last?.sort ?? 0) + 1 });
  refreshStorefront();
  return ok({ category: toCategory(created.toObject()) }, 201);
});
