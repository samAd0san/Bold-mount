import type { MetadataRoute } from 'next';
import { POLICY_SLUGS } from '@/components/info/policy-data';
import { PRODUCTS } from '@/lib/products';
import { SECTIONS } from '@/lib/sections';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, '');
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/shop', priority: 0.9, changeFrequency: 'weekly' },
    ...SECTIONS.map((s) => ({ path: s.href, priority: 0.8, changeFrequency: 'weekly' as const })),
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    ...PRODUCTS.map((p) => ({ path: `/product/${p.slug}`, priority: 0.7, changeFrequency: 'weekly' as const })),
    ...POLICY_SLUGS.map((slug) => ({ path: `/policies/${slug}`, priority: 0.3, changeFrequency: 'yearly' as const })),
  ];

  return routes.map((r) => ({
    url: r.path === '/' ? base : `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
