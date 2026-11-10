'use client'

import { useCallback, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import { PORTAL_PATHS, type PortalId } from '@/lib/portals'

/** Logs out through the existing /auth/logout endpoint and lands on the portal's login page. */
export function useLogout(portal: PortalId) {
  const [loggingOut, setLoggingOut] = useState(false)
  const go = useAppStore((s) => s.go)

  const logout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await api('/auth/logout', { method: 'POST' }).catch(() => null)
      const s = useAppStore.getState()
      s.setUser(null)
      s.setCartCount(0)
      s.setUnreadNotifications(0)
      toast({ title: 'Logged out', description: 'See you soon! 👋' })
      go(PORTAL_PATHS[portal].login, { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }, [go, portal])

  return { logout, loggingOut }
}
