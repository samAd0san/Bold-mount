import type { Metadata } from 'next';
import { CategoriesList } from '@/components/admin/categories-list';

export const metadata: Metadata = { title: 'Categories' };

export default function AdminCategoriesPage() {
  return <CategoriesList />;
}
