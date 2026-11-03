import type { Metadata } from 'next';
import { ProductEditor } from '@/components/admin/product-form';

export const metadata: Metadata = { title: 'Edit product' };

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor id={id} />;
}
