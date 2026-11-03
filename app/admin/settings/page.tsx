import type { Metadata } from 'next';
import { Settings } from '@/components/admin/settings';

export const metadata: Metadata = { title: 'Settings' };

export default function AdminSettingsPage() {
  return <Settings />;
}
