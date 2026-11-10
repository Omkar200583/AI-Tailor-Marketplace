'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import { CheckoutFlow } from '@/components/checkout/checkout-flow'
import type { Order, CartItem, BodyProfile, Design, TryonSession, Notification, Product } from '@/types'
import { PageHeader, StatCard } from '@/components/dashboard/shell'
import { ChatPanel } from '@/components/chat/chat-panel'
import { EmptyState, SmartImage, Spinner, RatingStars, Avatar } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { inr, formatDate, timeAgo, orderStatusMeta } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import {
  ShoppingBag, Wallet, Ruler, Heart, Sparkles, ScanFace, Bell, ArrowRight,
  CreditCard, Package, X, Plus, Minus, Trash2, Save, CheckCircle2, Clock, Truck, Star,
  Share2,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
// Shared helper components (used by DesignsTab + TryonHistoryTab)
// ═══════════════════════════════════════════════════════════════

// Seller picker dialog — reusable "share with a tailor" modal
function SellerPickerDialog({ open, onClose, onPick }: {
  open: boolean
  onClose: () => void
  onPick: (sellerId: string, shopName: string) => void
}) {
  const [sellers, setSellers] = useState<{ id: string; shopName: string; city: string; rating: number; specialization: string; verificationStatus: string }[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    api<{ sellers: any[] }>('/sellers?limit=50')
      .then((d) => setSellers(d.sellers || []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [open])

  const filtered = sellers.filter((s) =>
    s.shopName.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase()) ||
    s.specialization.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-wine-900">Share with a tailor</DialogTitle>
          <DialogDescription>Pick a tailor to share this with. A chat will open automatically.</DialogDescription>
        </DialogHeader>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by shop, city, or specialty…"
          className="bg-cream border-wine-200 rounded-full"
        />
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading tailors…</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No tailors found. Try a different search.</div>
        ) : (
          <div className="space-y-2 mt-2">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => { onPick(s.id, s.shopName); onClose() }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-wine-100 hover:border-gold-400 hover:bg-gold-50/40 transition-all text-left"
              >
                <Avatar name={s.shopName} color="#7C2D3E" size={40} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    {s.shopName}
                    {s.verificationStatus === 'VERIFIED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.specialization} · {s.city}</div>
                </div>
                <div className="text-xs font-semibold text-gold-700 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {s.rating?.toFixed(1) || '0.0'}
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Full-size design preview modal
function DesignPreviewModal({ design, onClose }: { design: Design | null; onClose: () => void }) {
  if (!design) return null
  return (
    <Dialog open={!!design} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="aspect-[3/4] bg-cream-dark">
          <img src={design.imageUrl} alt={design.title} className="w-full h-full object-contain" />
        </div>
        <div className="p-5 space-y-2">
          <div className="font-display font-bold text-lg text-wine-900">{design.title}</div>
          <div className="text-xs text-muted-foreground">{design.category} · {formatDate(design.createdAt)}</div>
          {design.fabric && <div className="text-xs text-muted-foreground">Fabric: {design.fabric}</div>}
          {design.colors?.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Colors:</span>
              {design.colors.map((c) => (
                <span key={c} className="px-2 py-0.5 bg-cream rounded-full border border-wine-100">{c}</span>
              ))}
            </div>
          )}
          <span className={cn('inline-block text-[10px] font-bold px-2 py-0.5 rounded-full',
            design.status === 'SENT_TO_TAILOR' ? 'bg-emerald-100 text-emerald-700'
              : design.status === 'SAVED' ? 'bg-gold-100 text-gold-800'
              : 'bg-wine-100 text-wine-800')}>
            {design.status === 'SENT_TO_TAILOR' ? '✓ Sent to tailor' : design.status === 'SAVED' ? '★ Saved' : '✨ Generated'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Try-on before/after preview modal
function TryonPreviewModal({ session, onClose }: { session: TryonSession | null; onClose: () => void }) {
  if (!session) return null
  return (
    <Dialog open={!!session} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="p-5 pb-3">
          <div className="font-display font-bold text-lg text-wine-900">{session.productName}</div>
          <div className="text-xs text-muted-foreground">{formatDate(session.createdAt)}</div>
        </div>
        <div className="grid grid-cols-2 gap-1 px-5 pb-5">
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Original Product</div>
            <div className="aspect-[3/4] bg-cream-dark rounded-xl overflow-hidden">
              <img src={session.productImage} alt="Original" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gold-700 mb-1.5 uppercase tracking-wide">Try-On Result</div>
            <div className="aspect-[3/4] bg-cream-dark rounded-xl overflow-hidden ring-2 ring-gold-300">
              <img src={session.resultImage} alt="Try-on result" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════ Orders list (customer) ═══════════════
// ═══════════════ Orders list (customer) ═══════════════
export function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [payOrder, setPayOrder] = useState<Order | null>(null)
  const [paying, setPaying] = useState(false)
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const load = useCallback(() => {
    api<{ orders: Order[] }>('/orders').then((d) => setOrders(d.orders)).catch(() => null).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  async function orderAction(order: Order, action: string) {
    try {
      await api(`/orders/${order.id}`, { method: 'PATCH', body: { action } })
      toast({ title: action === 'cancel' ? 'Order cancelled' : 'Done', description: `${order.orderNumber} updated.` })
      setPayOrder(null)
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  // Pay 25% advance — called when customer clicks "Pay advance" on an unpaid order
  async function payAdvance() {
    if (!payOrder) return
    setPaying(true)
    try {
      const init = await api<{ orderId: string; razorpayOrderId: string; amount: number; currency: string }>(`/orders/${payOrder.id}/pay-advance`, { method: 'POST' })

      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) return resolve()
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
        document.body.appendChild(s)
      })

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(init.amount * 100),
        currency: init.currency,
        order_id: init.razorpayOrderId,
        name: 'AI Tailor Marketplace',
        description: `25% advance for ${payOrder.orderNumber}`,
        prefill: { name: useAppStore.getState().user?.name, email: useAppStore.getState().user?.email },
        handler: async (resp: any) => {
          try {
            await api('/checkout/verify', {
              method: 'POST',
              body: {
                orderId: payOrder.id,
                razorpayOrderId: init.razorpayOrderId,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
                kind: 'ADVANCE',
              },
            })
            toast({ title: 'Advance payment successful! 🎉', description: 'The seller can now start production.' })
            setPayOrder(null)
            load()
          } catch (e) {
            toast({ title: 'Verification failed', description: (e as Error).message, variant: 'destructive' })
          }
        },
        theme: { color: '#7C2D3E' },
      })
      rzp.open()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setPaying(false)
    }
  }

  // Pay remaining 75% — called when customer clicks "Pay remaining" on a READY order
  async function payRemaining() {
    if (!payOrder) return
    setPaying(true)
    try {
      const init = await api<{ orderId: string; razorpayOrderId: string; amount: number; currency: string }>(`/orders/${payOrder.id}/pay-remaining`, { method: 'POST' })

      await new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) return resolve()
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
        document.body.appendChild(s)
      })

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(init.amount * 100),
        currency: init.currency,
        order_id: init.razorpayOrderId,
        name: 'AI Tailor Marketplace',
        description: `Remaining payment for ${payOrder.orderNumber}`,
        prefill: { name: useAppStore.getState().user?.name, email: useAppStore.getState().user?.email },
        handler: async (resp: any) => {
          try {
            await api('/checkout/verify', {
              method: 'POST',
              body: {
                orderId: payOrder.id,
                razorpayOrderId: init.razorpayOrderId,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
                kind: 'FINAL',
              },
            })
            toast({ title: 'Final payment successful! 🎉', description: payOrder.orderNumber })
            setPayOrder(null)
            load()
          } catch (e) {
            toast({ title: 'Verification failed', description: (e as Error).message, variant: 'destructive' })
          }
        },
        theme: { color: '#7C2D3E' },
      })
      rzp.open()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setPaying(false)
    }
  }

  async function submitReview() {
    if (!reviewOrder) return
    if (!reviewOrder.seller?.id) {
      toast({ title: 'Seller information unavailable', description: 'Unable to submit a review for this order.', variant: 'destructive' })
      return
    }
    try {
      await api('/reviews', {
        method: 'POST',
        body: { sellerId: reviewOrder.seller.id, orderId: reviewOrder.id, rating, comment },
      })
      toast({ title: 'Review submitted successfully' })
      setReviewOrder(null)
      setComment('')
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  if (loading) return <Spinner />
  if (orders.length === 0) {
    return (
      <EmptyState
        icon="🛍️" title="No orders yet"
        subtitle="Browse the marketplace or design something with AI — your orders will appear here."
        action={<Button onClick={() => useAppStore.getState().navigate({ name: 'explore' })} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full">Start shopping</Button>}
      />
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((o, idx) => {
        const meta = orderStatusMeta(o.status)
        const activeFlow = ['CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED'].includes(o.status)
        const flowIdx = ['CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED'].indexOf(o.status)
        return (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="bg-card rounded-2xl border border-wine-100 overflow-hidden shadow-sm"
          >
            <div className="p-4 sm:p-5 flex flex-wrap items-center gap-3 justify-between bg-cream/40 border-b border-wine-100/60">
              <div>
                <div className="font-bold text-sm flex items-center gap-2">
                  {o.orderNumber}
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', meta.color)}>{meta.label}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(o.createdAt)} · {o.seller?.shopName || 'Unknown shop'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-lg text-wine-800">{inr(o.totalAmount)}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-2 justify-end mt-0.5">
                  <span className={cn('font-semibold', o.advanceStatus === 'PAID' ? 'text-emerald-600' : 'text-red-500')}>
                    Adv {o.advanceStatus}
                  </span>
                  <span className={cn('font-semibold', o.finalStatus === 'PAID' ? 'text-emerald-600' : 'text-red-500')}>
                    Final {o.finalStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {o.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3">
                  <div className="w-14 h-16 rounded-lg overflow-hidden bg-cream-dark shrink-0">
                    <SmartImage src={it.image} alt={it.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{it.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Size {it.size}{it.color && ` · ${it.color}`} · Qty {it.quantity}{it.withStitching && ' · ✂ stitched'}
                    </div>
                    {it.customization && <div className="text-xs text-gold-800 mt-0.5">📝 {it.customization}</div>}
                  </div>
                  <div className="text-sm font-semibold text-wine-800">{inr(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>

            {/* Advance due callout — shown when advance not yet paid */}
            {o.advanceStatus === 'UNPAID' && (
              <div className="px-4 pb-2">
                <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 text-xs flex items-center justify-between">
                  <span className="text-gold-900 font-medium">25% advance due now</span>
                  <span className="font-display font-bold text-gold-800">{inr(o.advanceAmount)}</span>
                </div>
              </div>
            )}

            {/* Remaining due callout — shown when advance paid but final unpaid */}
            {o.remainingAmount > 0 && o.advanceStatus === 'PAID' && o.finalStatus === 'UNPAID' && (
              <div className="px-4 pb-2">
                <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 text-xs flex items-center justify-between">
                  <span className="text-gold-900 font-medium">Remaining payment (75%)</span>
                  <span className="font-display font-bold text-gold-800">{inr(o.remainingAmount)}</span>
                </div>
              </div>
            )}

            {activeFlow && (
              <div className="px-4 sm:px-5 pb-2">
                <div className="flex items-center">
                  {['Confirmed', 'Stitching', 'Ready', 'Delivered'].map((step, i) => (
                    <div key={step} className="flex-1 flex items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={false}
                          animate={i <= flowIdx ? { scale: [1, 1.25, 1] } : {}}
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center border-2 text-[10px] font-bold transition-colors',
                            i <= flowIdx ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-card border-wine-200 text-muted-foreground'
                          )}
                        >
                          {i <= flowIdx ? '✓' : i + 1}
                        </motion.div>
                        <span className={cn('text-[9px] mt-1 font-medium', i <= flowIdx ? 'text-emerald-700' : 'text-muted-foreground')}>{step}</span>
                      </div>
                      {i < 3 && <div className={cn('flex-1 h-0.5 mx-1 -mt-4', i < flowIdx ? 'bg-emerald-500' : 'bg-wine-100')} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 sm:px-5 py-3.5 flex flex-wrap gap-2 border-t border-wine-100/60 bg-cream/20">
              {/* Pay 25% advance — shown when advance not yet paid */}
              {o.advanceStatus === 'UNPAID' && (
                <Button size="sm" onClick={() => setPayOrder(o)} className="bg-gold-500 hover:bg-gold-600 text-wine-900 rounded-full gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Pay 25% advance {inr(o.advanceAmount)}
                </Button>
              )}
              {/* Pay remaining 75% — shown when seller marks READY and final not paid */}
              {o.status === 'READY' && o.finalStatus === 'UNPAID' && (
                <Button size="sm" onClick={() => setPayOrder(o)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Pay remaining {inr(o.remainingAmount)}
                </Button>
              )}
              {o.status === 'COMPLETED' && (
                <Button size="sm" variant="outline" onClick={() => setReviewOrder(o)} className="rounded-full gap-1.5 border-gold-400 text-gold-800">
                  <Star className="w-3.5 h-3.5" /> Rate tailor
                </Button>
              )}
              {['REQUESTED', 'ACCEPTED'].includes(o.status) && (
                <Button size="sm" variant="ghost" onClick={() => orderAction(o, 'cancel')} className="rounded-full text-red-600 hover:bg-red-50 gap-1.5">
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
              )}
              {o.deliveryDate && ['IN_PRODUCTION', 'READY'].includes(o.status) && (
                <span className="text-xs text-muted-foreground self-center ml-auto flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Expected {formatDate(o.deliveryDate)}</span>
              )}
              {o.status === 'REQUESTED' && o.advanceStatus === 'UNPAID' && (
                <span className="text-xs text-muted-foreground self-center ml-auto flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pay advance to start production</span>
              )}
              {o.status === 'REQUESTED' && o.advanceStatus === 'PAID' && (
                <span className="text-xs text-muted-foreground self-center ml-auto flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Waiting for tailor approval</span>
              )}
              {o.status === 'READY' && o.finalStatus === 'PAID' && (
                <span className="text-xs text-muted-foreground self-center ml-auto flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Awaiting dispatch</span>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* Payment dialog — handles BOTH advance and final payments */}
      <Dialog open={!!payOrder} onOpenChange={(open) => !open && setPayOrder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-wine-900">
              {payOrder?.advanceStatus === 'UNPAID' ? 'Pay 25% Advance' : 'Final Payment'}
            </DialogTitle>
            <DialogDescription>
              {payOrder?.advanceStatus === 'UNPAID'
                ? `Pay ${inr(payOrder?.advanceAmount || 0)} advance for ${payOrder?.orderNumber}`
                : `Pay remaining ${inr(payOrder?.remainingAmount || 0)} for ${payOrder?.orderNumber}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-cream rounded-2xl p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Total order</span><span className="font-semibold">{inr(payOrder?.totalAmount || 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Advance</span><span className={cn('font-semibold', payOrder?.advanceStatus === 'PAID' ? 'text-emerald-600' : 'text-red-500')}>{inr(payOrder?.advanceAmount || 0)} · {payOrder?.advanceStatus}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className={cn('font-semibold', payOrder?.finalStatus === 'PAID' ? 'text-emerald-600' : 'text-red-500')}>{inr(payOrder?.remainingAmount || 0)} · {payOrder?.finalStatus}</span></div>
            </div>
            <Button
              onClick={payOrder?.advanceStatus === 'UNPAID' ? payAdvance : payRemaining}
              disabled={paying}
              className="w-full h-12 bg-wine-700 hover:bg-wine-800 text-white rounded-xl font-semibold gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {paying ? 'Processing…' : payOrder?.advanceStatus === 'UNPAID'
                ? `Pay ${inr(payOrder?.advanceAmount || 0)} now`
                : `Pay ${inr(payOrder?.remainingAmount || 0)} now`}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">🔒 Razorpay secured · server-side verified · no card details stored</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      <Dialog open={!!reviewOrder} onOpenChange={(open) => !open && setReviewOrder(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-wine-900">Rate your experience</DialogTitle>
            <DialogDescription>How was {reviewOrder?.seller?.shopName || 'your tailor'}?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={cn('w-9 h-9 transition-all', n <= rating ? 'fill-amber-400 text-amber-400 scale-110' : 'text-wine-200')} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Fitting, fabric quality, communication…" rows={3} className="bg-cream border-wine-200" />
          <Button onClick={submitReview} className="w-full bg-wine-700 hover:bg-wine-800 text-white rounded-xl h-11">Submit review</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════ Cart ═══════════════
export function CartTab() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [checkout, setCheckout] = useState(false)

  const load = useCallback(() => {
    api<{ items: CartItem[] }>('/cart').then((d) => setItems(d.items)).catch(() => null).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  async function updateQty(item: CartItem, delta: number) {
    const q = item.quantity + delta
    if (q <= 0) { await api(`/cart?id=${item.id}`, { method: 'DELETE' }) } else { await api('/cart', { method: 'PATCH', body: { id: item.id, quantity: q } }) }
    load()
    useAppStore.getState().setCartCount(Math.max(0, useAppStore.getState().cartCount + delta))
  }

  async function removeItem(item: CartItem) {
    await api(`/cart?id=${item.id}`, { method: 'DELETE' })
    load()
    useAppStore.getState().setCartCount(Math.max(0, useAppStore.getState().cartCount - item.quantity))
    toast({ title: 'Removed from cart' })
  }

  if (loading) return <Spinner />
  if (items.length === 0) {
    return (
      <EmptyState
        icon="🛒" title="Your cart is empty"
        subtitle="Add outfits from the marketplace and get them stitched to your measurements."
        action={<Button onClick={() => useAppStore.getState().navigate({ name: 'explore' })} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full">Explore products</Button>}
      />
    )
  }

  const subtotal = items.reduce((s, i) => s + (i.product.price + (i.withStitching && i.product.stitchingPrice ? i.product.stitchingPrice : 0)) * i.quantity, 0)
  const advance = Math.round(subtotal * 0.25)
  const remaining = subtotal - advance

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              className="bg-card rounded-2xl border border-wine-100 p-4 flex gap-4 items-center"
            >
              <div className="w-16 h-20 rounded-xl overflow-hidden bg-cream-dark shrink-0">
                <SmartImage src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{item.product.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.product.seller.shopName} · Size {item.size}{item.color && ` · ${item.color}`}
                  {item.withStitching && item.product.stitchingPrice ? ` · ✂ stitching ${inr(item.product.stitchingPrice)}` : ''}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => updateQty(item, -1)} className="w-7 h-7 rounded-full border border-wine-200 flex items-center justify-center hover:bg-wine-50" aria-label="Decrease quantity"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item, 1)} className="w-7 h-7 rounded-full border border-wine-200 flex items-center justify-center hover:bg-wine-50" aria-label="Increase quantity"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-wine-800">{inr((item.product.price + (item.withStitching && item.product.stitchingPrice ? item.product.stitchingPrice : 0)) * item.quantity)}</div>
                <button onClick={() => removeItem(item)} className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center gap-1 ml-auto"><Trash2 className="w-3 h-3" /> Remove</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="bg-card rounded-3xl border border-wine-100 p-5 h-fit sticky top-36 shadow-sm">
        <h3 className="font-display font-bold text-lg text-wine-900">Order summary</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Items ({items.reduce((s, i) => s + i.quantity, 0)})</span><span className="font-semibold">{inr(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-semibold text-emerald-600">FREE</span></div>
          <div className="border-t border-dashed border-wine-200 pt-2.5 flex justify-between text-base">
            <span className="font-bold">Total</span><span className="font-display font-bold text-wine-800">{inr(subtotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3">
            <div className="bg-gold-50 border border-gold-200 rounded-xl p-2.5">
              <div className="text-[10px] text-muted-foreground">Pay now (25%)</div>
              <div className="font-display font-bold text-gold-800">{inr(advance)}</div>
            </div>
            <div className="bg-wine-50 border border-wine-200 rounded-xl p-2.5">
              <div className="text-[10px] text-muted-foreground">Pay on delivery (75%)</div>
              <div className="font-display font-bold text-wine-800">{inr(remaining)}</div>
            </div>
          </div>
        </div>
        <Button onClick={() => setCheckout(true)} className="w-full mt-5 h-12 bg-wine-700 hover:bg-wine-800 text-white rounded-xl font-semibold gap-2">
          <ShoppingBag className="w-[18px] h-[18px]" /> Proceed to checkout
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-3">25% advance · 75% when your outfit is ready</p>
      </div>

      {checkout && (
        <CheckoutFlow
          items={items}
          onClose={() => setCheckout(false)}
          onDone={() => {
            setCheckout(false)
            load()
            useAppStore.getState().setCartCount(0)
            useAppStore.getState().navigate({ name: 'dashboard', category: 'orders' })
          }}
        />
      )}
    </div>
  )
}

// ═══════════════ Measurements ═══════════════
const MEASUREMENT_FIELDS = [
  { key: 'height', label: 'Height', hint: 'Head to toe' },
  { key: 'weight', label: 'Weight', hint: 'Kg' },
  { key: 'chest', label: 'Chest', hint: 'Fullest part' },
  { key: 'waist', label: 'Waist', hint: 'Natural waistline' },
  { key: 'hip', label: 'Hip', hint: 'Fullest part' },
  { key: 'shoulder', label: 'Shoulder', hint: 'Seam to seam' },
  { key: 'sleeveLength', label: 'Sleeve Length', hint: 'Shoulder to wrist' },
] as const

export function MeasurementsTab() {
  const [profile, setProfile] = useState<Partial<BodyProfile>>({ unit: 'cm' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<{ profile: BodyProfile | null }>('/measurements')
      .then((d) => d.profile && setProfile(d.profile))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      await api('/measurements', { method: 'PUT', body: profile })
      toast({ title: 'Measurements saved 📏', description: 'Tailors will use these for perfect fitting.' })
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card rounded-3xl border border-wine-100 p-6 shadow-sm">
        <h3 className="font-display font-bold text-lg text-wine-900">Your body profile</h3>
        <p className="text-xs text-muted-foreground mt-1">All fields optional — saved measurements are shared only with tailors you order from.</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          {MEASUREMENT_FIELDS.map((f) => (
            <div key={f.key}>
              <Label className="text-sm font-semibold flex justify-between">
                {f.label}
                <span className="text-[10px] font-normal text-muted-foreground">{f.hint}</span>
              </Label>
              <div className="relative mt-1.5">
                <Input
                  type="number"
                  value={profile[f.key] ?? ''}
                  onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="—"
                  className="pr-12 h-11 bg-cream border-wine-200"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{f.key === 'weight' ? 'kg' : profile.unit}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-6">
          <Button onClick={save} disabled={saving} className="bg-wine-700 hover:bg-wine-800 text-white rounded-xl gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save measurements'}
          </Button>
          <div className="flex text-xs bg-cream rounded-full p-1 border border-wine-100">
            {['cm', 'inch'].map((u) => (
              <button key={u} onClick={() => setProfile({ ...profile, unit: u })} className={cn('px-3.5 py-1.5 rounded-full font-medium transition-all', profile.unit === u ? 'bg-wine-700 text-white' : 'text-muted-foreground')}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-wine-800 to-wine-900 rounded-3xl p-6 text-white h-fit">
        <Ruler className="w-8 h-8 text-gold-400" />
        <h3 className="font-display font-bold text-lg mt-3">Why measurements matter</h3>
        <ul className="mt-3 space-y-2.5 text-xs text-wine-200/90 leading-relaxed">
          <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" /> Every stitched outfit matches your body — zero refits.</li>
          <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" /> Shared only with sellers you order from. Private &amp; encrypted.</li>
          <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-gold-400 shrink-0 mt-0.5" /> A frozen snapshot is saved with every order — future edits don't change past orders.</li>
        </ul>
      </div>
    </div>
  )
}

// ═══════════════ Wishlist ═══════════════
export function WishlistTab() {
  const [items, setItems] = useState<{ id: string; product: Product }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    api<{ items: { id: string; product: Product }[] }>('/wishlist').then((d) => setItems(d.items)).catch(() => null).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  if (loading) return <Spinner />
  if (items.length === 0) {
    return <EmptyState icon="💝" title="Wishlist is empty" subtitle="Tap the ❤️ on any outfit to save it here." />
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((w) => (
        <motion.div
          key={w.id}
          layout
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => useAppStore.getState().navigate({ name: 'product', id: w.product.id })}
          className="bg-card rounded-2xl border border-wine-100 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
        >
          <div className="aspect-[4/3] overflow-hidden">
            <SmartImage src={w.product.images[0]} alt={w.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="p-4">
            <div className="font-semibold text-sm">{w.product.name}</div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="font-display font-bold text-wine-800">{inr(w.product.price)}</span>
              <RatingStars rating={w.product.rating} size={11} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ═══════════════ AI Designs (with delete + share + preview) ═══════════════
export function DesignsTab() {
  const navigate = useAppStore((s) => s.navigate)
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<Design | null>(null)
  const [shareDesign, setShareDesign] = useState<Design | null>(null)
  const [deleteDesign, setDeleteDesign] = useState<Design | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api<{ designs: Design[] }>('/designs').then((d) => setDesigns(d.designs)).catch(() => null).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  async function confirmDelete() {
    if (!deleteDesign) return
    setBusy(true)
    try {
      await api(`/designs/${deleteDesign.id}`, { method: 'DELETE' })
      toast({ title: 'Design deleted 🗑️', description: deleteDesign.title })
      setDeleteDesign(null)
      load()
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
    finally { setBusy(false) }
  }

  async function shareWithSeller(sellerId: string, shopName: string) {
    if (!shareDesign) return
    setBusy(true)
    try {
      await api(`/designs/${shareDesign.id}`, {
        method: 'PATCH',
        body: { action: 'send-to-tailor', sellerId },
      })
      toast({ title: 'Design shared ✅', description: `Sent to ${shopName}. Open Messages to continue.` })
      setShareDesign(null)
      load()
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
    finally { setBusy(false) }
  }

  if (loading) return <Spinner />
  if (designs.length === 0) {
    return (
      <EmptyState
        icon="🎨" title="No AI designs yet"
        subtitle="Describe your dream outfit in the AI Studio and it appears here."
        action={<Button onClick={() => navigate({ name: 'ai-studio' })} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full">Open AI Studio</Button>}
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{designs.length} design{designs.length !== 1 ? 's' : ''} · click any image for full preview</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {designs.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-wine-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
          >
            <button onClick={() => setPreview(d)} className="aspect-[3/4] bg-cream-dark block w-full overflow-hidden">
              <SmartImage src={d.imageUrl} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </button>
            <div className="p-3.5">
              <div className="text-sm font-semibold line-clamp-1">{d.title}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{d.category} · {timeAgo(d.createdAt)}</div>
              <span className={cn('inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full',
                d.status === 'SENT_TO_TAILOR' ? 'bg-emerald-100 text-emerald-700'
                  : d.status === 'SAVED' ? 'bg-gold-100 text-gold-800'
                  : 'bg-wine-100 text-wine-800')}>
                {d.status === 'SENT_TO_TAILOR' ? '✓ Sent to tailor' : d.status === 'SAVED' ? '★ Saved' : '✨ Generated'}
              </span>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShareDesign(d)}
                  className="flex-1 h-8 rounded-full text-xs gap-1.5 border-wine-200 hover:border-gold-400"
                >
                  <Share2 className="w-3 h-3" /> Share
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteDesign(d)}
                  className="h-8 rounded-full text-xs text-red-500 hover:bg-red-50 px-2.5"
                  aria-label="Delete design"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <DesignPreviewModal design={preview} onClose={() => setPreview(null)} />
      <SellerPickerDialog open={!!shareDesign} onClose={() => setShareDesign(null)} onPick={shareWithSeller} />

      <Dialog open={!!deleteDesign} onOpenChange={(open) => !open && setDeleteDesign(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-wine-900">Delete this design?</DialogTitle>
            <DialogDescription>"{deleteDesign?.title}" will be permanently removed from your history. This cannot be undone.</DialogDescription>
          </DialogHeader>
          {deleteDesign && (
            <div className="flex gap-3 items-center bg-cream/40 rounded-2xl p-3">
              <img src={deleteDesign.imageUrl} alt={deleteDesign.title} className="w-16 h-20 rounded-lg object-cover" />
              <div className="text-xs">
                <div className="font-semibold">{deleteDesign.title}</div>
                <div className="text-muted-foreground">{deleteDesign.category} · {timeAgo(deleteDesign.createdAt)}</div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteDesign(null)} className="flex-1 rounded-xl h-11">Cancel</Button>
            <Button onClick={confirmDelete} disabled={busy} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 gap-1.5">
              <Trash2 className="w-4 h-4" /> {busy ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════ Try-On History (with delete + clear all + share + before/after) ═══════════════
export function TryonHistoryTab() {
  const navigate = useAppStore((s) => s.navigate)
  const [sessions, setSessions] = useState<TryonSession[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<TryonSession | null>(null)
  const [shareSession, setShareSession] = useState<TryonSession | null>(null)
  const [deleteSession, setDeleteSession] = useState<TryonSession | null>(null)
  const [clearAll, setClearAll] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api<{ sessions: TryonSession[] }>('/tryon').then((d) => setSessions(d.sessions)).catch(() => null).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  async function confirmDelete() {
    if (!deleteSession) return
    setBusy(true)
    try {
      await api(`/tryon/${deleteSession.id}`, { method: 'DELETE' })
      toast({ title: 'Try-on deleted 🗑️', description: deleteSession.productName })
      setDeleteSession(null)
      load()
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
    finally { setBusy(false) }
  }

  async function confirmClearAll() {
    setBusy(true)
    try {
      await api('/tryon', { method: 'DELETE' })
      toast({ title: 'Try-on history cleared 🗑️' })
      setClearAll(false)
      setSessions([])
      load()
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
    finally { setBusy(false) }
  }

  async function shareWithSeller(sellerId: string, shopName: string) {
    if (!shareSession) return
    setBusy(true)
    try {
      await api(`/tryon/${shareSession.id}/share`, {
        method: 'POST',
        body: { sellerId },
      })
      toast({ title: 'Try-on shared ✅', description: `Sent to ${shopName}. Open Messages to continue.` })
      setShareSession(null)
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
    finally { setBusy(false) }
  }

  if (loading) return <Spinner />
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon="🪞" title="No try-on sessions yet"
        subtitle="Upload your photo in the Virtual Fitting Room and preview outfits."
        action={<Button onClick={() => navigate({ name: 'tryon' })} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full">Open fitting room</Button>}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? 's' : ''} · click any image for before/after preview</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setClearAll(true)}
          className="rounded-full text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear all
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sessions.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl border border-wine-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
          >
            <button onClick={() => setPreview(s)} className="aspect-[3/4] bg-cream-dark block w-full overflow-hidden relative">
              <SmartImage src={s.resultImage} alt={s.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <span className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">🪞 Try-On</span>
            </button>
            <div className="p-3">
              <div className="text-xs font-semibold line-clamp-1">{s.productName}</div>
              <div className="text-[10px] text-muted-foreground">{timeAgo(s.createdAt)}</div>
              <div className="flex gap-1.5 mt-2.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShareSession(s)}
                  className="flex-1 h-7 rounded-full text-[11px] gap-1 border-wine-200 hover:border-gold-400 px-2"
                >
                  <Share2 className="w-3 h-3" /> Share
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteSession(s)}
                  className="h-7 rounded-full text-[11px] text-red-500 hover:bg-red-50 px-2"
                  aria-label="Delete try-on session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <TryonPreviewModal session={preview} onClose={() => setPreview(null)} />
      <SellerPickerDialog open={!!shareSession} onClose={() => setShareSession(null)} onPick={shareWithSeller} />

      <Dialog open={!!deleteSession} onOpenChange={(open) => !open && setDeleteSession(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-wine-900">Delete this try-on?</DialogTitle>
            <DialogDescription>"{deleteSession?.productName}" will be permanently removed from your history. This cannot be undone.</DialogDescription>
          </DialogHeader>
          {deleteSession && (
            <div className="flex gap-3 items-center bg-cream/40 rounded-2xl p-3">
              <img src={deleteSession.resultImage} alt={deleteSession.productName} className="w-16 h-20 rounded-lg object-cover" />
              <div className="text-xs">
                <div className="font-semibold line-clamp-2">{deleteSession.productName}</div>
                <div className="text-muted-foreground">{timeAgo(deleteSession.createdAt)}</div>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteSession(null)} className="flex-1 rounded-xl h-11">Cancel</Button>
            <Button onClick={confirmDelete} disabled={busy} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 gap-1.5">
              <Trash2 className="w-4 h-4" /> {busy ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={clearAll} onOpenChange={setClearAll}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-wine-900">Clear all try-on history?</DialogTitle>
            <DialogDescription>All {sessions.length} try-on session{sessions.length !== 1 ? 's' : ''} will be permanently deleted. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setClearAll(false)} className="flex-1 rounded-xl h-11">Cancel</Button>
            <Button onClick={confirmClearAll} disabled={busy} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 gap-1.5">
              <Trash2 className="w-4 h-4" /> {busy ? 'Clearing…' : 'Clear all'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════ Notifications ═══════════════
export function NotificationsTab() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(() => { api<{ notifications: Notification[] }>('/notifications').then((d) => setItems(d.notifications)).catch(() => null).finally(() => setLoading(false)) }, [])
  useEffect(load, [load])

  if (loading) return <Spinner />
  if (items.length === 0) return <EmptyState icon="🔔" title="No notifications" subtitle="Order updates and messages will show up here." />

  return (
    <div className="space-y-2.5">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={async () => { await api('/notifications', { method: 'PATCH', body: { all: true } }); load(); useAppStore.getState().setUnreadNotifications(0) }} className="text-xs text-muted-foreground">
          Mark all as read
        </Button>
      </div>
      {items.map((n, i) => (
        <motion.button
          key={n.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={async () => { await api('/notifications', { method: 'PATCH', body: { id: n.id } }); load() }}
          className={cn('w-full text-left flex gap-3.5 p-4 rounded-2xl border transition-all', n.isRead ? 'bg-card border-wine-100' : 'bg-gold-50 border-gold-200 hover:bg-gold-100/60')}
        >
          <div className="text-xl shrink-0">
            {n.type === 'ORDER' ? '🧾' : n.type === 'MESSAGE' ? '💬' : n.type === 'PAYMENT' ? '💳' : n.type === 'AI' ? '🎨' : '🔔'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold flex items-center gap-2">{n.title}{!n.isRead && <span className="w-2 h-2 rounded-full bg-gold-500" />}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
        </motion.button>
      ))}
    </div>
  )
}

// ═══════════════ Settings ═══════════════
export function SettingsTab() {
  const { user } = useAppStore()
  if (!user) return null
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-3xl border border-wine-100 p-6">
        <h3 className="font-display font-bold text-lg text-wine-900">Account</h3>
        <div className="mt-4 space-y-3 text-sm">
          {[['Name', user.name], ['Email', user.email], ['Phone', user.phone || '—'], ['City', user.city || '—'], ['Role', user.role]].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-wine-50">
              <span className="text-muted-foreground">{k}</span><span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-3xl border border-wine-100 p-6">
        <h3 className="font-display font-bold text-lg text-wine-900">Privacy & data</h3>
        <ul className="mt-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
          <li className="flex gap-2"><span>🔒</span> Your photos are private — never visible to other customers.</li>
          <li className="flex gap-2"><span>📏</span> Body measurements are shared only with sellers you order from.</li>
          <li className="flex gap-2"><span>🗑️</span> You can delete photos and body profile anytime from Settings.</li>
          <li className="flex gap-2"><span>🤖</span> Photos are never used for AI training without explicit consent.</li>
          <li className="flex gap-2"><span>💳</span> Card details are never stored on our servers (handled by Razorpay).</li>
        </ul>
      </div>
    </div>
  )
}

// ═══════════════ Customer overview ═══════════════
export function CustomerOverview() {
  const [orders, setOrders] = useState<Order[]>([])
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api<{ orders: Order[] }>('/orders'), api<{ designs: Design[] }>('/designs')])
      .then(([o, d]) => { setOrders(o.orders); setDesigns(d.designs) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const active = orders.filter((o) => ['REQUESTED', 'ACCEPTED', 'CONFIRMED', 'IN_PRODUCTION', 'READY'].includes(o.status))
  const delivered = orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.status))
  const spent = orders.filter((o) => o.paymentStatus === 'PAID' || o.advanceStatus === 'PAID').reduce((s, o) => s + (o.advancePaid || 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Active orders" value={active.length} sub="in progress" accent="text-wine-700" delay={0} />
        <StatCard icon={Package} label="Completed" value={delivered.length} sub="all time" accent="text-emerald-600" delay={0.06} />
        <StatCard icon={Wallet} label="Total spent" value={inr(spent)} accent="text-gold-600" delay={0.12} />
        <StatCard icon={Sparkles} label="AI designs" value={designs.length} sub="created" accent="text-teal-600" delay={0.18} />
      </div>

      {active.length > 0 && (
        <div>
          <h3 className="font-display font-bold text-lg text-wine-900 mb-3">Active orders</h3>
          <div className="space-y-3">
            {active.slice(0, 3).map((o) => {
              const meta = orderStatusMeta(o.status)
              return (
                <motion.button
                  key={o.id}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 4 }}
                  onClick={() => useAppStore.getState().navigate({ name: 'dashboard', category: 'orders' })}
                  className="w-full flex items-center gap-4 bg-card rounded-2xl border border-wine-100 p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-14 rounded-lg overflow-hidden bg-cream-dark shrink-0">
                    <SmartImage src={o.items[0]?.image} alt={o.items[0]?.name || 'order'} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{o.items[0]?.name || o.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.seller?.shopName || 'Unknown shop'} · {o.orderNumber}
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0', meta.color)}>{meta.label}</span>
                  <ArrowRight className="w-4 h-4 text-wine-300 shrink-0" />
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => useAppStore.getState().navigate({ name: 'ai-studio' })}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-wine-700 to-wine-900 p-6 text-left text-white group"
        >
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 35, ease: 'linear' }} className="absolute -right-8 -top-8 w-32 h-32 border-2 border-dashed border-gold-400/40 rounded-full" />
          <Sparkles className="w-8 h-8 text-gold-400" />
          <div className="font-display font-bold text-xl mt-3">Design something new</div>
          <div className="text-xs text-wine-200 mt-1">AI turns your words into fashion sketches</div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-300 mt-4 group-hover:gap-3 transition-all">Open AI Studio <ArrowRight className="w-3.5 h-3.5" /></span>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          onClick={() => useAppStore.getState().navigate({ name: 'find-tailors' })}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-500 to-gold-600 p-6 text-left text-wine-900 group"
        >
          <div className="absolute -right-6 -bottom-8 text-[120px] opacity-15 select-none">📍</div>
          <span className="text-3xl">📍</span>
          <div className="font-display font-bold text-xl mt-2">Find tailors near you</div>
          <div className="text-xs text-wine-900/70 mt-1">Verified shops within walking distance</div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold mt-4 group-hover:gap-3 transition-all">Open map <ArrowRight className="w-3.5 h-3.5" /></span>
        </motion.button>
      </div>
    </div>
  )
}

// ═══════════════ Customer dashboard root ═══════════════
export function CustomerDashboard({ tab }: { tab: string }) {
  const user = useAppStore((s) => s.user)

  const meta: Record<string, { title: string; subtitle: string }> = {
    overview: { title: `Hello, ${user?.name.split(' ')[0]} 👋`, subtitle: 'Here is your style dashboard at a glance.' },
    orders: { title: 'My Orders', subtitle: 'Track approvals, stitching progress and deliveries.' },
    cart: { title: 'Shopping Cart', subtitle: 'Review items before checkout.' },
    measurements: { title: 'Body Measurements', subtitle: 'Perfect fit starts with accurate measurements.' },
    wishlist: { title: 'Wishlist', subtitle: 'Outfits you loved and saved.' },
    designs: { title: 'My AI Designs', subtitle: 'Every design you generated with AI.' },
    tryon: { title: 'Try-On History', subtitle: 'Your virtual fitting room sessions.' },
    messages: { title: 'Messages', subtitle: 'Chat with tailors in real time.' },
    notifications: { title: 'Notifications', subtitle: 'Order updates, messages and offers.' },
    settings: { title: 'Settings', subtitle: 'Account details and privacy controls.' },
  }
  const m = meta[tab] || meta.overview

  return (
    <PageHeader title={m.title} subtitle={m.subtitle}>
      {tab === 'overview' && <CustomerOverview />}
      {tab === 'orders' && <CustomerOrders />}
      {tab === 'cart' && <CartTab />}
      {tab === 'measurements' && <MeasurementsTab />}
      {tab === 'wishlist' && <WishlistTab />}
      {tab === 'designs' && <DesignsTab />}
      {tab === 'tryon' && <TryonHistoryTab />}
      {tab === 'messages' && <ChatPanel height="h-[600px]" />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'settings' && <SettingsTab />}
    </PageHeader>
  )
}
