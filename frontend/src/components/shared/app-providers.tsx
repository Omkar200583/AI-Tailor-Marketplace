'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAppStore, type SessionUserState } from '@/store/app-store'
import { pathToView } from '@/lib/portals'
import { api } from '@/lib/api-client'

/**
 * Mounted once in the root layout.
 *  1. Hands Next's router to the store so legacy `navigate({ name })` calls do real URL navigation.
 *  2. Mirrors the pathname into `view` (navbar highlighting).
 *  3. Bootstraps the session from the existing /auth/me endpoint.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const setRouter = useAppStore((s) => s.setRouter)
  const setView = useAppStore((s) => s.setView)

  useEffect(() => {
    setRouter({ push: (h) => router.push(h), replace: (h) => router.replace(h), back: () => router.back() })
  }, [router, setRouter])

  useEffect(() => {
    setView(pathToView(pathname))
  }, [pathname, setView])

  useEffect(() => {
    let cancelled = false
    api<{ user: SessionUserState | null }>('/auth/me')
      .then((d) => { if (!cancelled) useAppStore.getState().setUser(d.user) })
      .catch(() => null)
      .finally(() => { if (!cancelled) useAppStore.getState().setSessionChecked(true) })
    return () => { cancelled = true }
  }, [])

  return <>{children}</>
}
