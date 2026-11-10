import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { PORTAL_PATHS, dashboardPathForRole } from '@/lib/portals'

// `/seller` — pure router: signed-in users go to their dashboard, everyone else to seller login.
export default async function SellerIndex() {
  const user = await getSessionUser()
  redirect(user ? dashboardPathForRole(user.role) : PORTAL_PATHS.seller.login)
}
