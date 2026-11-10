'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePortalTheme } from '@/components/shared/use-portal-theme'
import type { LucideIcon } from 'lucide-react'

/**
 * Split-screen frame for every auth page. Each portal passes its own
 * theme class, icon and selling points so the three entrances feel distinct.
 */
export function AuthFrame({
  themeClass,
  icon: Icon,
  brandLine,
  headline,
  points,
  title,
  subtitle,
  children,
  footer,
  homeHref = '/',
}: {
  themeClass?: 'theme-seller' | 'theme-admin'
  icon: LucideIcon
  brandLine: string
  headline: string
  points: string[]
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
  homeHref?: string
}) {
  usePortalTheme(themeClass || null)
  return (
    <div className={`${themeClass || ''} min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background text-foreground`}>
      {/* Brand panel */}
      <aside className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-wine-800 via-wine-700 to-wine-900 text-white p-12 flex-col justify-between">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full border-[3px] border-dashed border-white/15" />
        <div className="absolute -bottom-28 -left-16 w-96 h-96 rounded-full border-[3px] border-dotted border-white/10" />
        <Link href={homeHref} className="relative flex items-center gap-3 w-fit" aria-label="AI Tailor home">
          <span className="w-11 h-11 rounded-xl bg-gold-500 text-wine-900 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
          <span className="leading-tight">
            <span className="block font-display text-2xl font-bold">AI Tailor</span>
            <span className="block text-[10px] uppercase tracking-[0.24em] text-gold-300 font-semibold">{brandLine}</span>
          </span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">{headline}</h2>
          <ul className="mt-6 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex gap-3 text-sm text-white/85 leading-relaxed"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />{p}</li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} AI Tailor Platform</p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link href={homeHref} className="lg:hidden flex items-center gap-2.5 mb-8 w-fit" aria-label="AI Tailor home">
            <span className="w-10 h-10 rounded-xl bg-wine-700 text-gold-300 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
            <span className="font-display text-xl font-bold text-wine-800">AI Tailor</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-wine-900">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-sm text-center text-muted-foreground">{footer}</div>}
        </motion.div>
      </main>
    </div>
  )
}
