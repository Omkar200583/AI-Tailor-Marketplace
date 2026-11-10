'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { Order, Product, Review } from '@/types'
import { PageHeader, StatCard } from '@/components/dashboard/shell'
import { ChatPanel } from '@/components/chat/chat-panel'
import { NotificationsTab } from '@/components/dashboard/customer-dashboard'
import { SellerVerification } from '@/components/seller/verification/seller-verification'
import { SellerOrderDetails } from '@/components/seller/order-details'
import { EmptyState, SmartImage, Spinner, RatingStars, Avatar } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { inr, formatDate, timeAgo, orderStatusMeta, COMMISSION_RATE } from '@/lib/helpers'
import { cn } from '@/lib/utils'

import {
  IndianRupee, Package, ClipboardList, Star, TrendingUp, Plus, Pencil, Trash2,
  Check, X, ArrowRight, Store, MapPin, Phone, Clock, Scissors, BarChart3,
  Wallet, CheckCircle2, ImageIcon, Upload, ImagePlus,
  Navigation, Share2, ExternalLink, Search, Crosshair, Ruler,
} from 'lucide-react'

import { AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// ═══════════════ Shared image-upload helper ═══════════════
async function uploadImages(files: File[]): Promise<string[]> {
  if (!files.length) return []
  const fd = new FormData()
  files.forEach((f) => fd.append('files', f))
  const res = await fetch('/api/v1/upload', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Image upload failed')
  return (data.urls ?? []) as string[]
}

// ═══════════════ Seller overview ═══════════════
export function SellerOverview({ sellerId }: { sellerId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<{ orders: Order[] }>('/orders'),
      api<{ products: Product[] }>(`/products?sellerId=${sellerId}&limit=100`),
    ]).then(([o, p]) => { setOrders(o.orders); setProducts(p.products) }).catch(() => null).finally(() => setLoading(false))
  }, [sellerId])

  if (loading) return <Spinner />

  // FIX: count ALL requests — both paid and unpaid (seller sees them all)
  const requests = orders.filter((o) => o.status === 'REQUESTED')
  const activeJobs = orders.filter((o) => ['CONFIRMED', 'IN_PRODUCTION', 'READY'].includes(o.status))
  const paid = orders.filter((o) => o.paymentStatus === 'PAID' || o.advanceStatus === 'PAID')
  const earnings = paid.reduce((s, o) => s + (o.advancePaid || 0) + (o.finalStatus === 'PAID' ? o.remainingAmount : 0), 0)

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 86400000)
    const dayOrders = paid.filter((o) => new Date(o.createdAt).toDateString() === day.toDateString())
    return {
      day: day.toLocaleDateString('en-IN', { weekday: 'short' }),
      revenue: Math.round(dayOrders.reduce((s, o) => s + o.totalAmount, 0)),
      orders: dayOrders.length,
    }
  })

  const topProducts = [...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Net earnings" value={inr(earnings)} sub={`${Math.round((1 - COMMISSION_RATE) * 100)}% share`} accent="text-emerald-600" delay={0} />
        <StatCard icon={ClipboardList} label="New requests" value={requests.length} sub={requests.length ? 'action needed' : 'all clear'} accent={requests.length ? 'text-red-500' : 'text-wine-700'} delay={0.06} />
        <StatCard icon={Scissors} label="Active jobs" value={activeJobs.length} sub="in production" accent="text-gold-600" delay={0.12} />
        <StatCard icon={Package} label="Products" value={products.length} sub="listed" accent="text-teal-600" delay={0.18} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-card rounded-3xl border border-wine-100 p-5 shadow-sm">
          <h3 className="font-display font-bold text-wine-900 mb-4 flex items-center gap-2"><TrendingUp className="w-[18px] h-[18px] text-emerald-600" /> Revenue — last 7 days</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C2D3E" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7C2D3E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8A6F76' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8A6F76' }} axisLine={false} tickLine={false} />
                <ReTooltip contentStyle={{ borderRadius: 12, border: '1px solid #EADFDC', fontSize: 12 }} formatter={(v: number | string) => [inr(Number(v)), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#7C2D3E" strokeWidth={2.5} fill="url(#revGrad)" animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card rounded-3xl border border-wine-100 p-5 shadow-sm">
          <h3 className="font-display font-bold text-wine-900 mb-4 flex items-center gap-2"><BarChart3 className="w-[18px] h-[18px] text-gold-600" /> Top products</h3>
          {topProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Add products to see performance.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts.map((p) => ({ name: p.name.split(' ').slice(0, 2).join(' '), sold: p.soldCount }))} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#451925' }} width={86} axisLine={false} tickLine={false} />
                  <ReTooltip contentStyle={{ borderRadius: 12, border: '1px solid #EADFDC', fontSize: 12 }} />
                  <Bar dataKey="sold" fill="#D69A28" radius={[0, 8, 8, 0]} animationDuration={900} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {requests.length > 0 && (
        <div className="bg-gold-50 border border-gold-200 rounded-3xl p-5">
          <h3 className="font-display font-bold text-gold-900 flex items-center gap-2"><ClipboardList className="w-[18px] h-[18px]" /> {requests.length} order request{requests.length > 1 ? 's' : ''} awaiting your review</h3>
          <Button size="sm" onClick={() => useAppStore.getState().navigate({ name: 'dashboard', category: 'requests' })} className="mt-3 bg-gold-500 hover:bg-gold-600 text-wine-900 rounded-full font-semibold gap-1.5">
            Review now <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}


// ═══════════════ Order requests & jobs ═══════════════
export function SellerRequests({ onlyRequests = true }: { onlyRequests?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [rejecting, setRejecting] = useState<Order | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [deliverDate, setDeliverDate] = useState('')
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [stageFilter, setStageFilter] = useState<string>('all')

  const load = useCallback(() => {
    api<{ orders: Order[] }>('/orders').then((d) => setOrders(d.orders)).catch(() => null).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  async function act(order: Order, action: string, extra?: Record<string, unknown>) {
    try {
      await api(`/orders/${order.id}`, { method: 'PATCH', body: { action, ...extra } })
      toast({
        title: {
          accept: 'Order approved ✅', reject: 'Order rejected', advance: 'Status updated',
          'set-delivery': 'Delivery date set',
          'set-completion-date': 'Completion date set 📅',
          'confirm-measurements': 'Measurements confirmed 📏',
          'start-stitching': 'Stitching started 🧵',
          'mark-ready': 'Order marked ready 📦',
          'request-remaining-payment': 'Payment requested 💳',
          'mark-shipped': 'Order shipped 🚚',
          'mark-delivered': 'Order delivered 🎉',
        }[action] || 'Updated',
        description: `${order.orderNumber}`,
      })
      setRejecting(null)
      load()
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
  }

  if (loading) return <Spinner />

  // Filter: requests vs jobs, excluding cancelled/rejected
  let filtered = onlyRequests
    ? orders.filter((o) => ['REQUESTED', 'ACCEPTED'].includes(o.status))
    : orders.filter((o) => !['REQUESTED', 'ACCEPTED', 'CANCELLED', 'REJECTED'].includes(o.status))

  // Stage filter for Active Jobs view
  if (!onlyRequests && stageFilter !== 'all') {
    filtered = filtered.filter((o) => o.status === stageFilter)
  }

  // Stage counts for jobs view
  const stageCounts = onlyRequests ? null : {
    all: orders.filter((o) => !['REQUESTED', 'ACCEPTED', 'CANCELLED', 'REJECTED'].includes(o.status)).length,
    CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length,
    IN_PRODUCTION: orders.filter((o) => o.status === 'IN_PRODUCTION').length,
    READY: orders.filter((o) => o.status === 'READY').length,
    DISPATCHED: orders.filter((o) => o.status === 'DISPATCHED').length,
    DELIVERED: orders.filter((o) => o.status === 'DELIVERED').length,
  }

  if (filtered.length === 0) {
    return (
      <div className="space-y-4">
        {/* Stage filter chips for jobs view */}
        {!onlyRequests && stageCounts && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <StageChip active={stageFilter === 'all'} onClick={() => setStageFilter('all')} label="All" count={stageCounts.all} icon="📦" />
            <StageChip active={stageFilter === 'CONFIRMED'} onClick={() => setStageFilter('CONFIRMED')} label="Confirmed" count={stageCounts.CONFIRMED} icon="✓" />
            <StageChip active={stageFilter === 'IN_PRODUCTION'} onClick={() => setStageFilter('IN_PRODUCTION')} label="Stitching" count={stageCounts.IN_PRODUCTION} icon="🧵" />
            <StageChip active={stageFilter === 'READY'} onClick={() => setStageFilter('READY')} label="Ready" count={stageCounts.READY} icon="📦" />
            <StageChip active={stageFilter === 'DISPATCHED'} onClick={() => setStageFilter('DISPATCHED')} label="Shipped" count={stageCounts.DISPATCHED} icon="🚚" />
            <StageChip active={stageFilter === 'DELIVERED'} onClick={() => setStageFilter('DELIVERED')} label="Delivered" count={stageCounts.DELIVERED} icon="🎉" />
          </div>
        )}
        <EmptyState
          icon={onlyRequests ? '📥' : '🧵'}
          title={onlyRequests ? 'No pending requests' : stageFilter === 'all' ? 'No active jobs yet' : `No ${stageFilter.toLowerCase().replace('_', ' ')} orders`}
          subtitle={onlyRequests ? 'New order requests will appear here. Chat with customers before they pay the advance.' : 'Orders in production will appear here once approved and advance is paid.'}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stage filter chips for jobs view */}
      {!onlyRequests && stageCounts && (
        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          <StageChip active={stageFilter === 'all'} onClick={() => setStageFilter('all')} label="All" count={stageCounts.all} icon="📦" />
          <StageChip active={stageFilter === 'CONFIRMED'} onClick={() => setStageFilter('CONFIRMED')} label="Confirmed" count={stageCounts.CONFIRMED} icon="✓" />
          <StageChip active={stageFilter === 'IN_PRODUCTION'} onClick={() => setStageFilter('IN_PRODUCTION')} label="Stitching" count={stageCounts.IN_PRODUCTION} icon="🧵" />
          <StageChip active={stageFilter === 'READY'} onClick={() => setStageFilter('READY')} label="Ready" count={stageCounts.READY} icon="📦" />
          <StageChip active={stageFilter === 'DISPATCHED'} onClick={() => setStageFilter('DISPATCHED')} label="Shipped" count={stageCounts.DISPATCHED} icon="🚚" />
          <StageChip active={stageFilter === 'DELIVERED'} onClick={() => setStageFilter('DELIVERED')} label="Delivered" count={stageCounts.DELIVERED} icon="🎉" />
        </div>
      )}

      {filtered.map((o, idx) => {
        const meta = orderStatusMeta(o.status)
        const nextStep: Record<string, string> = {
          CONFIRMED: 'Start stitching',
          IN_PRODUCTION: 'Mark ready',
          READY: o.finalStatus === 'PAID' ? 'Mark shipped' : 'Request final payment',
          DELIVERED: 'Mark completed',
        }

        // Production stage index for progress bar (jobs view only)
        const stages = ['CONFIRMED', 'IN_PRODUCTION', 'READY', 'DISPATCHED', 'DELIVERED']
        const stageIdx = !onlyRequests ? stages.indexOf(o.status) : -1

        return (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.06, 0.3) }}
            onClick={() => setDetailsId(o.id)}
            className="bg-card rounded-2xl border border-wine-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-wine-700/10 hover:border-gold-300 transition-all"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-cream/60 to-cream/20 border-b border-wine-100/60">
              <div className="flex items-center gap-3">
                <Avatar name={o.customer?.name || 'C'} color={o.customer?.avatarColor || '#7C2D3E'} size={44} />
                <div>
                  <div className="font-bold text-sm flex items-center gap-1.5 flex-wrap">
                    {o.orderNumber}
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', meta.color)}>{meta.label}</span>
                    {o.advanceStatus !== 'PAID' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-800 border border-gold-200">Advance pending</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {o.customer?.name} · {o.customer?.phone || '—'} · {timeAgo(o.createdAt)}
                  </div>
                </div>
              </div>
              <div className="font-display font-bold text-lg text-wine-800 text-right">
                {inr(o.totalAmount)}
                <span className="block text-[10px] font-normal text-muted-foreground">you earn {inr(o.sellerEarning)}</span>
              </div>
            </div>

            {/* Production progress bar — only for jobs view */}
            {!onlyRequests && stageIdx >= 0 && (
              <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-wine-50/50 to-transparent border-b border-wine-50">
                <div className="flex items-center">
                  {[
                    { label: 'Confirmed', icon: '✓' },
                    { label: 'Stitching', icon: '🧵' },
                    { label: 'Ready', icon: '📦' },
                    { label: 'Shipped', icon: '🚚' },
                    { label: 'Delivered', icon: '🎉' },
                  ].map((step, i) => (
                    <div key={step.label} className="flex-1 flex items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={false}
                          animate={i <= stageIdx ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.4 }}
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors',
                            i < stageIdx ? 'bg-emerald-500 border-emerald-500 text-white' :
                            i === stageIdx ? 'bg-wine-700 border-wine-700 text-white shadow-lg shadow-wine-700/30' :
                            'bg-card border-wine-200 text-muted-foreground'
                          )}
                        >
                          {i < stageIdx ? '✓' : i === stageIdx ? step.icon : i + 1}
                        </motion.div>
                        <span className={cn('text-[9px] mt-1 font-medium whitespace-nowrap', i <= stageIdx ? 'text-wine-800' : 'text-muted-foreground')}>{step.label}</span>
                      </div>
                      {i < 4 && <div className={cn('flex-1 h-0.5 mx-1 -mt-4', i < stageIdx ? 'bg-emerald-500' : 'bg-wine-100')} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="p-4 space-y-2.5">
              {o.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 text-sm">
                  <div className="w-12 h-[56px] rounded-lg overflow-hidden bg-cream-dark shrink-0">
                    <SmartImage src={it.image} alt={it.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{it.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Size {it.size}{it.color && ` · ${it.color}`} · Qty {it.quantity}{it.withStitching && ' · ✂ stitched to measurements'}
                    </div>
                    {it.customization && <div className="text-xs text-gold-800 mt-0.5">📝 {it.customization}</div>}
                  </div>
                </div>
              ))}

              {/* Payment split summary */}
              <div className="grid grid-cols-3 gap-2 text-[10px] mt-2">
                <div className="bg-gold-50 border border-gold-200 rounded-lg p-2.5">
                  <div className="text-muted-foreground">Advance (25%)</div>
                  <div className="font-bold text-gold-800 text-sm">{inr(o.advanceAmount)}</div>
                  <div className={cn('font-semibold text-[9px]', o.advanceStatus === 'PAID' ? 'text-emerald-600' : 'text-red-500')}>
                    {o.advanceStatus === 'PAID' ? '✓ Paid' : 'Pending'}
                  </div>
                </div>
                <div className="bg-wine-50 border border-wine-200 rounded-lg p-2.5">
                  <div className="text-muted-foreground">Remaining (75%)</div>
                  <div className="font-bold text-wine-800 text-sm">{inr(o.remainingAmount)}</div>
                  <div className={cn('font-semibold text-[9px]', o.finalStatus === 'PAID' ? 'text-emerald-600' : 'text-red-500')}>
                    {o.finalStatus === 'PAID' ? '✓ Paid' : 'Pending'}
                  </div>
                </div>
                <div className="bg-cream rounded-lg p-2.5 border border-wine-100">
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-bold text-wine-900 text-sm">{inr(o.totalAmount)}</div>
                  <div className="text-muted-foreground text-[9px]">{o.paymentStatus}</div>
                </div>
              </div>

              {/* Address */}
              <div className="text-xs text-muted-foreground bg-cream/40 rounded-xl p-3 mt-1 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
                <span>{o.address}{o.notes && <span className="block mt-1">📝 {o.notes}</span>}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div
              className="px-4 sm:px-5 py-3.5 flex flex-wrap items-center gap-2 border-t border-wine-100/60 bg-cream/20"
              onClick={(e) => e.stopPropagation()}
            >
              {o.status === 'REQUESTED' && (
                <>
                  <Button size="sm" onClick={() => act(o, 'accept')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejecting(o)} className="rounded-full gap-1.5 border-red-200 text-red-600 hover:bg-red-50">
                    <X className="w-3.5 h-3.5" /> Reject
                  </Button>
                  {o.advanceStatus === 'UNPAID' && (
                    <span className="text-xs text-gold-700 font-medium ml-2">
                      Advance pending — customer pays after your approval
                    </span>
                  )}
                </>
              )}
              {o.status === 'ACCEPTED' && (
                <Button size="sm" onClick={() => act(o, 'confirm-measurements')} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> Confirm measurements
                </Button>
              )}
              {nextStep[o.status] && (
                <>
                  <Button size="sm" onClick={() => act(o, 'advance')} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5" /> {nextStep[o.status]}
                  </Button>
                  {['CONFIRMED', 'IN_PRODUCTION'].includes(o.status) && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="date"
                        value={deliverDate}
                        onChange={(e) => setDeliverDate(e.target.value)}
                        className="text-xs border border-wine-200 rounded-full px-3 py-1.5 bg-cream"
                        aria-label="Set delivery date"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deliverDate && act(o, 'set-completion-date', { completionDate: deliverDate })}
                        className="rounded-full text-xs"
                      >
                        Set date
                      </Button>
                    </div>
                  )}
                </>
              )}
              <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                Click card for full details →
              </span>
            </div>
          </motion.div>
        )
      })}

      {/* Reject dialog */}
      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-wine-900">Reject order?</DialogTitle>
            <DialogDescription>The customer will be notified with your reason.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. We are fully booked until next month…"
            rows={3}
            className="bg-cream border-wine-200"
          />
          <Button
            onClick={() => rejecting && act(rejecting, 'reject', { reason: rejectReason })}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-11"
          >
            Confirm rejection
          </Button>
        </DialogContent>
      </Dialog>

      {/* Full order details modal */}
      <SellerOrderDetails
        orderId={detailsId}
        open={!!detailsId}
        onClose={() => setDetailsId(null)}
        onUpdated={load}
      />
    </div>
  )
}

// Stage filter chip component
function StageChip({ active, onClick, label, count, icon }: {
  active: boolean; onClick: () => void; label: string; count: number; icon: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all',
        active ? 'bg-wine-700 text-white border-wine-700 shadow-lg shadow-wine-700/25' : 'bg-card border-wine-200 text-muted-foreground hover:border-gold-400 hover:text-wine-800'
      )}
    >
      <span>{icon}</span> {label}
      <span className={cn('ml-1 px-1.5 py-0.5 rounded-full text-[9px]', active ? 'bg-white/20' : 'bg-wine-100')}>{count}</span>
    </motion.button>
  )
}


// ═══════════════ Products manager ═══════════════
const emptyForm = {
  name: '', description: '', category: '', fabric: 'Cotton',
  price: '', stitchingPrice: '', colors: '', sizes: 'S, M, L, XL',
  deliveryDays: '7', stock: '10', customizationAvailable: true,
}

export function SellerProducts({ sellerId: propSellerId }: { sellerId: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [imageError, setImageError] = useState('')

  // Use the prop directly when available; otherwise resolve the seller from auth.
  const [authSellerId, setAuthSellerId] = useState('')
  const sellerId = propSellerId || authSellerId

  useEffect(() => {
    if (propSellerId) return
    // Fetch sellerId from auth if prop is empty (user state might not be loaded yet)
    api<{ user: { seller?: { id: string } } | null }>('/auth/me').then((d) => {
      if (d.user?.seller?.id) setAuthSellerId(d.user.seller.id)
    }).catch(() => null)
  }, [propSellerId])

  const load = useCallback(() => {
    if (!sellerId) return
    api<{ products: Product[] }>(`/products?sellerId=${sellerId}&limit=100`)
      .then((data) => setProducts(data.products || []))
      .catch((error) => {
        console.error('Failed to load seller products:', error)
        toast({ title: 'Unable to load products', description: 'Please refresh and try again.', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
  }, [sellerId])

  useEffect(() => { load() }, [load])

  function resetProductImages() {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    setSelectedImages([])
    setImagePreviews([])
    setExistingImages([])
    setImageError('')
  }

  function openCreate() {
    resetProductImages()
    setEditing(null)
    setForm({ ...emptyForm })
    setDialog(true)
  }

  function addImages(files: FileList | File[]) {
    setImageError('')
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const incoming = Array.from(files)
    const validFiles = incoming.filter((file) => {
      if (!allowedTypes.includes(file.type)) { setImageError('Only JPG, PNG and WEBP images are allowed.'); return false }
      if (file.size > 5 * 1024 * 1024) { setImageError('Each image must be smaller than 5 MB.'); return false }
      return true
    })
    const availableSlots = 5 - existingImages.length - selectedImages.length
    const accepted = validFiles.slice(0, Math.max(0, availableSlots))
    if (accepted.length < validFiles.length) setImageError('You can upload a maximum of 5 images.')
    setSelectedImages((previous) => [...previous, ...accepted])
    setImagePreviews((previous) => [...previous, ...accepted.map((file) => URL.createObjectURL(file))])
  }

  function removeSelectedImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index])
    setSelectedImages((previous) => previous.filter((_, i) => i !== index))
    setImagePreviews((previous) => previous.filter((_, i) => i !== index))
  }

  function removeExistingImage(index: number) {
    setExistingImages((previous) => previous.filter((_, i) => i !== index))
  }

  function openEdit(p: Product) {
    resetProductImages()
    setEditing(p)
    setExistingImages(p.images || [])
    const productCategory = (p as Product & { category?: string | { name?: string } }).category
    const categoryName = typeof productCategory === 'string' ? productCategory : productCategory?.name || ''
    setForm({
      name: p.name, description: p.description || '', category: categoryName,
      fabric: p.fabric || 'Cotton', price: String(p.price),
      stitchingPrice: p.stitchingPrice ? String(p.stitchingPrice) : '',
      colors: (p.colors || []).join(', '), sizes: (p.sizes || []).join(', '),
      deliveryDays: String(p.deliveryDays || 7), stock: String(p.stock ?? 0),
      customizationAvailable: p.customizationAvailable ?? true,
    })
    setDialog(true)
  }

  async function save() {
    if (!form.name.trim()) { toast({ title: 'Product name is required', variant: 'destructive' }); return }
    if (!form.category.trim()) { toast({ title: 'Category is required', variant: 'destructive' }); return }
    const productPrice = Number(form.price)
    if (!form.price || !Number.isFinite(productPrice) || productPrice <= 0) { toast({ title: 'Valid price is required', variant: 'destructive' }); return }

    setSaving(true)
    try {
      const newUrls = await uploadImages(selectedImages)
      const allImages = [...existingImages, ...newUrls]
      const body = {
        name: form.name.trim(), description: form.description.trim(),
        category: form.category.trim(), fabric: form.fabric.trim(),
        price: productPrice, stitchingPrice: Number(form.stitchingPrice || 0),
        colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        deliveryDays: Number(form.deliveryDays || 7), stock: Number(form.stock || 10),
        customizationAvailable: form.customizationAvailable, images: allImages,
      }
      if (editing) {
        await api(`/products/${editing.id}`, { method: 'PUT', body })
        toast({ title: 'Product updated ✏️' })
      } else {
        await api('/products', { method: 'POST', body })
        toast({ title: 'Product added 🎉', description: 'It is now live in the marketplace.' })
      }
      setDialog(false)
      load()
    } catch (e) {
      toast({ title: (e as Error).message || 'Failed to save product', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return
    try {
      await api(`/products/${p.id}`, { method: 'DELETE' })
      toast({ title: 'Product deleted' })
      load()
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
  }

  if (loading) return <Spinner />

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex flex-wrap gap-2.5 justify-between items-center mb-5">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your products…" className="max-w-xs h-10 bg-card border-wine-200 rounded-full" aria-label="Search products" />
        <Button onClick={openCreate} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-2 shadow-lg shadow-wine-700/25">
          <Plus className="w-4 h-4" /> Add product
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📦" title="No products yet" subtitle="List your first creation and reach thousands of customers." action={<Button onClick={openCreate} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-2"><Plus className="w-4 h-4" /> Add your first product</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-card rounded-2xl border border-wine-100 overflow-hidden shadow-sm group">
                <div className="relative aspect-[16/10] bg-cream-dark">
                  <SmartImage src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  <span className={cn('absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full', p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600')}>{p.status}</span>
                </div>
                <div className="p-4">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-display font-bold text-wine-800">{inr(p.price)}</span>
                    <span className="text-xs text-muted-foreground">{p.soldCount} sold · {p.stock} left</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="flex-1 h-8 rounded-full text-xs gap-1 border-wine-200"><Pencil className="w-3 h-3" /> Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(p)} className="h-8 rounded-full text-xs text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialog} onOpenChange={(open) => { setDialog(open); if (!open) resetProductImages() }}>
        <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto rounded-2xl border border-emerald-100 bg-[#F4FAF6] p-6 sm:p-7 shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="font-display text-2xl font-bold text-emerald-950">{editing ? 'Edit product' : 'Add new product'}</DialogTitle>
            <DialogDescription className="text-sm text-emerald-900/65">{editing ? 'Update details and photos of your creation.' : 'List a new outfit in your shop.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold text-slate-800">Product name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Royal Black Wedding Kurta" className="mt-1.5 h-11 rounded-xl border-emerald-200 bg-white/70" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-semibold text-slate-800">Product photos</Label>
                <span className="text-xs text-slate-500">{existingImages.length + selectedImages.length}/5 images</span>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { if (e.target.files) addImages(e.target.files); e.target.value = '' }} />
              {existingImages.length + selectedImages.length < 5 && (
                <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); addImages(e.dataTransfer.files) }} onClick={() => fileInputRef.current?.click()} className={cn('cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all', isDragging ? 'border-emerald-600 bg-emerald-100' : 'border-emerald-200 bg-white/60 hover:border-emerald-400 hover:bg-emerald-50')}>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Upload className="h-6 w-6" /></div>
                  <p className="mt-3 text-sm font-semibold text-emerald-950">Drag and drop your product images here</p>
                  <p className="mt-1 text-xs text-slate-500">or <span className="font-semibold text-emerald-700">browse files</span></p>
                  <p className="mt-2 text-[11px] text-slate-400">JPG, PNG or WEBP · Maximum 5 MB per image</p>
                </div>
              )}
              {(existingImages.length > 0 || imagePreviews.length > 0) && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {existingImages.map((src, index) => (
                    <div key={`existing-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-emerald-200 bg-white">
                      <img src={src} alt={`Product ${index + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(index)} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700" aria-label="Remove image"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {imagePreviews.map((src, index) => (
                    <div key={src} className="relative aspect-square overflow-hidden rounded-xl border border-emerald-200 bg-white">
                      <img src={src} alt={`New product ${index + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeSelectedImage(index)} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700" aria-label="Remove image"><X className="h-4 w-4" /></button>
                      <span className="absolute bottom-0 left-0 right-0 bg-emerald-700/90 py-1 text-center text-[10px] font-semibold text-white">New photo</span>
                    </div>
                  ))}
                </div>
              )}
              {imageError && <p className="mt-2 text-xs font-medium text-red-600">{imageError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm font-semibold text-slate-800">Category *</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Men's Wear" className="mt-1.5 h-11 rounded-xl border-emerald-200 bg-white/70" /></div>
              <div><Label className="text-sm font-semibold text-slate-800">Fabric</Label><Input value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} placeholder="Cotton, Silk" className="mt-1.5 h-11 rounded-xl border-emerald-200 bg-white/70" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm font-semibold text-slate-800">Price (₹) *</Label><Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1.5 h-11 rounded-xl border-emerald-200 bg-white/70" /></div>
              <div><Label className="text-sm font-semibold text-slate-800">Stitching price (₹)</Label><Input type="number" min="0" value={form.stitchingPrice} onChange={(e) => setForm({ ...form, stitchingPrice: e.target.value })} placeholder="Optional" className="mt-1.5 h-11 rounded-xl border-emerald-200 bg-white/70" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm font-semibold text-slate-800">Colours</Label><Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Black, Gold" className="mt-1.5 h-11 rounded-xl border-emerald-200 bg-white/70" /></div>
              <div><Label className="text-sm font-semibold text-slate-800">Sizes</Label><Input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" className="mt-1.5 h-11 rounded-xl border-emerald-200 bg-white/70" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm font-semibold text-slate-800">Delivery days</Label><Input type="number" min="0" value={form.deliveryDays} onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })} className="mt-1.5 h-11 rounded-xl border-emerald-200 bg-white/70" /></div>
              <div><Label className="text-sm font-semibold text-slate-800">Stock</Label><Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1.5 h-11 rounded-xl border-emerald-200 bg-white/70" /></div>
            </div>
            <div><Label className="text-sm font-semibold text-slate-800">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe fabric, work, fit..." rows={3} className="mt-1.5 min-h-20 rounded-xl border-emerald-200 bg-white/70" /></div>
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2"><Scissors className="h-4 w-4 text-amber-600" /><span className="text-sm font-medium text-slate-800">Customization available</span></div>
              <Switch checked={form.customizationAvailable} onCheckedChange={(v) => setForm({ ...form, customizationAvailable: v })} />
            </div>
            <Button onClick={save} disabled={saving} className="h-12 w-full rounded-xl bg-emerald-700 font-semibold text-white shadow-md hover:bg-emerald-800">{saving ? 'Saving...' : editing ? 'Save changes' : 'Add product'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════ Earnings ═══════════════
export function SellerEarnings() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api<{ orders: Order[] }>('/orders').then((d) => setOrders(d.orders)).catch(() => null).finally(() => setLoading(false)) }, [])

  if (loading) return <Spinner />

  // FIX: include orders where advance OR final has been paid (PARTIAL = advance paid, final pending)
  const paid = orders.filter((o) => o.advanceStatus === 'PAID' || o.finalStatus === 'PAID')
  const totalEarned = paid.reduce((s, o) => s + (o.advancePaid || 0) + (o.finalStatus === 'PAID' ? (o.remainingAmount || 0) : 0), 0)
  const totalCommission = Math.round(totalEarned * COMMISSION_RATE)
  // FIX: pending = orders where customer hasn't paid advance yet
  const pending = orders.filter((o) => o.advanceStatus === 'UNPAID' && ['REQUESTED', 'ACCEPTED'].includes(o.status)).reduce((s, o) => s + o.sellerEarning, 0)

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Wallet} label="Total collected" value={inr(totalEarned)} sub="advance + final" accent="text-emerald-600" delay={0} />
        <StatCard icon={IndianRupee} label="Platform commission" value={inr(totalCommission)} sub={`${Math.round(COMMISSION_RATE * 100)}% rate`} accent="text-wine-700" delay={0.07} />
        <StatCard icon={Clock} label="Awaiting advance" value={inr(pending)} sub="pending orders" accent="text-gold-600" delay={0.14} />
      </div>

      <div className="bg-card rounded-3xl border border-wine-100 p-5 shadow-sm">
        <h3 className="font-display font-bold text-wine-900 mb-4">Settlement history</h3>
        {paid.length === 0 ? (
          <p className="text-xs text-muted-foreground">No settled payments yet. Earnings appear here after customers pay.</p>
        ) : (
          <div className="space-y-2.5">
            {paid.map((o) => {
              const collected = (o.advancePaid || 0) + (o.finalStatus === 'PAID' ? (o.remainingAmount || 0) : 0)
              const sellerShare = Math.round(collected * (1 - COMMISSION_RATE))
              return (
                <div key={o.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-cream/50 border border-wine-100/60">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-[18px] h-[18px] text-emerald-600" />
                    <div>
                      <div className="text-sm font-semibold">{o.orderNumber}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDate(o.createdAt)} · {o.finalStatus === 'PAID' ? 'Fully paid' : 'Advance only'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-emerald-700">+{inr(sellerShare)}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {o.finalStatus === 'PAID' ? `of ${inr(o.sellerEarning)}` : `more ${inr(o.remainingAmount)} pending`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-4 bg-cream rounded-xl p-3 leading-relaxed">
          ℹ️ Demo settlement — production uses Razorpay/Cashfree marketplace splits with KYC-verified payouts to your bank account (T+7).
        </p>
      </div>
    </div>
  )
}

// ═══════════════ Reviews ═══════════════
export function SellerReviews() {
  const { user } = useAppStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [sellerId, setSellerId] = useState('')

  useEffect(() => {
    api<{ user: { seller?: { id: string } } | null }>('/auth/me').then((d) => {
      if (d.user?.seller?.id) {
        setSellerId(d.user.seller.id)
        api<{ reviews: Review[] }>(`/reviews?sellerId=${d.user.seller.id}`).then((r) => setReviews(r.reviews)).catch(() => null).finally(() => setLoading(false))
      } else { setLoading(false) }
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (!sellerId || reviews.length === 0) return <EmptyState icon="⭐" title="No reviews yet" subtitle="Deliver great orders to earn 5-star reviews." />

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  return (
    <div>
      <div className="flex items-center gap-4 bg-card rounded-3xl border border-wine-100 p-5 mb-5">
        <div className="text-center">
          <div className="font-display text-4xl font-bold text-wine-800">{avg.toFixed(1)}</div>
          <RatingStars rating={avg} size={13} />
          <div className="text-[10px] text-muted-foreground mt-1">{reviews.length} reviews</div>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length
            const pct = Math.round((count / reviews.length) * 100)
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-7">{star}★</span>
                <div className="flex-1 h-2 bg-wine-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full bg-gold-500 rounded-full" />
                </div>
                <span className="w-8 text-right text-muted-foreground">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-wine-100 rounded-2xl p-4 flex gap-3.5">
            <Avatar name={r.customer.name} color={r.customer.avatarColor} size={40} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{r.customer.name}</span>
                <RatingStars rating={r.rating} size={11} />
              </div>
              <p className="text-sm text-foreground/75 mt-1.5 leading-relaxed">{r.comment}</p>
              <span className="text-[10px] text-muted-foreground">{timeAgo(r.createdAt)}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════ Shop profile ═══════════════
interface SellerProfileShape {
  shopName: string
  description: string
  contactNumber: string | null
  whatsappNumber: string | null
  address: string
  city: string
  services: string[]
  specialization: string
  experienceYears: number
  availability: string
  rating: number
  ratingCount: number
  verificationStatus: string
  portfolio?: string[]
  lat?: number | null
  lng?: number | null
}

export function SellerProfileTab() {
  const [form, setForm] = useState({
    shopName: '', description: '', contactNumber: '', whatsappNumber: '',
    address: '', city: 'Pune', services: '', specialization: '',
    experienceYears: '5', availability: 'Mon-Sat, 9AM-8PM', lat: '', lng: '', locationQuery: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seller, setSeller] = useState<SellerProfileShape | null>(null)
  const [sellerId, setSellerId] = useState('')
  const [locating, setLocating] = useState(false)
  const [searching, setSearching] = useState(false)

  const shopFileRef = useRef<HTMLInputElement>(null)
  const [shopPhotos, setShopPhotos] = useState<string[]>([])
  const [newShopFiles, setNewShopFiles] = useState<File[]>([])
  const [newShopPreviews, setNewShopPreviews] = useState<string[]>([])
  const [isDraggingShop, setIsDraggingShop] = useState(false)
  const [shopImgError, setShopImgError] = useState('')

  useEffect(() => {
    api<{ user: { seller?: { id: string } } | null }>('/auth/me').then(async (d) => {
      const sid = d.user?.seller?.id
      if (sid) {
        setSellerId(sid)
        try {
          const s = await api<{ seller: SellerProfileShape }>(`/sellers/${sid}`)
          setSeller(s.seller)
          setShopPhotos(s.seller.portfolio || [])
          setForm({
            shopName: s.seller.shopName, description: s.seller.description || '',
            contactNumber: s.seller.contactNumber || '', whatsappNumber: s.seller.whatsappNumber || '',
            address: s.seller.address, city: s.seller.city,
            services: s.seller.services.join(', '), specialization: s.seller.specialization || '',
            experienceYears: String(s.seller.experienceYears), availability: s.seller.availability || '',
            lat: s.seller.lat != null ? String(s.seller.lat) : '', lng: s.seller.lng != null ? String(s.seller.lng) : '',
            locationQuery: '',
          })
        } catch { /* seller profile not yet created */ }
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  function addShopFiles(files: FileList | File[]) {
    setShopImgError('')
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    const valid = Array.from(files).filter((f) => {
      if (!allowed.includes(f.type)) { setShopImgError('Only JPG, PNG and WEBP images are allowed.'); return false }
      if (f.size > 5 * 1024 * 1024) { setShopImgError('Each image must be smaller than 5 MB.'); return false }
      return true
    })
    const slots = 8 - shopPhotos.length - newShopFiles.length
    const accepted = valid.slice(0, Math.max(0, slots))
    if (accepted.length < valid.length) setShopImgError('You can upload a maximum of 8 shop photos.')
    setNewShopFiles((p) => [...p, ...accepted])
    setNewShopPreviews((p) => [...p, ...accepted.map((f) => URL.createObjectURL(f))])
  }

  function removeNewShop(idx: number) {
    URL.revokeObjectURL(newShopPreviews[idx])
    setNewShopFiles((p) => p.filter((_, i) => i !== idx))
    setNewShopPreviews((p) => p.filter((_, i) => i !== idx))
  }

  function removeExistingShop(idx: number) {
    setShopPhotos((p) => p.filter((_, i) => i !== idx))
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) { toast({ title: 'Geolocation is not supported by your browser', variant: 'destructive' }); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }))
        setLocating(false)
        toast({ title: '📍 Location captured', description: 'Save the profile to keep these coordinates.' })
      },
      (err) => {
        setLocating(false)
        const msg = err.code === 1 ? 'Permission denied. Allow location access in your browser.'
          : err.code === 2 ? 'Position unavailable. Try searching your shop instead.'
          : 'Could not get your location. Try again.'
        toast({ title: msg, variant: 'destructive' })
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }

  function openInGoogleMaps() {
    if (!form.lat || !form.lng) return
    window.open(`https://www.google.com/maps/search/?api=1&query=${form.lat},${form.lng}`, '_blank', 'noopener')
  }

  function searchOnGoogleMaps() {
    const q = (form.locationQuery || form.address || '').trim()
    if (!q) { toast({ title: 'Type your shop name or address first', variant: 'destructive' }); return }
    setSearching(true)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank', 'noopener')
    setTimeout(() => setSearching(false), 600)
    toast({ title: 'Opened Google Maps', description: 'Right-click your shop on the map → copy coordinates → paste above.' })
  }

  async function shareLocation() {
    if (!form.lat || !form.lng || !seller) return
    const shareUrl = `https://www.google.com/maps/search/?api=1&query=${form.lat},${form.lng}`
    const shareText = `Visit ${seller.shopName} — ${seller.address || ''}`.trim()
    const shareData = { title: `${seller.shopName} — shop location`, text: shareText, url: shareUrl }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        toast({ title: '📋 Location link copied', description: 'Paste it anywhere to share your shop location.' })
      }
    } catch (e) {
      if ((e as any)?.name !== 'AbortError') toast({ title: 'Could not share location', variant: 'destructive' })
    }
  }

  async function save() {
    if (!sellerId) { toast({ title: 'Seller profile not loaded yet', variant: 'destructive' }); return }
    if (!form.shopName.trim()) { toast({ title: 'Shop name is required', variant: 'destructive' }); return }
    if (!form.address.trim()) { toast({ title: 'Shop address is required', variant: 'destructive' }); return }

    setSaving(true)
    try {
      const newUrls = await uploadImages(newShopFiles)
      const portfolio = [...shopPhotos, ...newUrls]
      const latNum = Number(form.lat)
      const lngNum = Number(form.lng)
      const hasCoords = form.lat !== '' && form.lng !== '' && Number.isFinite(latNum) && Number.isFinite(lngNum)

      await api(`/sellers/${sellerId}`, {
        method: 'PUT',
        body: {
          shopName: form.shopName.trim(), description: form.description.trim(),
          contactNumber: form.contactNumber.trim(), whatsappNumber: form.whatsappNumber.trim(),
          address: form.address.trim(), city: form.city.trim(),
          services: form.services.split(',').map((s) => s.trim()).filter(Boolean),
          specialization: form.specialization.trim(),
          experienceYears: Number(form.experienceYears) || 0,
          availability: form.availability.trim(), portfolio,
          ...(hasCoords ? { lat: latNum, lng: lngNum } : {}),
        },
      })

      setShopPhotos(portfolio)
      newShopPreviews.forEach((u) => URL.revokeObjectURL(u))
      setNewShopFiles([])
      setNewShopPreviews([])
      toast({ title: 'Shop profile saved ✅', description: 'Changes are visible to customers instantly.' })
    } catch (e) {
      toast({ title: (e as Error).message || 'Failed to save shop profile', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card rounded-3xl border border-wine-100 p-6 shadow-sm">
        <h3 className="font-display font-bold text-lg text-wine-900 mb-1">Shop profile</h3>
        <p className="text-xs text-muted-foreground mb-5">This is what customers see on your tailor profile page.</p>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-sm font-semibold">Shop name</Label><Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} className="mt-1.5 bg-cream border-wine-200" /></div>
            <div><Label className="text-sm font-semibold">Specialization</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="mt-1.5 bg-cream border-wine-200" /></div>
          </div>
          <div><Label className="text-sm font-semibold">Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1.5 bg-cream border-wine-200" /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label className="text-sm font-semibold">Contact number</Label><Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} className="mt-1.5 bg-cream border-wine-200" /></div>
            <div><Label className="text-sm font-semibold">WhatsApp number</Label><Input value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} className="mt-1.5 bg-cream border-wine-200" /></div>
          </div>
          <div><Label className="text-sm font-semibold">Shop address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5 bg-cream border-wine-200" /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><Label className="text-sm font-semibold">City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5 bg-cream border-wine-200" /></div>
            <div><Label className="text-sm font-semibold">Experience (years)</Label><Input type="number" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} className="mt-1.5 bg-cream border-wine-200" /></div>
            <div><Label className="text-sm font-semibold">Availability</Label><Input value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="mt-1.5 bg-cream border-wine-200" /></div>
          </div>
          <div><Label className="text-sm font-semibold">Services (comma separated)</Label><Input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} placeholder="Bridal Wear, Alterations" className="mt-1.5 bg-cream border-wine-200" /></div>
          <Button onClick={save} disabled={saving} className="bg-wine-700 hover:bg-wine-800 text-white rounded-xl gap-2"><Store className="w-4 h-4" /> {saving ? 'Saving…' : 'Save shop profile'}</Button>
        </div>
      </div>

      <div className="space-y-5">
        {seller && (
          <div className="bg-gradient-to-br from-wine-800 to-wine-900 rounded-3xl p-6 text-white">
            <h3 className="font-display font-bold text-lg">Verification status</h3>
            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-full px-3.5 py-2 text-sm font-semibold">
              {seller.verificationStatus === 'VERIFIED' ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified shop</> : seller.verificationStatus === 'PENDING' ? <>⏳ Pending review</> : <>❌ Rejected</>}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {seller.rating.toFixed(1)} ({seller.ratingCount} reviews)
            </div>
            {seller.verificationStatus !== 'VERIFIED' && (
              <p className="text-xs text-wine-200/80 mt-3 leading-relaxed">Complete KYC to get the verified badge — verified shops rank higher in Nearby search.</p>
            )}
          </div>
        )}
        <div className="bg-card rounded-3xl border border-wine-100 p-6">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><MapPin className="w-4 h-4 text-gold-600" /> Shop location</h3>
          {form.lat && form.lng ? (
            <div className="rounded-2xl overflow-hidden border border-wine-200">
              <iframe title="Shop location map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(form.lng) - 0.01}%2C${Number(form.lat) - 0.01}%2C${Number(form.lng) + 0.01}%2C${Number(form.lat) + 0.01}&layer=mapnik&marker=${Number(form.lat)}%2C${Number(form.lng)}`} className="w-full h-56" loading="lazy" />
            </div>
          ) : (
            <div className="h-36 rounded-2xl bg-[#EAF0E5] relative overflow-hidden flex items-center justify-center">
              <div className="text-center px-4">
                <MapPin className="w-6 h-6 text-wine-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No location set yet. Use the buttons below to pick your shop on the map.</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <Label className="text-[11px] font-semibold text-muted-foreground">Latitude</Label>
              <Input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="e.g. 18.5204" className="mt-1 h-9 text-xs bg-cream border-wine-200" />
            </div>
            <div>
              <Label className="text-[11px] font-semibold text-muted-foreground">Longitude</Label>
              <Input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="e.g. 73.8567" className="mt-1 h-9 text-xs bg-cream border-wine-200" />
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-[11px] font-semibold text-muted-foreground">Search your shop on Google Maps</Label>
            <div className="flex gap-2 mt-1">
              <Input value={form.locationQuery} onChange={(e) => setForm({ ...form, locationQuery: e.target.value })} placeholder="e.g. Sai Fashion Shop, Alandi, Pune" className="h-9 text-xs bg-cream border-wine-200" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchOnGoogleMaps() } }} />
              <Button type="button" size="sm" variant="outline" onClick={searchOnGoogleMaps} disabled={searching || !form.locationQuery.trim()} className="h-9 shrink-0 rounded-xl gap-1.5 border-wine-200"><Search className="w-3.5 h-3.5" /> Search</Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Opens Google Maps in a new tab. Right-click your shop → copy coordinates → paste above.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button type="button" size="sm" variant="outline" onClick={useMyLocation} disabled={locating} className="h-9 rounded-xl gap-1.5 border-wine-200"><Crosshair className="w-3.5 h-3.5" /> {locating ? 'Locating…' : 'Use my location'}</Button>
            <Button type="button" size="sm" onClick={shareLocation} disabled={!form.lat || !form.lng} className="h-9 rounded-xl gap-1.5 bg-gold-500 hover:bg-gold-600 text-wine-900"><Share2 className="w-3.5 h-3.5" /> Share location</Button>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={openInGoogleMaps} disabled={!form.lat || !form.lng} className="w-full mt-2 h-9 rounded-xl gap-1.5 text-wine-700 hover:bg-wine-50"><ExternalLink className="w-3.5 h-3.5" /> Open in Google Maps</Button>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Customers get walking directions from the map page.</p>
        </div>
        <div className="bg-card rounded-3xl border border-wine-100 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><ImageIcon className="w-4 h-4 text-gold-600" /> Shop photos</h3>
            <span className="text-xs text-muted-foreground">{shopPhotos.length + newShopFiles.length}/8</span>
          </div>
          <input ref={shopFileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { if (e.target.files) addShopFiles(e.target.files); e.target.value = '' }} />
          {shopPhotos.length + newShopFiles.length < 8 && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingShop(true) }}
              onDragLeave={() => setIsDraggingShop(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingShop(false); addShopFiles(e.dataTransfer.files) }}
              onClick={() => shopFileRef.current?.click()}
              className={cn('cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all', isDraggingShop ? 'border-gold-500 bg-gold-50' : 'border-wine-200 bg-cream/40 hover:border-gold-400 hover:bg-gold-50/40')}
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-gold-100 text-gold-700"><ImagePlus className="h-5 w-5" /></div>
              <p className="mt-2 text-sm font-semibold text-wine-900">Drop shop photos here</p>
              <p className="mt-1 text-xs text-muted-foreground">or <span className="font-semibold text-gold-700">browse files</span> · JPG/PNG/WEBP · 5 MB</p>
            </div>
          )}
          {(shopPhotos.length > 0 || newShopPreviews.length > 0) && (
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {shopPhotos.map((src, i) => (
                <div key={`shop-${i}`} className="relative aspect-square overflow-hidden rounded-xl border border-wine-200 bg-white">
                  <img src={src} alt={`Shop ${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeExistingShop(i)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700" aria-label="Remove photo"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {newShopPreviews.map((src, i) => (
                <div key={`newshop-${src}`} className="relative aspect-square overflow-hidden rounded-xl border border-gold-300 bg-white">
                  <img src={src} alt={`New shop ${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeNewShop(i)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700" aria-label="Remove photo"><X className="h-3.5 w-3.5" /></button>
                  <span className="absolute bottom-0 left-0 right-0 bg-gold-600/90 py-0.5 text-center text-[10px] font-semibold text-white">New</span>
                </div>
              ))}
            </div>
          )}
          {shopImgError && <p className="mt-2 text-xs font-medium text-red-600">{shopImgError}</p>}
          <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">Show your storefront, work-in-progress and finished pieces — these appear on your public tailor profile.</p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════ Seller dashboard root ═══════════════
export function SellerDashboard({ tab }: { tab: string }) {
  const user = useAppStore((s) => s.user)
  const sellerId = user?.seller?.id || ''
  const shopName = user?.seller?.shopName || user?.name

  const meta: Record<string, { title: string; subtitle: string }> = {
    overview: { title: `${shopName} 🏪`, subtitle: 'Your shop performance at a glance.' },
    products: { title: 'My Products', subtitle: 'Manage your marketplace listings.' },
    requests: { title: 'Order Requests', subtitle: 'Approve, reject and track production.' },
    jobs: { title: 'Active Jobs', subtitle: 'Track stitching, production and delivery.' },  // ← ADD THIS LINE
    messages: { title: 'Messages', subtitle: 'Talk to customers in real time.' },
    earnings: { title: 'Earnings & Settlement', subtitle: 'Transparent commission and payouts.' },
    reviews: { title: 'Customer Reviews', subtitle: 'What customers say about your work.' },
    profile: { title: 'Shop Profile', subtitle: 'Your public storefront details.' },
    verification: { title: 'Shop Verification', subtitle: 'Your verification status and what it unlocks.' },
    notifications: { title: 'Notifications', subtitle: 'Order updates, messages and platform notices.' },
  }
  const m = meta[tab] || meta.overview

   return (
    <PageHeader title={m.title} subtitle={m.subtitle}>
      {tab === 'overview' && <SellerOverview sellerId={sellerId} />}
      {tab === 'products' && <SellerProducts sellerId={sellerId} />}
      {tab === 'requests' && <SellerRequests onlyRequests />}
      {tab === 'jobs' && <SellerRequests onlyRequests={false} />}  {/* ← ADD THIS LINE */}
      {tab === 'messages' && <ChatPanel height="h-[600px]" />}
      {tab === 'earnings' && <SellerEarnings />}
      {tab === 'reviews' && <SellerReviews />}
      {tab === 'profile' && <SellerProfileTab />}
      {tab === 'verification' && <SellerVerification />}
      {tab === 'notifications' && <NotificationsTab />}
    </PageHeader>
  )
}
