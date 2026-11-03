import 'server-only';
import { cache } from 'react';
import type { Catalog, Category, Product } from '@/lib/types';

/**
 * The whole live catalog for server components. On Vercel (API_ORIGIN set) it comes from the Render API,
 * cached for 60s; elsewhere it is read from MongoDB directly.
 */
export const getCatalog = cache(async (): Promise<Catalog> => {
  const origin = process.env.API_ORIGIN?.replace(/\/$/, '');
  if (origin) {
    const res = await fetch(`${origin}/api/catalog`, { next: { revalidate: 60, tags: ['catalog'] } });
    if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
    return res.json();
  }
  const { catalogFromDb } = await import('@/lib/server/catalog');
  return catalogFromDb();
});

export const getCategories = async (): Promise<Category[]> => (await getCatalog()).categories;
export const getCategory = async (slug: string) => (await getCategories()).find((c) => c.slug === slug);
export const getProducts = async (): Promise<Product[]> => (await getCatalog()).products;
export const getProduct = async (slug: string) => (await getProducts()).find((p) => p.slug === slug);
export const productsByCategory = async (slug: string) => (await getProducts()).filter((p) => p.category === slug);
export const bestsellers = async () => (await getProducts()).filter((p) => p.tags.includes('bestseller'));
export const giftProducts = async () => (await getProducts()).filter((p) => p.tags.includes('gift'));

export async function relatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await getProducts();
  const same = all.filter((p) => p.slug !== product.slug && p.category === product.category);
  const others = all.filter((p) => p.slug !== product.slug && p.category !== product.category && p.tags.includes('bestseller'));
  return [...same, ...others].slice(0, limit);
}
