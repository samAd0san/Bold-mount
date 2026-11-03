import 'server-only';
import { connectDb } from '@/lib/server/db';
import { CategoryModel, ProductModel, toCategory, toProduct } from '@/lib/server/models';
import type { Catalog } from '@/lib/types';

/** Active categories and products straight from MongoDB, in display order. */
export async function catalogFromDb(): Promise<Catalog> {
  await connectDb();
  const [cats, prods] = await Promise.all([
    CategoryModel.find({ active: true }).sort({ sort: 1, name: 1 }).lean(),
    ProductModel.find({ active: true }).sort({ sort: 1, createdAt: 1 }).lean(),
  ]);
  const categories = cats.map(toCategory);
  const live = new Set(categories.map((c) => c.slug));
  return { categories, products: prods.map(toProduct).filter((p) => live.has(p.category)) };
}
