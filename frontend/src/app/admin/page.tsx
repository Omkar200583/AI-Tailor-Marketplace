import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { PORTAL_PATHS, dashboardPathForRole } from '@/lib/portals'

// `/admin` — pure router: signed-in users go to their dashboard, everyone else to admin login.
export default async function AdminIndex() {
  const user = await getSessionUser()
  redirect(user ? dashboardPathForRole(user.role) : PORTAL_PATHS.admin.login)
}
