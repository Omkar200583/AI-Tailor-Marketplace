'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { PORTAL_PATHS, dashboardPathForRole, roleAllowedInPortal, type PortalId } from '@/lib/portals'

/**
 * Client-side companion to the server guard in lib/guards.ts.
 * The server layout is the real gate; this covers the case where the session
 * disappears while the page is open (logout in another tab, deactivation, expiry),
 * and it waits for /auth/me so dashboards always render with a populated user.
 */
export function usePortalSession(portal: PortalId) {
  const user = useAppStore((s) => s.user)
  const sessionChecked = useAppStore((s) => s.sessionChecked)
  const go = useAppStore((s) => s.go)

  const allowed = roleAllowedInPortal(user?.role, portal)

  useEffect(() => {
    if (!sessionChecked) return
    if (!user) go(PORTAL_PATHS[portal].login, { replace: true })
    else if (!allowed) go(dashboardPathForRole(user.role), { replace: true })
  }, [sessionChecked, user, allowed, go, portal])

  return { user: allowed ? user : null, ready: sessionChecked && !!user && allowed }
}
