'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Globe, Loader2, LogOut, Menu, Plus, Scissors } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/common/ui-bits'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import { SidebarNav } from '@/components/shared/layout/sidebar-nav'
import { SidebarUserChip } from '@/components/shared/layout/user-chip'
import { usePortalSession } from '@/components/shared/layout/use-portal-session'
import { PortalLoading } from '@/components/shared/layout/portal-loading'
import { findActiveNav } from '@/components/shared/layout/types'
import { usePortalTheme } from '@/components/shared/use-portal-theme'
import { useLogout } from '@/components/shared/use-logout'
import { sellerNavGroups } from './nav'

const STATUS_STYLE: Record<string, string> = {
  VERIFIED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
}

/**
 * SELLER portal shell — business workspace: full-height emerald sidebar with the
 * brand, a white top bar with shop name, verification state and quick actions.
 */
export function SellerShell({ children }: { children: React.ReactNode }) {
  usePortalTheme('theme-seller')
  const { user, ready } = usePortalSession('seller')
  const pathname = usePathname()
  const unread = useAppStore((s) => s.unreadNotifications)
  const { logout, loggingOut } = useLogout('seller')
  const [open, setOpen] = useState(false)
  const groups = sellerNavGroups(unread)
  const active = findActiveNav(groups, pathname)

  // refresh the unread badge once when the workspace opens
  useEffect(() => {
    api<{ user: { unreadNotifications?: number } | null }>('/auth/me')
      .then((d) => d.user && useAppStore.getState().setUnreadNotifications(d.user.unreadNotifications || 0))
      .catch(() => null)
  }, [])

  const status = user?.seller?.verificationStatus || 'PENDING'

  const brand = (
    <Link href="/seller/dashboard" className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border shrink-0" aria-label="AI Tailor seller dashboard">
      <span className="w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center"><Scissors className="w-4 h-4" /></span>
      <span className="leading-tight">
        <span className="block font-display font-bold text-white text-base">AI Tailor</span>
        <span className="block text-[9px] uppercase tracking-[0.22em] text-sidebar-primary font-semibold">Seller studio</span>
      </span>
    </Link>
  )

  const logoutBtn = (
    <div className="p-3 border-t border-sidebar-border">
      <button onClick={logout} disabled={loggingOut} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-300/80 hover:bg-red-500/10 hover:text-red-300 transition-all disabled:opacity-60">
        {loggingOut ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <LogOut className="w-[18px] h-[18px]" />} Logout
      </button>
    </div>
  )

  return (
    <div className="theme-seller min-h-screen flex bg-background text-foreground">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-sidebar text-sidebar-foreground sticky top-0 h-screen">
        {brand}
        <SidebarUserChip roleLabel={user?.seller?.shopName || 'Tailor'} />
        <SidebarNav groups={groups} label="Seller navigation" />
        {logoutBtn}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 h-14 bg-card/90 backdrop-blur border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-wine-50" aria-label="Open navigation menu"><Menu className="w-5 h-5 text-wine-800" /></button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col">
              <SheetTitle className="sr-only">Seller navigation</SheetTitle>
              {brand}
              <SidebarNav groups={groups} onNavigate={() => setOpen(false)} label="Seller navigation" />
              {logoutBtn}
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold leading-none">{active?.label || 'Seller'}</div>
            <div className="font-display font-bold text-wine-900 truncate leading-tight">{user?.seller?.shopName || user?.name || 'Your shop'}</div>
          </div>

          <span className={`hidden sm:inline-flex ml-2 text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] || STATUS_STYLE.PENDING}`}>
            {status === 'VERIFIED' ? '✓ Verified shop' : status === 'REJECTED' ? 'Verification rejected' : 'Verification pending'}
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <Button asChild size="sm" className="hidden sm:inline-flex bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-1.5">
              <Link href="/seller/products"><Plus className="w-4 h-4" /> Add product</Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Link href="/seller/notifications">
                <Bell className="w-5 h-5" />
                {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-card" />}
              </Link>
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-wine-200 hover:ring-wine-400 transition-all" aria-label="Account menu"><Avatar name={user.name} color={user.avatarColor} size={34} /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/seller/shop"><Globe className="w-4 h-4 mr-2" /> Shop profile</Link></DropdownMenuItem>
                  {user.seller && <DropdownMenuItem asChild><Link href={`/user/tailors/${user.seller.id}`} target="_blank"><Globe className="w-4 h-4 mr-2" /> View public storefront</Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700"><LogOut className="w-4 h-4 mr-2" /> Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto">
          {ready ? children : <PortalLoading label="Opening your seller studio…" />}
        </main>
        <footer className="py-3 text-center text-[11px] text-muted-foreground border-t border-border">AI Tailor · Seller studio</footer>
      </div>
    </div>
  )
}
