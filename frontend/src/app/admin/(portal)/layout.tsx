import { requirePortalUser } from '@/lib/guards'
import { AdminShell } from '@/components/admin/layout/admin-shell'

// Server-side gate: guests → /admin/login, any non-admin → their own dashboard.
export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  await requirePortalUser('admin')
  return <AdminShell>{children}</AdminShell>
}
