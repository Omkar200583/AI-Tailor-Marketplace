'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Loader2, LogOut, Menu, ShieldCheck } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/common/ui-bits'
import { api } from '@/lib/api-client'
import { SidebarNav } from '@/components/shared/layout/sidebar-nav'
import { usePortalSession } from '@/components/shared/layout/use-portal-session'
import { PortalLoading } from '@/components/shared/layout/portal-loading'
import { findActiveNav } from '@/components/shared/layout/types'
import { usePortalTheme } from '@/components/shared/use-portal-theme'
import { useLogout } from '@/components/shared/use-logout'
import { adminNavGroups } from './nav'

/**
 * ADMIN portal shell — SaaS control room: slate sidebar, compact navigation
 * with section labels, breadcrumb top bar and a pending-verification badge.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  usePortalTheme('theme-admin')
  const { user, ready } = usePortalSession('admin')
  const pathname = usePathname()
  const { logout, loggingOut } = useLogout('admin')
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    if (!ready) return
    api<{ pendingVerifications: number }>('/admin/stats').then((d) => setPending(d.pendingVerifications || 0)).catch(() => null)
  }, [ready])

  const groups = adminNavGroups(pending)
  const active = findActiveNav(groups, pathname)

  const brand = (
    <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border shrink-0" aria-label="AI Tailor admin dashboard">
      <span className="w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></span>
      <span className="leading-tight">
        <span className="block font-display font-bold text-white text-base">AI Tailor</span>
        <span className="block text-[9px] uppercase tracking-[0.22em] text-sidebar-primary font-semibold">Admin console</span>
      </span>
    </Link>
  )
  const logoutBtn = (
    <div className="p-3 border-t border-sidebar-border">
      <button onClick={logout} disabled={loggingOut} className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-[13px] font-medium text-red-300/80 hover:bg-red-500/10 hover:text-red-300 transition-all disabled:opacity-60">
        {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} Logout
      </button>
    </div>
  )

  return (
    <div className="theme-admin min-h-screen flex bg-background text-foreground">
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar text-sidebar-foreground sticky top-0 h-screen">
        {brand}
        <SidebarNav groups={groups} dense label="Admin navigation" />
        {logoutBtn}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 h-14 bg-card border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-wine-50" aria-label="Open navigation menu"><Menu className="w-5 h-5 text-wine-800" /></button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              {brand}
              <SidebarNav groups={groups} dense onNavigate={() => setOpen(false)} label="Admin navigation" />
              {logoutBtn}
            </SheetContent>
          </Sheet>

          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-muted-foreground">Admin</span>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-semibold text-wine-900 truncate">{active?.label || 'Console'}</span>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live data
            </span>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-border hover:bg-wine-50 transition-colors" aria-label="Account menu">
                    <Avatar name={user.name} color={user.avatarColor} size={28} />
                    <span className="hidden sm:block text-xs font-semibold">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-wine-700 mt-1">Administrator</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700"><LogOut className="w-4 h-4 mr-2" /> Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          {ready ? children : <PortalLoading label="Loading admin console…" />}
        </main>
      </div>
    </div>
  )
}
