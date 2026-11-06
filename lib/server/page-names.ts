import 'server-only';
import { POLICY_LINKS } from '@/components/info/policy-data';
import { SERVE_SECTIONS } from '@/lib/sections';
import { connectDb } from '@/lib/server/db';
import { CategoryModel, ProductModel } from '@/lib/server/models';

const FIXED: Record<string, string> = {
  '/': 'Home page',
  '/shop': 'Shop',
  '/cart': 'Cart',
  '/checkout': 'Checkout',
  '/orders': 'Your orders',
  '/account': 'Your orders',
  '/orders/[id]': 'Tracking an order',
  '/about': 'About us',
  '/contact': 'Contact',
  '/faq': 'FAQ',
  '/credits': 'Photo credits',
  '/policies': 'Policies',
};

const prettySlug = (slug: string) => slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

// Pages whose name is not fixed: /product/<slug>, /category/<slug> and the category pages like /dates.
const productSlug = (path: string) => path.match(/^\/product\/([a-z0-9-]+)$/)?.[1];
const categorySlug = (path: string) => {
  if (FIXED[path] || SERVE_SECTIONS.some((s) => s.href === path)) return undefined;
  return path.match(/^\/category\/([a-z0-9-]+)$/)?.[1] ?? path.match(/^\/([a-z0-9-]+)$/)?.[1];
};

// Visits saved before the id was dropped from the path look like /orders/<id>.
const fixedName = (path: string) =>
  FIXED[path] ??
  (path.startsWith('/orders/') ? FIXED['/orders/[id]'] : undefined) ??
  SERVE_SECTIONS.find((s) => s.href === path)?.title ??
  POLICY_LINKS.find((p) => path === `/policies/${p.slug}`)?.title;

/** Product names by slug (a removed product falls back to its slug, spelled out). */
export async function productNames(slugs: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(slugs)];
  const names = new Map(unique.map((s) => [s, prettySlug(s)]));
  if (!unique.length) return names;
  await connectDb();
  for (const p of await ProductModel.find({ slug: { $in: unique } }, { slug: 1, name: 1 }).lean()) names.set(p.slug, p.name);
  return names;
}

/** Looks up the plain name of every page in `paths` at once; the returned function gives the name for one path. */
export async function pageNamer(paths: string[]): Promise<(path: string) => string> {
  const unique = [...new Set(paths)];
  const products = await productNames(unique.map(productSlug).filter((s): s is string => !!s));
  const catSlugs = unique.map(categorySlug).filter((s): s is string => !!s);
  const cats = new Map<string, string>();
  if (catSlugs.length) {
    await connectDb();
    for (const c of await CategoryModel.find({ slug: { $in: catSlugs } }, { slug: 1, name: 1 }).lean()) cats.set(c.slug, c.name);
  }
  return (path) => {
    const fixed = fixedName(path);
    if (fixed) return fixed;
    const p = productSlug(path);
    if (p) return products.get(p) ?? prettySlug(p);
    const c = categorySlug(path);
    if (c) return cats.get(c) ?? prettySlug(c);
    return path;
  };
}
