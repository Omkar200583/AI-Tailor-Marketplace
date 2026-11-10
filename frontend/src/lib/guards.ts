// Server-side route guards for the role-based portals.
// Used from Server Component layouts/pages. Reuses the existing session
// cookie + getSessionUser() — no change to the auth backend.
import { redirect } from 'next/navigation'
import { getSessionUser, type SessionUser } from '@/lib/auth'
import { PORTAL_PATHS, dashboardPathForRole, roleAllowedInPortal, type PortalId } from '@/lib/portals'

/**
 * Protects a portal area.
 *  - guest           → that portal's login page
 *  - wrong role      → the user's OWN portal dashboard (never reveals other portals)
 *  - correct role    → returns the session user
 */
export async function requirePortalUser(portal: PortalId): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(PORTAL_PATHS[portal].login)
  if (!roleAllowedInPortal(user.role, portal)) redirect(dashboardPathForRole(user.role))
  return user
}

/** For login/register pages: already-signed-in users skip straight to their dashboard. */
export async function redirectIfSignedIn(): Promise<void> {
  const user = await getSessionUser()
  if (user) redirect(dashboardPathForRole(user.role))
}
