import 'server-only';
import { connectDb } from '@/lib/server/db';
import { CategoryModel, ProductModel, toCategory, toProduct } from '@/lib/server/models';
import type { Catalog } from '@/lib/types';

/** Active categories and products straight from MongoDB, in display order (products grouped by category). */
export async function catalogFromDb(): Promise<Catalog> {
  await connectDb();
  const [cats, prods] = await Promise.all([
    CategoryModel.find({ active: true }).sort({ sort: 1, name: 1 }).lean(),
    ProductModel.find({ active: true }).sort({ sort: 1, createdAt: 1 }).lean(),
  ]);
  const categories = cats.map(toCategory);
  const rank = new Map(categories.map((c, i) => [c.slug, i]));
  // Grouped in menu order, so a new category's products sit together instead of among another category's.
  const products = prods.map(toProduct).filter((p) => rank.has(p.category)).sort((a, b) => rank.get(a.category)! - rank.get(b.category)!);
  return { categories, products };
}
