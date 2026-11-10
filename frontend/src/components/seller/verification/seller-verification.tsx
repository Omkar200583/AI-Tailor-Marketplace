'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BadgeCheck, CheckCircle2, Circle, Clock, XCircle, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api-client'
import { useAppStore } from '@/store/app-store'
import { Spinner } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Seller } from '@/types'

const STATUS = {
  VERIFIED: { icon: BadgeCheck, title: 'Your shop is verified', tone: 'from-emerald-700 to-emerald-900', text: 'Customers see the verified badge on your shop, and your listings rank higher in nearby-tailor search.' },
  PENDING: { icon: Clock, title: 'Verification in review', tone: 'from-amber-600 to-amber-800', text: 'Our team reviews every new shop. You can already prepare your shop profile and products while you wait.' },
  REJECTED: { icon: XCircle, title: 'Verification was not approved', tone: 'from-red-700 to-red-900', text: 'Update your shop details below and contact support — an admin can reset your status for another review.' },
} as const

/**
 * Seller verification status page.
 * Read-only: verification decisions are made by admins through
 * PATCH /api/v1/admin/sellers/:id. There is no document-upload endpoint yet,
 * so this page shows status + a profile-completeness checklist only.
 */
export function SellerVerification() {
  const sellerId = useAppStore((s) => s.user?.seller?.id)
  const [seller, setSeller] = useState<(Seller & { completedOrders?: number }) | null>(null)
  const [productCount, setProductCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sellerId) { setLoading(false); return }
    api<{ seller: Seller & { completedOrders?: number }; products: unknown[] }>(`/sellers/${sellerId}`)
      .then((d) => { setSeller(d.seller); setProductCount(d.products.length) })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [sellerId])

  if (loading) return <Spinner />
  if (error || !seller) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 text-red-800 p-5 text-sm">{error || 'We could not find your shop profile.'}</div>

  const meta = STATUS[seller.verificationStatus] || STATUS.PENDING
  const checklist = [
    { label: 'Shop name added', done: !!seller.shopName },
    { label: 'Shop description (20+ characters)', done: (seller.description || '').trim().length >= 20 },
    { label: 'Contact number', done: !!seller.contactNumber },
    { label: 'Full shop address', done: (seller.address || '').trim().length > 5 },
    { label: 'At least 2 services listed', done: (seller.services || []).length >= 2 },
    { label: 'At least 1 active product', done: productCount > 0 },
  ]
  const doneCount = checklist.filter((c) => c.done).length

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-3xl bg-gradient-to-br text-white p-6 sm:p-8 flex gap-5 items-start', meta.tone)}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0"><meta.icon className="w-7 h-7" /></div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/70">{seller.verificationStatus}</div>
          <h2 className="font-display text-2xl font-bold mt-1">{meta.title}</h2>
          <p className="text-sm text-white/85 mt-2 max-w-xl leading-relaxed">{meta.text}</p>
        </div>
      </motion.div>

      <div className="bg-card rounded-3xl border border-wine-100 p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display font-bold text-lg text-wine-900">Profile checklist</h3>
          <span className="text-xs font-semibold text-muted-foreground">{doneCount}/{checklist.length} complete</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-wine-50 overflow-hidden" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={checklist.length} aria-label="Profile completeness">
          <div className="h-full bg-wine-600 transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
        </div>
        <ul className="mt-5 space-y-2.5">
          {checklist.map((c) => (
            <li key={c.label} className="flex items-center gap-3 text-sm">
              {c.done ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <Circle className="w-5 h-5 text-muted-foreground/50 shrink-0" />}
              <span className={cn(!c.done && 'text-muted-foreground')}>{c.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-2"><Link href="/seller/shop">Edit shop profile <ArrowRight className="w-4 h-4" /></Link></Button>
          <Button asChild variant="outline" className="rounded-full border-wine-300 text-wine-800"><Link href="/seller/products">Manage products</Link></Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Verification is decided by the AI Tailor admin team. KYC document upload is not available in this version of the platform, so no documents are collected here.
      </p>
    </div>
  )
}
