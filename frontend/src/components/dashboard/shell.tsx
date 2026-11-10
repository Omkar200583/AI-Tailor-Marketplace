'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import type { LucideIcon } from 'lucide-react'

/**
 * Page chrome shared by every dashboard page.
 *
 * The navigation shell (navbar / sidebar / mobile drawer) now lives in the
 * role-specific portal layouts:
 *   components/user/layout/user-shell.tsx
 *   components/seller/layout/seller-shell.tsx
 *   components/admin/layout/admin-shell.tsx
 * This component only renders the animated page title + content.
 */
export function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-wine-900">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      {children}
    </motion.div>
  )
}

// Small stat card used across dashboards
export function StatCard({ icon: Icon, label, value, sub, accent = 'text-wine-700', delay = 0, href }: {
  icon: LucideIcon
  label: string
  value: string | number
  sub?: string
  accent?: string
  delay?: number
  href?: string
}) {
  const go = useAppStore((s) => s.go)
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
      onClick={href ? () => go(href) : undefined}
      className={cn('bg-card rounded-2xl border border-wine-100 p-5 shadow-sm hover:shadow-lg transition-shadow', href ? 'cursor-pointer' : 'cursor-default')}
    >
      <div className="flex items-center justify-between">
        <div className={cn('w-10 h-10 rounded-xl bg-cream border border-wine-100 flex items-center justify-center', accent)}>
          <Icon className="w-5 h-5" />
        </div>
        {sub && <span className="text-[10px] font-semibold text-muted-foreground bg-cream px-2 py-1 rounded-full">{sub}</span>}
      </div>
      <div className="mt-3 font-display text-2xl font-bold text-wine-900">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </motion.div>
  )
}
