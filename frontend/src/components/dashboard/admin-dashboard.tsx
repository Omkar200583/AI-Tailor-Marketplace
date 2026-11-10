'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { AdminStats, Order } from '@/types'
import { PageHeader, StatCard } from '@/components/dashboard/shell'
import { EmptyState, Spinner, Avatar, VerifiedBadge, SmartImage } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { inr, formatDate, orderStatusMeta } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import {
  Users, Store, Package, ClipboardList, Wallet, ShieldCheck, Sparkles, ScanFace,
  Check, X, Search, TrendingUp, Ban, ArrowRight, IndianRupee, CreditCard, Eye,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, AreaChart, Area, XAxis, YAxis } from 'recharts'

// Payment badge helper — handles UNPAID / PARTIAL / PAID / REFUNDED
function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: 'bg-emerald-100 text-emerald-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    UNPAID: 'bg-red-100 text-red-600',
    REFUNDED: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap', styles[status] || 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  )
}

// ═══════════════ Admin overview ═══════════════
export function AdminOverview({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
  if (loading || !stats) return <Spinner />

  const pieData = stats.categoryBreakdown.filter((c) => c.count > 0)
  const PIE_COLORS = ['#7C2D3E', '#D69A28', '#0F766E', '#9D174D', '#B45309', '#6D28D9', '#15803D']

  const revenueSeries = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 86400000)
    const dayOrders = stats.recentOrders.filter((o) => new Date(o.createdAt).toDateString() === day.toDateString())
    return { day: day.toLocaleDateString('en-IN', { weekday: 'short' }), orders: dayOrders.length }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Customers" value={stats.totalUsers} sub="registered" accent="text-wine-700" delay={0} />
        <StatCard icon={Store} label="Tailor shops" value={stats.totalSellers} sub={`${stats.pendingVerifications} pending`} accent={stats.pendingVerifications ? 'text-red-500' : 'text-emerald-600'} delay={0.06} />
        <StatCard icon={ClipboardList} label="Orders" value={stats.totalOrders} sub={`${stats.activeOrders} active`} accent="text-gold-600" delay={0.12} />
        <StatCard icon={Wallet} label="GMV collected" value={inr(stats.totalRevenue)} sub={`fee ${inr(stats.totalCommission)}`} accent="text-emerald-600" delay={0.18} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Products listed" value={stats.totalProducts} accent="text-teal-600" delay={0.22} />
        <StatCard icon={Sparkles} label="AI designs" value={stats.aiDesigns} sub="generated" accent="text-wine-700" delay={0.26} />
        <StatCard icon={ScanFace} label="Try-on sessions" value={stats.tryonSessions} accent="text-gold-600" delay={0.3} />
        <StatCard icon={TrendingUp} label="Avg order value" value={stats.totalOrders ? inr(Math.round(stats.totalRevenue / Math.max(1, stats.totalOrders))) : '—'} accent="text-emerald-600" delay={0.34} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-card rounded-3xl border border-wine-100 p-5 shadow-sm">
          <h3 className="font-display font-bold text-wine-900 mb-4 flex items-center gap-2"><TrendingUp className="w-[18px] h-[18px] text-emerald-600" /> Orders — last 7 days</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D69A28" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#D69A28" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A6F76' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8A6F76' }} axisLine={false} tickLine={false} />
                <ReTooltip contentStyle={{ borderRadius: 12, border: '1px solid #EADFDC', fontSize: 12 }} />
                <Area type="monotone" dataKey="orders" stroke="#D69A28" strokeWidth={2.5} fill="url(#ordGrad)" animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-3xl border border-wine-100 p-5 shadow-sm">
          <h3 className="font-display font-bold text-wine-900 mb-2">Catalog by category</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3} animationDuration={900}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <ReTooltip contentStyle={{ borderRadius: 12, border: '1px solid #EADFDC', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {pieData.slice(0, 5).map((c, i) => (
              <span key={c.name} className="text-[10px] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} /> {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-card rounded-3xl border border-wine-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-wine-900">Recent orders</h3>
          <Button size="sm" variant="ghost" onClick={() => useAppStore.getState().navigate({ name: 'dashboard', category: 'orders' })} className="text-wine-700 text-xs gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="space-y-2">
          {stats.recentOrders.slice(0, 5).map((o) => {
            const meta = orderStatusMeta(o.status)
            return (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-2xl bg-cream/40 border border-wine-100/50">
                <Avatar name={o.customer?.name || 'C'} color={o.customer?.avatarColor || '#7C2D3E'} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{o.orderNumber} <span className="font-normal text-muted-foreground">· {o.customer?.name}</span></div>
                  <div className="text-[11px] text-muted-foreground">
                    {o.seller?.shopName || 'Unknown shop'} · {formatDate(o.createdAt)}
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-0.5">
                  <PaymentBadge status={o.paymentStatus} />
                  <span className="text-[9px] text-muted-foreground">
                    Adv {o.advanceStatus || '—'} · Final {o.finalStatus || '—'}
                  </span>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border hidden md:inline', meta.color)}>{meta.label}</span>
                <span className="font-semibold text-sm text-wine-800">{inr(o.totalAmount)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════ Users management ═══════════════
export function AdminUsers({ stats, loading, reload }: { stats: AdminStats | null; loading: boolean; reload: () => void }) {
  const [q, setQ] = useState('')
  if (loading || !stats) return <Spinner />

  const filtered = stats.users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()))

  async function toggleActive(userId: string, current: boolean) {
    try {
      await api(`/admin/users/${userId}`, { method: 'PATCH', body: { isActive: !current } })
      toast({ title: current ? 'User deactivated 🚫' : 'User activated ✅' })
      reload()
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
  }

  return (
    <div>
      <div className="relative max-w-xs mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="w-full h-10 pl-10 pr-4 text-sm bg-card border border-wine-200 rounded-full focus:outline-none focus:ring-2 focus:ring-wine-300" aria-label="Search users" />
      </div>
      <div className="space-y-2.5">
        {filtered.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3.5 bg-card border border-wine-100 rounded-2xl p-4">
            <Avatar name={u.name} color={u.avatarColor} size={42} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold flex items-center gap-2">{u.name} {u.isVerified && <VerifiedBadge status="VERIFIED" />}</div>
              <div className="text-xs text-muted-foreground">{u.email} · {u.city || '—'}</div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold">{(u as unknown as { orderCount?: number }).orderCount || 0} orders</div>
              <div className="text-[10px] text-muted-foreground">{formatDate(u.createdAt || new Date())}</div>
            </div>
            <button
              onClick={() => toggleActive(u.id, u.isActive !== false)}
              className={cn('p-2.5 rounded-full transition-colors', u.isActive !== false ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50')}
              title={u.isActive !== false ? 'Deactivate user' : 'Activate user'}
              aria-label={u.isActive !== false ? 'Deactivate user' : 'Activate user'}
            >
              {u.isActive !== false ? <Ban className="w-[18px] h-[18px]" /> : <Check className="w-[18px] h-[18px]" />}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════ Admin Seller Details — full seller dashboard modal ═══════════════
export function AdminSellerDetails({ seller, open, onClose }: {
  seller: { id: string; shopName: string; city: string; specialization: string; rating: number; ratingCount: number; verificationStatus: string; user?: { name?: string; email?: string }; productCount?: number; description?: string } | null
  open: boolean
  onClose: () => void
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loadedSellerId, setLoadedSellerId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !seller) return
    let cancelled = false
    api<{ orders: Order[] }>('/orders').then((d) => {
      if (cancelled) return
      setOrders(d.orders.filter((o) => o.seller?.id === seller.id))
      setLoadedSellerId(seller.id)
    }).catch(() => {
      if (!cancelled) setLoadedSellerId(seller.id)
    })
    return () => { cancelled = true }
  }, [open, seller])

  if (!open || !seller) return null
  if (loadedSellerId !== seller.id) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl"><Spinner /></DialogContent>
      </Dialog>
    )
  }

  // Compute stats
  const active = orders.filter((o) => ['REQUESTED', 'ACCEPTED', 'CONFIRMED', 'IN_PRODUCTION', 'READY'].includes(o.status))
  const completed = orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status))
  const pendingPayment = orders.filter((o) => o.advanceStatus === 'UNPAID')

  // Revenue calculations
  const collectedRevenue = orders.reduce((s, o) => {
    let total = 0
    if (o.advanceStatus === 'PAID') total += o.advancePaid || o.advanceAmount || 0
    if (o.finalStatus === 'PAID') total += o.remainingAmount || 0
    return s + total
  }, 0)
  const pendingFinal = orders.filter((o) => o.advanceStatus === 'PAID' && o.finalStatus === 'UNPAID').reduce((s, o) => s + (o.remainingAmount || 0), 0)
  const advanceCollected = orders.reduce((s, o) => s + (o.advancePaid || 0), 0)
  const finalCollected = orders.filter((o) => o.finalStatus === 'PAID').reduce((s, o) => s + (o.remainingAmount || 0), 0)

  // Monthly + yearly
  const now = new Date()
  const thisYearOrders = orders.filter((o) => new Date(o.createdAt).getFullYear() === now.getFullYear())
  const thisMonthOrders = thisYearOrders.filter((o) => {
    const d = new Date(o.createdAt)
    return d.getMonth() === now.getMonth()
  })
  const yearlyRevenue = thisYearOrders.reduce((s, o) => {
    let t = 0
    if (o.advanceStatus === 'PAID') t += o.advancePaid || o.advanceAmount || 0
    if (o.finalStatus === 'PAID') t += o.remainingAmount || 0
    return s + t
  }, 0)
  const monthlyRevenue = thisMonthOrders.reduce((s, o) => {
    let t = 0
    if (o.advanceStatus === 'PAID') t += o.advancePaid || o.advanceAmount || 0
    if (o.finalStatus === 'PAID') t += o.remainingAmount || 0
    return s + t
  }, 0)

  // 6-month chart data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const monthOrders = orders.filter((o) => {
      const d = new Date(o.createdAt)
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
    })
    const rev = monthOrders.reduce((s, o) => {
      let t = 0
      if (o.advanceStatus === 'PAID') t += o.advancePaid || o.advanceAmount || 0
      if (o.finalStatus === 'PAID') t += o.remainingAmount || 0
      return s + t
    }, 0)
    return { month: month.toLocaleDateString('en-IN', { month: 'short' }), revenue: Math.round(rev), orders: monthOrders.length }
  })

  // Unique customers
  const customerMap = new Map<string, { id: string; name: string; avatarColor: string; orderCount: number; totalSpent: number }>()
  orders.forEach((o) => {
    if (o.customer?.id) {
      const existing = customerMap.get(o.customer.id)
      const spent = (o.advancePaid || 0) + (o.finalStatus === 'PAID' ? (o.remainingAmount || 0) : 0)
      if (existing) {
        existing.orderCount++
        existing.totalSpent += spent
      } else {
        customerMap.set(o.customer.id, {
          id: o.customer.id,
          name: o.customer.name || '—',
          avatarColor: o.customer.avatarColor || '#7C2D3E',
          orderCount: 1,
          totalSpent: spent,
        })
      }
    }
  })
  const customers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-wine-900 flex items-center gap-3">
            <Avatar name={seller.shopName} color="#7C2D3E" size={44} />
            <div>
              <div className="flex items-center gap-2">
                {seller.shopName}
                <VerifiedBadge status={seller.verificationStatus} />
              </div>
              <div className="text-xs text-muted-foreground font-normal">
                {seller.specialization} · {seller.city} · ⭐ {seller.rating.toFixed(1)} ({seller.ratingCount})
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            {seller.user?.name || 'Unknown'} · {seller.user?.email || 'No email'} · {seller.productCount || 0} products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-card border border-wine-100 rounded-2xl p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Total orders</div>
              <div className="font-display font-bold text-xl text-wine-800">{orders.length}</div>
            </div>
            <div className="bg-card border border-wine-100 rounded-2xl p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Completed</div>
              <div className="font-display font-bold text-xl text-emerald-600">{completed.length}</div>
            </div>
            <div className="bg-card border border-wine-100 rounded-2xl p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Active</div>
              <div className="font-display font-bold text-xl text-gold-600">{active.length}</div>
            </div>
            <div className="bg-card border border-wine-100 rounded-2xl p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Pending payment</div>
              <div className="font-display font-bold text-xl text-red-500">{pendingPayment.length}</div>
            </div>
          </div>

          {/* Revenue breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gold-50 border border-gold-200 rounded-2xl p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Advance collected</div>
              <div className="font-display font-bold text-lg text-gold-800">{inr(advanceCollected)}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Final collected</div>
              <div className="font-display font-bold text-lg text-emerald-700">{inr(finalCollected)}</div>
            </div>
            <div className="bg-wine-50 border border-wine-200 rounded-2xl p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Pending final</div>
              <div className="font-display font-bold text-lg text-red-500">{inr(pendingFinal)}</div>
            </div>
            <div className="bg-card border border-wine-100 rounded-2xl p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Total collected</div>
              <div className="font-display font-bold text-lg text-wine-800">{inr(collectedRevenue)}</div>
            </div>
          </div>

          {/* Monthly + yearly summary */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-wine-700 to-wine-900 rounded-2xl p-4 text-white">
              <div className="text-[10px] uppercase opacity-80">This month revenue</div>
              <div className="font-display font-bold text-2xl mt-1">{inr(monthlyRevenue)}</div>
              <div className="text-xs opacity-80 mt-1">{thisMonthOrders.length} orders this month</div>
            </div>
            <div className="bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl p-4 text-wine-900">
              <div className="text-[10px] uppercase opacity-80">This year revenue</div>
              <div className="font-display font-bold text-2xl mt-1">{inr(yearlyRevenue)}</div>
              <div className="text-xs opacity-80 mt-1">{thisYearOrders.length} orders this year</div>
            </div>
          </div>

          {/* 6-month revenue chart */}
          <div className="bg-card border border-wine-100 rounded-2xl p-4">
            <h4 className="text-sm font-bold text-wine-900 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Revenue — last 6 months</h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sellerRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C2D3E" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#7C2D3E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8A6F76' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8A6F76' }} axisLine={false} tickLine={false} />
                  <ReTooltip contentStyle={{ borderRadius: 12, border: '1px solid #EADFDC', fontSize: 12 }} formatter={(v: number | string) => [inr(Number(v)), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#7C2D3E" strokeWidth={2.5} fill="url(#sellerRevGrad)" animationDuration={900} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders table */}
          <div>
            <h4 className="text-sm font-bold text-wine-900 mb-3">All orders ({orders.length})</h4>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground bg-cream/30 rounded-2xl">No orders yet for this shop.</div>
            ) : (
              <div className="bg-card border border-wine-100 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0">
                    <tr className="bg-cream/60 border-b border-wine-100 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2 font-semibold">Order</th>
                      <th className="px-3 py-2 font-semibold">Customer</th>
                      <th className="px-3 py-2 font-semibold">Total</th>
                      <th className="px-3 py-2 font-semibold">Adv</th>
                      <th className="px-3 py-2 font-semibold">Final</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const meta = orderStatusMeta(o.status)
                      return (
                        <tr key={o.id} className="border-b border-wine-50 hover:bg-cream/30">
                          <td className="px-3 py-2 font-semibold">{o.orderNumber}<span className="block text-[9px] text-muted-foreground font-normal">{formatDate(o.createdAt)}</span></td>
                          <td className="px-3 py-2">{o.customer?.name}</td>
                          <td className="px-3 py-2 font-semibold text-wine-800">{inr(o.totalAmount)}</td>
                          <td className="px-3 py-2"><PaymentBadge status={o.advanceStatus || 'UNPAID'} /></td>
                          <td className="px-3 py-2"><PaymentBadge status={o.finalStatus || 'UNPAID'} /></td>
                          <td className="px-3 py-2"><span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap', meta.color)}>{meta.label}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Customers */}
          <div>
            <h4 className="text-sm font-bold text-wine-900 mb-3">Customers ({customers.length})</h4>
            {customers.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground bg-cream/30 rounded-2xl">No customers yet.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {customers.slice(0, 10).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 bg-cream/40 border border-wine-100/50 rounded-2xl p-3">
                    <Avatar name={c.name} color={c.avatarColor} size={34} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="text-xs font-semibold text-wine-700">{inr(c.totalSpent)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════ Seller verification ═══════════════
export function AdminVerification({ stats, loading, reload }: { stats: AdminStats | null; loading: boolean; reload: () => void }) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL')
  const [viewSeller, setViewSeller] = useState<any>(null)

  if (loading || !stats) return <Spinner />

  const filtered = stats.sellers.filter((s) => filter === 'ALL' || s.verificationStatus === filter)

  async function setVerification(sellerId: string, status: string) {
    try {
      await api(`/admin/sellers/${sellerId}`, { method: 'PATCH', body: { verificationStatus: status } })
      toast({ title: status === 'VERIFIED' ? 'Shop verified ✅' : status === 'REJECTED' ? 'Shop rejected' : 'Reset to pending' })
      reload()
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
  }

  return (
    <div>
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn('shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all',
              filter === f ? 'bg-wine-700 text-white border-wine-700' : 'bg-card border-wine-200 text-muted-foreground hover:border-wine-400')}
          >
            {f} {f === 'PENDING' && stats.pendingVerifications > 0 && `(${stats.pendingVerifications})`}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl border border-wine-100 p-5 shadow-sm">
            <div className="flex items-start gap-3.5">
              <Avatar name={s.shopName} color="#7C2D3E" size={48} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{s.shopName}</span>
                  <VerifiedBadge status={s.verificationStatus} />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {s.user?.name || 'Unknown user'} · {s.user?.email || 'No email'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{s.specialization} · {s.city} · {s.productCount} products · ⭐ {s.rating.toFixed(1)}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{s.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {s.verificationStatus !== 'VERIFIED' && (
                <Button size="sm" onClick={() => setVerification(s.id, 'VERIFIED')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verify shop
                </Button>
              )}
              {s.verificationStatus !== 'REJECTED' && (
                <Button size="sm" variant="outline" onClick={() => setVerification(s.id, 'REJECTED')} className="rounded-full gap-1.5 border-red-200 text-red-600 hover:bg-red-50">
                  <X className="w-3.5 h-3.5" /> Reject
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setViewSeller(s)} className="rounded-full gap-1.5 border-wine-300 text-wine-700 hover:bg-wine-50 ml-auto">
                <Store className="w-3.5 h-3.5" /> Dashboard
              </Button>
              <Button size="sm" variant="ghost" onClick={() => useAppStore.getState().navigate({ name: 'tailor', id: s.id })} className="rounded-full text-wine-700">
                View shop <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Seller dashboard modal */}
      <AdminSellerDetails seller={viewSeller} open={!!viewSeller} onClose={() => setViewSeller(null)} />
    </div>
  )
}

// ═══════════════ Admin orders ═══════════════
export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [viewOrderFull, setViewOrderFull] = useState<any>(null)

  useEffect(() => {
    let active = true
    api<{ orders: Order[] }>('/orders')
      .then((d) => {
        if (active) setOrders(d.orders)
      })
      .catch(() => null)
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function openDetails(order: Order) {
    setViewOrder(order)
    setViewOrderFull(null)
    try {
      const d = await api<{ order: any }>(`/orders/${order.id}`)
      setViewOrderFull(d.order)
    } catch (e) {
      toast({ title: 'Failed to load order details', variant: 'destructive' })
    }
  }

  if (loading) return <Spinner />
  if (orders.length === 0) return <EmptyState icon="🧾" title="No orders yet" subtitle="Orders will appear here once customers start placing them." />

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-2xl border border-wine-100 p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total orders</div>
          <div className="font-display font-bold text-xl text-wine-800">{orders.length}</div>
        </div>
        <div className="bg-card rounded-2xl border border-wine-100 p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Advance collected</div>
          <div className="font-display font-bold text-xl text-gold-700">
            {inr(orders.reduce((s, o) => s + (o.advancePaid || 0), 0))}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-wine-100 p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Final collected</div>
          <div className="font-display font-bold text-xl text-emerald-600">
            {inr(orders.filter((o) => o.finalStatus === 'PAID').reduce((s, o) => s + (o.remainingAmount || 0), 0))}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-wine-100 p-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Pending final</div>
          <div className="font-display font-bold text-xl text-red-500">
            {inr(orders.filter((o) => o.finalStatus === 'UNPAID' && o.advanceStatus === 'PAID').reduce((s, o) => s + (o.remainingAmount || 0), 0))}
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-card rounded-3xl border border-wine-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/60 border-b border-wine-100 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Tailor shop</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Advance</th>
                <th className="px-4 py-3 font-semibold">Final</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => {
                const meta = orderStatusMeta(o.status)
                return (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => openDetails(o)}
                    className="border-b border-wine-50 hover:bg-cream/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-semibold">{o.orderNumber}<span className="block text-[10px] text-muted-foreground font-normal">{formatDate(o.createdAt)}</span></td>
                    <td className="px-4 py-3">{o.customer?.name}</td>
                    <td className="px-4 py-3">{o.seller?.shopName}</td>
                    <td className="px-4 py-3 font-semibold text-wine-800">{inr(o.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold">{inr(o.advanceAmount || 0)}</span>
                        <PaymentBadge status={o.advanceStatus || 'UNPAID'} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold">{inr(o.remainingAmount || 0)}</span>
                        <PaymentBadge status={o.finalStatus || 'UNPAID'} />
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap', meta.color)}>{meta.label}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetails(o) }}
                        className="p-2 rounded-full text-wine-700 hover:bg-wine-50"
                        aria-label="View order details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order details modal */}
      <Dialog open={!!viewOrder} onOpenChange={(open) => !open && setViewOrder(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-wine-900 flex items-center gap-2">
              {viewOrder?.orderNumber}
              {viewOrder && <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', orderStatusMeta(viewOrder.status).color)}>{orderStatusMeta(viewOrder.status).label}</span>}
            </DialogTitle>
            <DialogDescription>Placed on {viewOrder ? formatDate(viewOrder.createdAt) : ''}</DialogDescription>
          </DialogHeader>

          {viewOrderFull ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cream/40 rounded-2xl p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Customer</div>
                  <div className="font-semibold">{viewOrderFull.customer?.name}</div>
                  <div className="text-xs text-muted-foreground">{viewOrderFull.customer?.email} · {viewOrderFull.customer?.phone || '—'}</div>
                </div>
                <div className="bg-cream/40 rounded-2xl p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Seller</div>
                  <div className="font-semibold">{viewOrderFull.seller?.shopName}</div>
                  <div className="text-xs text-muted-foreground">{viewOrderFull.seller?.user?.name}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Items</div>
                {viewOrderFull.items?.map((it: any) => (
                  <div key={it.id} className="flex gap-3 items-center bg-cream/40 rounded-2xl p-3">
                    <div className="w-12 h-14 rounded-lg overflow-hidden bg-cream-dark shrink-0">
                      <SmartImage src={it.image} alt={it.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{it.name}</div>
                      <div className="text-xs text-muted-foreground">Qty {it.quantity} · Size {it.size}{it.withStitching && ' · ✂ stitched'}</div>
                      {it.customization && <div className="text-xs text-gold-800 mt-0.5">📝 {it.customization}</div>}
                    </div>
                    <div className="font-bold text-wine-800">{inr(it.price * it.quantity)}</div>
                  </div>
                ))}
              </div>

              {viewOrderFull.design && (
                <div className="space-y-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Design reference</div>
                  <div className="flex gap-3 bg-cream/40 rounded-2xl p-3">
                    <img src={viewOrderFull.design.imageUrl} alt={viewOrderFull.design.title} className="w-20 h-24 rounded-lg object-cover" />
                    <div className="flex-1 text-xs space-y-0.5">
                      <div className="font-semibold text-sm">{viewOrderFull.design.title}</div>
                      {viewOrderFull.design.category && <div className="text-muted-foreground">{viewOrderFull.design.category}</div>}
                      {viewOrderFull.design.fabric && <div className="text-muted-foreground">Fabric: {viewOrderFull.design.fabric}</div>}
                    </div>
                  </div>
                </div>
              )}

              {viewOrderFull.measurements && (
                <div className="space-y-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Body measurements (snapshot)</div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs bg-cream/40 rounded-2xl p-3">
                    {Object.entries(viewOrderFull.measurements)
                      .filter(([k, v]: [string, any]) => !['id', 'orderId', 'createdAt', 'raw'].includes(k) && v != null)
                      .map(([k, v]: [string, any]) => (
                        <div key={k}>
                          <div className="text-muted-foreground capitalize">{k}</div>
                          <div className="font-semibold">{String(v)} {k === 'weight' ? 'kg' : viewOrderFull.measurements.unit}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Payment breakdown</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-cream/40 rounded-xl p-3">
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-bold text-wine-800">{inr(viewOrderFull.totalAmount)}</div>
                  </div>
                  <div className="bg-gold-50 border border-gold-200 rounded-xl p-3">
                    <div className="text-muted-foreground">Advance (25%)</div>
                    <div className="font-bold text-gold-800">{inr(viewOrderFull.advanceAmount)}</div>
                    <PaymentBadge status={viewOrderFull.advanceStatus} />
                  </div>
                  <div className="bg-wine-50 border border-wine-200 rounded-xl p-3">
                    <div className="text-muted-foreground">Remaining (75%)</div>
                    <div className="font-bold text-wine-800">{inr(viewOrderFull.remainingAmount)}</div>
                    <PaymentBadge status={viewOrderFull.finalStatus} />
                  </div>
                </div>
                {viewOrderFull.payments?.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {viewOrderFull.payments.map((p: any) => (
                      <div key={p.id} className="text-[11px] text-muted-foreground flex justify-between bg-cream/30 rounded-lg px-3 py-1.5">
                        <span>{p.kind} · {p.method || '—'} · {p.razorpayPaymentId?.slice(-8) || '—'}</span>
                        <span className={p.status === 'SUCCESS' ? 'text-emerald-600 font-semibold' : 'text-red-500'}>
                          {p.status} · {inr(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {viewOrderFull.statusHistory?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Status history</div>
                  <div className="bg-cream/40 rounded-2xl p-3 space-y-2 max-h-40 overflow-y-auto">
                    {viewOrderFull.statusHistory.map((h: any, i: number) => (
                      <div key={i} className="text-xs flex gap-2">
                        <span className="font-semibold text-wine-700 whitespace-nowrap">{formatDate(h.createdAt)}</span>
                        <span className="text-muted-foreground">{h.note || h.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Delivery address</div>
                <div className="bg-cream/40 rounded-2xl p-3 text-xs text-muted-foreground">{viewOrderFull.address}</div>
              </div>
            </div>
          ) : (
            <div className="py-12 flex items-center justify-center"><Spinner /></div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════ Commission ═══════════════
export function AdminCommission({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
  if (loading || !stats) return <Spinner />
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Wallet} label="Total GMV" value={inr(stats.totalRevenue)} sub="paid orders" accent="text-wine-700" delay={0} />
        <StatCard icon={IndianRupee} label="Platform commission" value={inr(stats.totalCommission)} sub="5% flat" accent="text-gold-600" delay={0.07} />
        <StatCard icon={Store} label="Seller earnings" value={inr(Math.max(0, stats.totalRevenue - stats.totalCommission))} sub="payable" accent="text-emerald-600" delay={0.14} />
      </div>

      <div className="bg-card rounded-3xl border border-wine-100 p-6 shadow-sm">
        <h3 className="font-display font-bold text-wine-900 mb-1">Commission policy</h3>
        <p className="text-xs text-muted-foreground mb-5">Platform fee applied per settled order. Adjust rules as business needs evolve.</p>
        <div className="space-y-3">
          {[
            { label: 'Platform commission', value: '5%', desc: 'Flat rate on order value' },
            { label: 'Payment gateway', value: '~2%', desc: 'Razorpay standard, passed to settlement' },
            { label: 'GST', value: 'As applicable', desc: 'Marketplace GST rules per govt. norms' },
            { label: 'Seller payout cycle', value: 'T+7', desc: 'After delivery confirmation' },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between p-4 rounded-2xl bg-cream/50 border border-wine-100/60">
              <div>
                <div className="text-sm font-semibold">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
              <span className="font-display font-bold text-wine-800">{r.value}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-4 bg-gold-50 border border-gold-200 rounded-xl p-3 leading-relaxed">
          ⚠️ Demo figures — production commission, GST and gateway charges must follow commercial &amp; legal requirements.
        </p>
      </div>
    </div>
  )
}

// ═══════════════ AI monitoring ═══════════════
export function AdminAiMonitoring({ stats, loading }: { stats: AdminStats | null; loading: boolean }) {
  if (loading || !stats) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Sparkles} label="Designs generated" value={stats.aiDesigns} sub="all users" accent="text-wine-700" delay={0} />
        <StatCard icon={ScanFace} label="Try-on sessions" value={stats.tryonSessions} sub="all users" accent="text-gold-600" delay={0.07} />
        <StatCard icon={Users} label="AI adoption" value={`${stats.totalUsers ? Math.round((stats.aiDesigns / stats.totalUsers) * 100) : 0}%`} sub="designs / user" accent="text-teal-600" delay={0.14} />
        <StatCard icon={Wallet} label="AI compute est." value={inr(stats.aiDesigns * 3)} sub="~₹3 per render" accent="text-wine-700" delay={0.21} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-3xl border border-wine-100 p-5 shadow-sm">
          <h3 className="font-display font-bold text-wine-900 mb-3">AI module health</h3>
          <div className="space-y-3">
            {[
              { name: 'Design Generator', status: 'Operational', latency: '8.2s', color: 'bg-emerald-500' },
              { name: 'Virtual Try-On', status: 'Operational', latency: '12.6s', color: 'bg-emerald-500' },
              { name: 'Recommendation Engine', status: 'Operational', latency: '90ms', color: 'bg-emerald-500' },
              { name: 'Fashion Assistant', status: 'Operational', latency: '1.8s', color: 'bg-emerald-500' },
            ].map((m) => (
              <div key={m.name} className="flex items-center justify-between p-3.5 rounded-2xl bg-cream/40 border border-wine-100/50">
                <div className="flex items-center gap-2.5">
                  <span className={cn('w-2 h-2 rounded-full', m.color, 'animate-pulse')} />
                  <span className="text-sm font-semibold">{m.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">{m.status} · {m.latency} avg</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-3xl border border-wine-100 p-5 shadow-sm">
          <h3 className="font-display font-bold text-wine-900 mb-3">Usage notes</h3>
          <ul className="text-xs text-muted-foreground space-y-2.5 leading-relaxed">
            <li className="flex gap-2"><span>🖼️</span> Generated designs are stored in private storage with signed URLs.</li>
            <li className="flex gap-2"><span>🔐</span> Customer photos require explicit consent before any AI use.</li>
            <li className="flex gap-2"><span>💸</span> GPU inference runs on a dedicated service (RunPod/GPU cloud) — keep Node &amp; AI layers separate.</li>
            <li className="flex gap-2"><span>📊</span> Rate limits prevent abuse: 20 designs/user/day in production.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ═══════════════ Admin dashboard root ═══════════════
export function AdminDashboard({ tab }: { tab: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api<AdminStats>('/admin/stats').then(setStats).catch(() => null).finally(() => setLoading(false))
  }
  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [])

  const meta: Record<string, { title: string; subtitle: string }> = {
    overview: { title: 'Platform Overview', subtitle: 'Everything happening across AI Tailor, live.' },
    users: { title: 'User Management', subtitle: 'Customers & designers on the platform.' },
    sellers: { title: 'Seller Verification', subtitle: 'Approve or reject tailor shops.' },
    orders: { title: 'All Orders', subtitle: 'Monitor the complete order flow with payment breakdown.' },
    commission: { title: 'Commission & Payouts', subtitle: 'Revenue split and settlement policy.' },
    ai: { title: 'AI Monitoring', subtitle: 'AI engine usage and health.' },
  }
  const m = meta[tab] || meta.overview

  return (
    <PageHeader title={m.title} subtitle={m.subtitle}>
      {tab === 'overview' && <AdminOverview stats={stats} loading={loading} />}
      {tab === 'users' && <AdminUsers stats={stats} loading={loading} reload={load} />}
      {tab === 'sellers' && <AdminVerification stats={stats} loading={loading} reload={load} />}
      {tab === 'orders' && <AdminOrders />}
      {tab === 'commission' && <AdminCommission stats={stats} loading={loading} />}
      {tab === 'ai' && <AdminAiMonitoring stats={stats} loading={loading} />}
    </PageHeader>
  )
}
