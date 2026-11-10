import { requirePortalUser } from '@/lib/guards'
import { UserShell } from '@/components/user/layout/user-shell'

// Server-side gate: guests → /user/login, sellers/admins → their own dashboard.
export default async function UserAccountLayout({ children }: { children: React.ReactNode }) {
  await requirePortalUser('user')
  return <UserShell>{children}</UserShell>
}
