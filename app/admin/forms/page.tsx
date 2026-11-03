import type { Metadata } from 'next';
import { FormsList } from '@/components/admin/forms-list';

export const metadata: Metadata = { title: 'Forms' };

export default function AdminFormsPage() {
  return <FormsList />;
}
