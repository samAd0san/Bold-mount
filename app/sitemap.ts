import type { MetadataRoute } from 'next';
import { POLICY_SLUGS } from '@/components/info/policy-data';
import { getCatalog } from '@/lib/catalog';
import { SERVE_SECTIONS } from '@/lib/sections';
import { categoryHref } from '@/lib/shop';
import { SITE } from '@/lib/site';
import type { Catalog } from '@/lib/types';

export const revalidate = 60;

// Used only when the catalog can't be loaded: the five hand-built category pages, no products.
const FALLBACK_PATHS = ['/talbeenah', '/dates', '/honey', '/dry-fruits', '/wearings'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/$/, '');
  const now = new Date();

  let catalog: Catalog | null = null;
  try {
    catalog = await getCatalog();
  } catch {
    // Keep the sitemap alive with static paths.
  }

  const routes: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/shop', priority: 0.9, changeFrequency: 'weekly' },
    ...(catalog ? catalog.categories.map((c) => categoryHref(c.slug)) : FALLBACK_PATHS).map((path) => ({ path, priority: 0.8, changeFrequency: 'weekly' as const })),
    ...SERVE_SECTIONS.map((s) => ({ path: s.href, priority: 0.8, changeFrequency: 'weekly' as const })),
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    ...(catalog?.products ?? []).map((p) => ({ path: `/product/${p.slug}`, priority: 0.7, changeFrequency: 'weekly' as const })),
    ...POLICY_SLUGS.map((slug) => ({ path: `/policies/${slug}`, priority: 0.3, changeFrequency: 'yearly' as const })),
  ];

  return routes.map((r) => ({
    url: r.path === '/' ? base : `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
