import type { Metadata } from 'next';
import { CategoryEditor } from '@/components/admin/category-form';

export const metadata: Metadata = { title: 'Edit category' };

export default async function AdminEditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CategoryEditor id={id} />;
}
