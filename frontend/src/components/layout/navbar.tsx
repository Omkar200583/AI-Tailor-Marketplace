'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Avatar } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { api } from '@/lib/api-client'
import { Menu, ShoppingBag, Sparkles, Shirt, MapPin, Palette, Users, Home, LayoutDashboard, Bell, LogOut, ScanFace } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const { user, view, navigate, cartCount, unreadNotifications, setUser, setAuthOpen } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { label: 'Home', view: { name: 'home' as const }, icon: Home },
    { label: 'Explore', view: { name: 'explore' as const }, icon: Shirt },
    { label: 'Categories', view: { name: 'categories' as const }, icon: LayoutDashboard },
    { label: 'AI Studio', view: { name: 'ai-studio' as const }, icon: Sparkles },
    { label: 'Virtual Try-On', view: { name: 'tryon' as const }, icon: ScanFace },
    { label: 'Find Tailors', view: { name: 'find-tailors' as const }, icon: MapPin },
    { label: 'Designers', view: { name: 'designers' as const }, icon: Palette },
  ]

  const isActive = (name: string) => view.name === name || (name === 'explore' && view.name === 'product') || (name === 'find-tailors' && view.name === 'tailor')

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => null)
    setUser(null)
    navigate({ name: 'auth' }) // → /user/login
  }

  function goDashboard() {
    if (user) navigate({ name: 'dashboard' })
    else setAuthOpen(true)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-wine-100/60 bg-cream/85 backdrop-blur-xl supports-[backdrop-filter]:bg-cream/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-2.5 shrink-0 group" aria-label="AI Tailor home">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-wine-700 to-wine-500 flex items-center justify-center shadow-lg shadow-wine-700/20"
            >
              <Sparkles className="w-5 h-5 text-gold-300" />
            </motion.div>
            <div className="text-left leading-none">
              <div className="font-display font-bold text-xl text-wine-800">AI Tailor</div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-gold-700 font-semibold">stitch your imagination</div>
            </div>
          </button>

          {/* Desktop links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {links.map((l) => (
              <button
                key={l.label}
                onClick={() => navigate(l.view)}
                className={cn(
                  'relative px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive(l.view.name) ? 'text-wine-800' : 'text-foreground/70 hover:text-wine-800 hover:bg-wine-50'
                )}
              >
                {l.label}
                {isActive(l.view.name) && (
                  <motion.span layoutId="nav-pill" className="absolute inset-x-2 -bottom-[13px] h-[3px] bg-gradient-to-r from-wine-600 to-gold-500 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {user && (
              <>
                <button
                  onClick={() => navigate({ name: 'dashboard', category: 'cart' })}
                  className="relative p-2.5 rounded-full hover:bg-wine-50 transition-colors"
                  aria-label={`Cart with ${cartCount} items`}
                >
                  <ShoppingBag className="w-5 h-5 text-wine-800" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-gold-500 text-white text-[10px] font-bold flex items-center justify-center shadow"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <button
                  onClick={goDashboard}
                  className="relative p-2.5 rounded-full hover:bg-wine-50 transition-colors hidden sm:block"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-wine-800" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-gold-500 border-2 border-cream" />
                  )}
                </button>
              </>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-wine-200 hover:ring-gold-400 transition-all" aria-label="Account menu">
                    <Avatar name={user.name} color={user.avatarColor} size={36} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gold-700 mt-1">{user.role}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={goDashboard}>
                    <LayoutDashboard className="w-4 h-4 mr-2" /> My Dashboard
                  </DropdownMenuItem>
                  {user.role === 'CUSTOMER' && (
                    <DropdownMenuItem onClick={() => navigate({ name: 'dashboard', category: 'measurements' })}>
                      <Users className="w-4 h-4 mr-2" /> Body Measurements
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" onClick={() => setAuthOpen(true)} className="text-wine-800 hover:bg-wine-50">
                  Login
                </Button>
                <Button
                  onClick={() => navigate({ name: 'register' })}
                  className="bg-wine-700 hover:bg-wine-800 text-white shadow-lg shadow-wine-700/25 rounded-full"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2.5 rounded-lg hover:bg-wine-50" aria-label="Open menu">
                  <Menu className="w-5 h-5 text-wine-800" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-cream">
                <SheetTitle className="font-display text-wine-800 text-xl">AI Tailor</SheetTitle>
                <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile navigation">
                  {links.map((l) => (
                    <button
                      key={l.label}
                      onClick={() => { navigate(l.view); setMobileOpen(false) }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                        isActive(l.view.name) ? 'bg-wine-700 text-white' : 'text-foreground/80 hover:bg-wine-50'
                      )}
                    >
                      <l.icon className="w-4 h-4" /> {l.label}
                    </button>
                  ))}
                  <div className="my-3 border-t border-wine-100" />
                  {user ? (
                    <>
                      <button onClick={() => { goDashboard(); setMobileOpen(false) }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/80 hover:bg-wine-50 text-left">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </button>
                      <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 text-left">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </>
                  ) : (
                    <Button onClick={() => { setAuthOpen(true); setMobileOpen(false) }} className="bg-wine-700 hover:bg-wine-800 text-white mt-2">
                      Login / Register
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
