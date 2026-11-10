'use client'

import { create } from 'zustand'
import { viewToPath, type View, type ViewName } from '@/lib/portals'

export type { View, ViewName }

/**
 * Minimal router surface (subset of Next's AppRouterInstance) — injected by
 * <AppProviders /> so the store can do real URL navigation.
 */
export interface RouterLike {
  push: (href: string) => void
  replace: (href: string) => void
  back: () => void
}

export interface SessionUserState {
  id: string
  name: string
  email: string
  role: 'CUSTOMER' | 'SELLER' | 'DESIGNER' | 'ADMIN'
  phone: string | null
  avatarColor: string
  city: string | null
  isVerified: boolean
  cartCount?: number
  unreadNotifications?: number
  seller?: { id: string; shopName: string; verificationStatus: string } | null
}

interface AppState {
  /** Derived from the current URL (kept for navbar highlighting). */
  view: View
  user: SessionUserState | null
  /** true once the first /auth/me round-trip has finished (success or not). */
  sessionChecked: boolean
  cartCount: number
  unreadNotifications: number
  router: RouterLike | null
  /** @deprecated kept so legacy call sites compile; auth is now route based. */
  authOpen: boolean

  /** Real URL navigation. Existing components keep calling navigate({ name: ... }). */
  navigate: (view: View) => void
  /** Navigate to an explicit path (used by new portal code). */
  go: (path: string, opts?: { replace?: boolean }) => void
  back: () => void
  setView: (view: View) => void
  setRouter: (router: RouterLike) => void
  setUser: (u: SessionUserState | null) => void
  setSessionChecked: (v: boolean) => void
  setCartCount: (n: number) => void
  setUnreadNotifications: (n: number) => void
  /** Legacy: "open the login dialog" now means "go to the customer login page". */
  setAuthOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  view: { name: 'home' },
  user: null,
  sessionChecked: false,
  cartCount: 0,
  unreadNotifications: 0,
  router: null,
  authOpen: false,

  go: (path, opts) => {
    const { router } = get()
    if (router) {
      if (opts?.replace) router.replace(path)
      else router.push(path)
    } else if (typeof window !== 'undefined') {
      window.location.assign(path)
    }
  },

  navigate: (view) => {
    get().go(viewToPath(view, get().user?.role))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  },

  back: () => {
    const { router } = get()
    if (router) router.back()
    else if (typeof window !== 'undefined') window.history.back()
  },

  setView: (view) => set({ view }),
  setRouter: (router) => set({ router }),
  setUser: (user) =>
    set({
      user,
      cartCount: user?.cartCount ?? get().cartCount,
      unreadNotifications: user?.unreadNotifications ?? get().unreadNotifications,
    }),
  setSessionChecked: (sessionChecked) => set({ sessionChecked }),
  setCartCount: (cartCount) => set({ cartCount }),
  setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),

 setAuthOpen: (open) => {
  if (!open || typeof window === 'undefined') return

  const here = window.location.pathname + window.location.search
  const onLogin = here === '/login' || here === '/register'

  const next = !onLogin ? `?next=${encodeURIComponent(here)}` : ''

  get().go(`/login${next}`)
},
}))
