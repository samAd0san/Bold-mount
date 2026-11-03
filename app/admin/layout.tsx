import type { Metadata } from 'next';
import { AdminGate } from '@/components/admin/admin-gate';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

// Pure client gate: the PIN check happens through /api/admin/session, so this layout never touches the database.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
