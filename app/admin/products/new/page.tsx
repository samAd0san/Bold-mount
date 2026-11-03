import type { Metadata } from 'next';
import { ProductEditor } from '@/components/admin/product-form';

export const metadata: Metadata = { title: 'New product' };

export default function AdminNewProductPage() {
  return <ProductEditor />;
}
