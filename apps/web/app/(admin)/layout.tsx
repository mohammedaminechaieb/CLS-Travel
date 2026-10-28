import { STAFF_ROLES } from '@cls/shared';
import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';
import { RequireAuth } from '@/components/client/require-auth';

export const metadata: Metadata = { title: 'Back-office', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={STAFF_ROLES}>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}
