'use client'

import { useCallback, useState } from 'react'
import { useAppStore, type SessionUserState } from '@/store/app-store'
import { api } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import { PORTAL_PATHS, portalForRole, safeNextPath, type PortalId } from '@/lib/portals'

export interface RegisterPayload {
  name: string
  email: string
  password: string
  phone?: string
  role: 'CUSTOMER' | 'DESIGNER' | 'SELLER'
  shopName?: string
  city?: string
}

/**
 * Login / register flow for one portal's auth pages. Reuses the existing
 * /auth/login, /auth/register, /auth/me and /auth/logout endpoints unchanged.
 *
 * Rules
 *  - the real role comes from the server (/auth/me), never from the form
 *  - after success the user lands on THEIR OWN portal dashboard
 *  - ADMIN credentials are refused on customer/seller forms and non-admin credentials
 *    are refused on the admin form, with generic wording (the admin console is never advertised)
 */
export function useAuthFlow(portal: PortalId, next?: string | null) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const go = useAppStore((s) => s.go)

  const finish = useCallback(async (): Promise<boolean> => {
    let me: SessionUserState | null = null
    try {
      me = (await api<{ user: SessionUserState | null }>('/auth/me')).user
    } catch { /* handled below */ }

    if (!me) {
      setError('Could not start your session. Please try again.')
      return false
    }

    const rolePortal = portalForRole(me.role)
    const refuse = (msg: string) => {
      api('/auth/logout', { method: 'POST' }).catch(() => null)
      useAppStore.getState().setUser(null)
      setError(msg)
      return false
    }

    if (portal === 'admin' && me.role !== 'ADMIN') return refuse('This account is not authorized to access the admin console.')
    if (portal !== 'admin' && me.role === 'ADMIN') return refuse('Invalid email or password')

    const store = useAppStore.getState()
    store.setUser(me)
    store.setSessionChecked(true)
    toast({ title: `Welcome, ${me.name.split(' ')[0]}! 🎉`, description: `Signed in to the ${PORTAL_PATHS[rolePortal].label.toLowerCase()} portal.` })

    const target = rolePortal === portal ? safeNextPath(next, portal) : null
    go(target || PORTAL_PATHS[rolePortal].dashboard, { replace: true })
    return true
  }, [go, portal, next])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await api('/auth/login', { method: 'POST', body: { email: email.trim(), password } })
      const ok = await finish()
      return ok
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast({ title: msg, variant: 'destructive' })
      return false
    } finally {
      setLoading(false)
    }
  }, [finish])

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true)
    setError(null)
    try {
      await api('/auth/register', { method: 'POST', body: { ...payload, email: payload.email.trim(), name: payload.name.trim(), city: payload.city || 'Pune' } })
      return await finish()
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      toast({ title: msg, variant: 'destructive' })
      return false
    } finally {
      setLoading(false)
    }
  }, [finish])

  return { login, register, loading, error, setError }
}
