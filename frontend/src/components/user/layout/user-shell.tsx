'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Store, LogOut, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAppStore } from '@/store/app-store'
import { SidebarNav } from '@/components/shared/layout/sidebar-nav'
import { SidebarUserChip } from '@/components/shared/layout/user-chip'
import { usePortalSession } from '@/components/shared/layout/use-portal-session'
import { PortalLoading } from '@/components/shared/layout/portal-loading'
import { useLogout } from '@/components/shared/use-logout'
import { userNavGroups } from './nav'

/**
 * CUSTOMER portal shell — boutique look: the storefront navbar on top,
 * a wine/gold sidebar for the account area.
 */
export function UserShell({ children }: { children: React.ReactNode }) {
  const { ready } = usePortalSession('user')
  const cartCount = useAppStore((s) => s.cartCount)
  const unread = useAppStore((s) => s.unreadNotifications)
  const { logout, loggingOut } = useLogout('user')
  const [open, setOpen] = useState(false)
  const groups = userNavGroups(cartCount, unread)

  const footer = (
    <div className="p-3 border-t border-sidebar-border space-y-0.5">
      <Link href="/user" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white transition-all">
        <Store className="w-[18px] h-[18px]" /> Back to shop
      </Link>
      <button onClick={logout} disabled={loggingOut} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-300/80 hover:bg-red-500/10 hover:text-red-300 transition-all disabled:opacity-60">
        {loggingOut ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <LogOut className="w-[18px] h-[18px]" />} Logout
      </button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-sidebar text-sidebar-foreground sticky top-16 h-[calc(100vh-4rem)]">
          <SidebarUserChip />
          <SidebarNav groups={groups} label="Customer account navigation" />
          {footer}
        </aside>

        <div className="flex-1 min-w-0">
          {/* Mobile: drawer trigger */}
          <div className="md:hidden sticky top-16 z-30 bg-cream/90 backdrop-blur border-b border-wine-100 px-3 py-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-full border border-wine-200 bg-card text-xs font-semibold text-wine-800" aria-label="Open account menu">
                  <Menu className="w-4 h-4" /> My account
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col">
                <SheetTitle className="sr-only">Account navigation</SheetTitle>
                <SidebarUserChip />
                <SidebarNav groups={groups} onNavigate={() => setOpen(false)} label="Customer account navigation" />
                {footer}
              </SheetContent>
            </Sheet>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            {ready ? children : <PortalLoading />}
          </div>
        </div>
      </div>
    </div>
  )
}
