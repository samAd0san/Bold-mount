import type { Metadata } from 'next';
import { Dashboard } from '@/components/admin/dashboard';

export const metadata: Metadata = { title: { absolute: 'Admin' } };

export default function AdminPage() {
  return <Dashboard />;
}
