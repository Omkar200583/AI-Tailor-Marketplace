'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { useAppStore } from '@/store/app-store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner, SmartImage } from '@/components/common/ui-bits'
import { toast } from '@/hooks/use-toast'
import { inr, formatDate, orderStatusMeta } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import { Check, X, Scissors, Truck, Clock, CreditCard, Ruler, Sparkles, MapPin, MessageCircle, Calendar } from 'lucide-react'
import type { Order } from '@/types'

export function SellerOrderDetails({ orderId, open, onClose, onUpdated }: {
  orderId: string | null; open: boolean; onClose: () => void; onUpdated: () => void
}) {
  const navigate = useAppStore((s) => s.navigate)
  const [order, setOrder] = useState<Order | null>(null)
  const [completionDate, setCompletionDate] = useState('')
  const [dispatchDate, setDispatchDate] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!orderId || !open) return
    let active = true
    api<{ order: Order }>(`/orders/${orderId}`)
      .then((d) => {
        if (!active) return
        setOrder(d.order)
        const ec = (d.order as any).timeline?.estimatedCompletion
        const ed = (d.order as any).timeline?.expectedDispatch
        setCompletionDate(ec ? new Date(ec).toISOString().slice(0, 10) : '')
        setDispatchDate(ed ? new Date(ed).toISOString().slice(0, 10) : '')
      })
      .catch(() => null)
    return () => { active = false }
  }, [orderId, open])

  async function act(action: string, extra?: Record<string, unknown>) {
    if (!order) return
    setBusy(true)
    try {
      await api(`/orders/${order.id}`, { method: 'PATCH', body: { action, ...extra } })
      toast({ title: 'Updated', description: order.orderNumber })
      const d = await api<{ order: Order }>(`/orders/${order.id}`)
      setOrder(d.order)
      setShowReject(false)
      setRejectReason('')
      onUpdated()
    } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }) }
    finally { setBusy(false) }
  }

  function chatWithCustomer() {
    if (!order) return
    navigate({ name: 'dashboard', category: 'messages' })
  }

  if (!open) return null
  if (!order || order.id !== orderId) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md"><Spinner /></DialogContent>
      </Dialog>
    )
  }

  const meta = orderStatusMeta(order.status)
  const measurements = (order as any).measurements
  const design = (order as any).design
  const payments = (order as any).payments ?? []
  const timeline = (order as any).timeline
  const statusHistory = ((order as any).statusHistory ?? []) as { status: string; note: string | null; createdAt: string }[]

  const isAdvancePaid = order.advanceStatus === 'PAID'
  const canSetCompletion = isAdvancePaid && ['ACCEPTED', 'CONFIRMED', 'IN_PRODUCTION'].includes(order.status)
  const canSetDispatch = isAdvancePaid && ['READY', 'DISPATCHED'].includes(order.status)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-wine-900 flex items-center gap-2">
            {order.orderNumber}
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', meta.color)}>{meta.label}</span>
            {!isAdvancePaid && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-800 border border-gold-200">
                Advance pending
              </span>
            )}
          </DialogTitle>
          <DialogDescription>Placed on {formatDate(order.createdAt)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Customer + contact */}
          <section>
            <h4 className="text-sm font-bold text-wine-900 flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gold-600" /> Customer & contact
            </h4>
            <div className="bg-cream/40 rounded-2xl p-4 text-sm space-y-1">
              <div className="font-semibold">{order.customer?.name}</div>
              <div className="text-muted-foreground">📞 {order.customer?.phone || '—'}</div>
              {isAdvancePaid ? (
                <div className="text-muted-foreground pt-2 mt-2 border-t border-wine-100">{order.address}</div>
              ) : (
                <div className="text-muted-foreground pt-2 mt-2 border-t border-wine-100 text-xs italic">
                  🔒 Full address, measurements and design will be visible after the customer pays the 25% advance.
                </div>
              )}
            </div>
            {!isAdvancePaid && (
              <div className="mt-2 bg-gold-50 border border-gold-200 rounded-xl p-3 text-xs text-gold-900">
                💬 Chat with the customer to discuss the order details. Once they pay the advance ({inr(order.advanceAmount)}), you'll see everything.
              </div>
            )}
            <Button size="sm" variant="outline" onClick={chatWithCustomer} className="mt-2 rounded-full gap-1.5 text-xs">
              <MessageCircle className="w-3.5 h-3.5" /> Chat with customer
            </Button>
          </section>

          {/* Items */}
          <section>
            <h4 className="text-sm font-bold text-wine-900 mb-2">Products requested</h4>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={it.id} className="flex gap-3 items-center bg-cream/40 rounded-2xl p-3">
                  <div className="w-12 h-14 rounded-lg overflow-hidden bg-cream-dark shrink-0">
                    <SmartImage src={it.image} alt={it.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{it.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {it.quantity} · Size {it.size}{it.withStitching && ' · ✂ stitched'}</div>
                    {it.customization && <div className="text-xs text-gold-800 mt-0.5">📝 {it.customization}</div>}
                  </div>
                  <div className="text-sm font-bold text-wine-800">{inr(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Design — only when advance paid */}
          {isAdvancePaid && design && (
            <section>
              <h4 className="text-sm font-bold text-wine-900 flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-gold-600" /> Design reference
              </h4>
              <div className="flex gap-3 bg-cream/40 rounded-2xl p-3">
                <img src={design.imageUrl} alt={design.title} className="w-24 h-28 rounded-lg object-cover" />
                <div className="flex-1 text-sm space-y-0.5">
                  <div className="font-semibold">{design.title}</div>
                  {design.category && <div className="text-muted-foreground">{design.category}</div>}
                  {design.fabric && <div className="text-muted-foreground">Fabric: {design.fabric}</div>}
                  {design.color && <div className="text-muted-foreground">Color: {design.color}</div>}
                  {design.customization && <div className="text-gold-800 text-xs mt-1">📝 {design.customization}</div>}
                </div>
              </div>
            </section>
          )}

          {/* Measurements — only when advance paid */}
          {isAdvancePaid && measurements && (
            <section>
              <h4 className="text-sm font-bold text-wine-900 flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4 text-gold-600" /> Body measurements
                <span className="text-[10px] text-muted-foreground font-normal">(snapshot)</span>
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs bg-cream/40 rounded-2xl p-3">
                {Object.entries(measurements)
                  .filter(([k, v]) => !['id', 'orderId', 'createdAt', 'raw'].includes(k) && v != null)
                  .map(([k, v]) => (
                    <div key={k}>
                      <div className="text-muted-foreground capitalize">{k}</div>
                      <div className="font-semibold">{String(v)} {k === 'weight' ? 'kg' : measurements.unit}</div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Payment */}
          <section>
            <h4 className="text-sm font-bold text-wine-900 flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-gold-600" /> Payment
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-cream/40 rounded-xl p-3">
                <div className="text-muted-foreground">Total</div>
                <div className="font-bold text-wine-800">{inr(order.totalAmount)}</div>
              </div>
              <div className="bg-gold-50 border border-gold-200 rounded-xl p-3">
                <div className="text-muted-foreground">Advance (25%)</div>
                <div className="font-bold text-gold-800">{inr(order.advanceAmount)}</div>
                <div className={cn('text-[10px] font-semibold', order.advanceStatus === 'PAID' ? 'text-emerald-600' : 'text-red-500')}>
                  {order.advanceStatus}
                </div>
              </div>
              <div className="bg-wine-50 border border-wine-200 rounded-xl p-3">
                <div className="text-muted-foreground">Remaining (75%)</div>
                <div className="font-bold text-wine-800">{inr(order.remainingAmount)}</div>
                <div className={cn('text-[10px] font-semibold', order.finalStatus === 'PAID' ? 'text-emerald-600' : 'text-red-500')}>
                  {order.finalStatus}
                </div>
              </div>
            </div>
            {payments.length > 0 && (
              <div className="mt-2 space-y-1">
                {payments.map((p: any) => (
                  <div key={p.id} className="text-[11px] text-muted-foreground flex justify-between bg-cream/30 rounded-lg px-3 py-1.5">
                    <span>{p.kind} · {p.method || '—'} · {p.razorpayPaymentId?.slice(-8) || '—'}</span>
                    <span className={p.status === 'SUCCESS' ? 'text-emerald-600 font-semibold' : 'text-red-500'}>
                      {p.status} · {inr(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Production timeline — only when advance paid */}
          {isAdvancePaid && (
            <section>
              <h4 className="text-sm font-bold text-wine-900 flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gold-600" /> Production timeline
              </h4>
              <div className="bg-cream/40 rounded-2xl p-3 text-xs space-y-1">
                {timeline?.startDate && <div>Started: {formatDate(timeline.startDate)}</div>}
                {timeline?.estimatedCompletion && <div>Est. completion: {formatDate(timeline.estimatedCompletion)}</div>}
                {timeline?.expectedDispatch && <div>Expected dispatch: {formatDate(timeline.expectedDispatch)}</div>}
                {!timeline?.startDate && <div className="text-muted-foreground">Not started yet.</div>}
              </div>
            </section>
          )}

          {/* Status history */}
          {statusHistory.length > 0 && (
            <section>
              <h4 className="text-sm font-bold text-wine-900 mb-2">Status history</h4>
              <div className="bg-cream/40 rounded-2xl p-3 space-y-2 max-h-40 overflow-y-auto">
                {statusHistory.map((h, i) => (
                  <div key={i} className="text-xs flex gap-2">
                    <span className="font-semibold text-wine-700 whitespace-nowrap">{formatDate(h.createdAt)}</span>
                    <span className="text-muted-foreground">{h.note || h.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Date setters — only when advance paid */}
          {(canSetCompletion || canSetDispatch) && (
            <section className="flex flex-wrap items-end gap-3 pt-2 border-t border-wine-100">
              {canSetCompletion && (
                <div className="flex items-end gap-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Completion date</Label>
                    <Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="h-9 text-xs bg-cream w-40 mt-1" />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => completionDate && act('set-completion-date', { completionDate })} disabled={busy || !completionDate} className="rounded-full text-xs h-9">
                    Set
                  </Button>
                </div>
              )}
              {canSetDispatch && (
                <div className="flex items-end gap-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> Dispatch date</Label>
                    <Input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} className="h-9 text-xs bg-cream w-40 mt-1" />
                  </div>
                  <Button size="sm" variant="outline" onClick={() => dispatchDate && act('set-dispatch-date', { dispatchDate })} disabled={busy || !dispatchDate} className="rounded-full text-xs h-9">
                    Set
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* ═══ APPROVE/REJECT — always available for REQUESTED orders (even before advance) ═══ */}
          {order.status === 'REQUESTED' && (
            <section className="flex flex-wrap gap-2 pt-2 border-t border-wine-100">
              <Button size="sm" onClick={() => act('accept')} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full gap-1.5">
                <Check className="w-3.5 h-3.5" /> Approve Order
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowReject(true)} disabled={busy} className="rounded-full border-red-200 text-red-600 gap-1.5">
                <X className="w-3.5 h-3.5" /> Reject
              </Button>
            </section>
          )}

          {/* ═══ PRODUCTION ACTIONS — only after advance is paid AND order is accepted ═══ */}
          {isAdvancePaid && order.status !== 'REQUESTED' && (
            <section className="flex flex-wrap gap-2 pt-2 border-t border-wine-100">
              {order.status === 'ACCEPTED' && (
                <Button size="sm" onClick={() => act('confirm-measurements')} disabled={busy} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> Confirm measurements
                </Button>
              )}
              {order.status === 'CONFIRMED' && (
                <Button size="sm" onClick={() => act('start-stitching')} disabled={busy} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-1.5">
                  <Scissors className="w-3.5 h-3.5" /> Start stitching
                </Button>
              )}
              {order.status === 'IN_PRODUCTION' && (
                <Button size="sm" onClick={() => act('mark-ready')} disabled={busy} className="bg-gold-500 hover:bg-gold-600 text-wine-900 rounded-full gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Mark ready
                </Button>
              )}
              {order.status === 'READY' && (
                <>
                  <Button size="sm" onClick={() => act('request-remaining-payment')} disabled={busy} className="bg-gold-500 hover:bg-gold-600 text-wine-900 rounded-full gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Request remaining payment
                  </Button>
                  {order.finalStatus === 'PAID' && (
                    <Button size="sm" onClick={() => act('mark-shipped')} disabled={busy} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Mark shipped
                    </Button>
                  )}
                </>
              )}
              {order.status === 'DISPATCHED' && (
                <Button size="sm" onClick={() => act('mark-delivered')} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Mark delivered
                </Button>
              )}
            </section>
          )}

          {/* ═══ WAITING MESSAGE — after approval, before advance payment ═══ */}
          {!isAdvancePaid && order.status === 'ACCEPTED' && (
            <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 text-center text-sm text-gold-900">
              ✅ Order approved — waiting for customer to pay 25% advance ({inr(order.advanceAmount)}). You'll be notified automatically when payment is received.
            </div>
          )}
        </div>
      </DialogContent>

      {/* Reject dialog */}
      {showReject && (
        <Dialog open={showReject} onOpenChange={setShowReject}>
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
              onClick={() => act('reject', { reason: rejectReason })}
              disabled={busy}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-11"
            >
              {busy ? 'Rejecting…' : 'Confirm rejection'}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}
