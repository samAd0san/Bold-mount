import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CategoryPage } from '@/components/shop/category-page';
import { getCategories, getCategory } from '@/lib/catalog';
import { categoryHref } from '@/lib/shop';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;
// Categories added in /admin after the build are rendered on first visit.
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return (await getCategories()).filter((c) => categoryHref(c.slug) === `/category/${c.slug}`).map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: 'Category not found' };
  return { title: category.name, description: category.blurb, alternates: { canonical: `/category/${category.slug}` } };
}

/** Page for categories created in /admin; the five hand-built ones live at their own URLs. */
export default async function CategoryRoute({ params }: Props) {
  const { slug } = await params;
  const own = categoryHref(slug);
  if (own !== `/category/${slug}`) redirect(own);
  return <CategoryPage slug={slug} />;
}
