import type { Metadata } from 'next';
import { CategoryEditor } from '@/components/admin/category-form';

export const metadata: Metadata = { title: 'New category' };

export default function AdminNewCategoryPage() {
  return <CategoryEditor />;
}
