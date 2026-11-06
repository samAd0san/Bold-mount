import type { Metadata } from 'next';
import { Visitors } from '@/components/admin/visitors';

export const metadata: Metadata = { title: 'Visitors' };

export default function AdminVisitorsPage() {
  return <Visitors />;
}
