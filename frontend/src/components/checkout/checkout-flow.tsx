'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api-client'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SmartImage } from '@/components/common/ui-bits'
import { toast } from '@/hooks/use-toast'
import { inr } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import type { CartItem, BodyProfile, Design, CustomerAddress } from '@/types'
import { Check, ChevronLeft, ChevronRight, MapPin, Ruler, Sparkles, ShoppingCart, Plus } from 'lucide-react'

type Step = 'cart' | 'info' | 'address' | 'measurements' | 'design' | 'summary' | 'confirmation'
const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: 'cart',          label: 'Cart',          icon: ShoppingCart },
  { id: 'info',          label: 'Info',          icon: MapPin },
  { id: 'address',       label: 'Address',       icon: MapPin },
  { id: 'measurements',  label: 'Measurements',  icon: Ruler },
  { id: 'design',        label: 'Design',        icon: Sparkles },
  { id: 'summary',       label: 'Summary',       icon: Check },
  { id: 'confirmation',  label: 'Done',          icon: Check },
]

interface AddressForm {
  fullName: string; phone: string; line1: string; line2: string;
  landmark: string; city: string; state: string; pincode: string; isDefault: boolean
}
const EMPTY_ADDR: AddressForm = { fullName: '', phone: '', line1: '', line2: '', landmark: '', city: '', state: '', pincode: '', isDefault: true }

export function CheckoutFlow({ items, onClose, onDone }: { items: CartItem[]; onClose: () => void; onDone: () => void }) {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const [step, setStep] = useState<Step>('cart')
  const [busy, setBusy] = useState(false)
  const [quote, setQuote] = useState<{ totalAmount: number; advanceAmount: number; remainingAmount: number } | null>(null)
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string>('')
  const [advanceDue, setAdvanceDue] = useState<number>(0)

  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [addrForm, setAddrForm] = useState<AddressForm>(EMPTY_ADDR)
  const [showAddrForm, setShowAddrForm] = useState(false)

  const [measurements, setMeasurements] = useState<BodyProfile | null>(null)
  const [designs, setDesigns] = useState<Design[]>([])
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null)
  const [customization, setCustomization] = useState('')

  const stepIdx = STEPS.findIndex((s) => s.id === step)
  const next = () => { if (stepIdx < STEPS.length - 1) setStep(STEPS[stepIdx + 1].id) }
  const back = () => { if (stepIdx > 0) setStep(STEPS[stepIdx - 1].id) }

  useEffect(() => {
    api<{ addresses: CustomerAddress[] }>('/addresses').then((d) => {
      setAddresses(d.addresses)
      const def = d.addresses.find((a) => a.isDefault)
      if (def) setSelectedAddressId(def.id)
    }).catch(() => null)
    api<{ profile: BodyProfile | null }>('/measurements').then((d) => d.profile && setMeasurements(d.profile)).catch(() => null)
    api<{ designs: Design[] }>('/designs').then((d) => setDesigns(d.designs)).catch(() => null)
  }, [])

  // FIX: Only address is required — measurements and design are OPTIONAL
  function validate(): string | null {
    if (step === 'address') {
      const a = selectedAddressId ? addresses.find((x) => x.id === selectedAddressId) : showAddrForm ? addrForm : null
      if (!a) return 'Select a saved address or enter a new one'
      if (showAddrForm) {
        if (!a.fullName.trim() || !a.phone.trim() || !a.line1.trim() || !a.city.trim() || !a.state.trim() || !a.pincode.trim()) return 'Fill all required address fields'
        if (!/^\d{6}$/.test(a.pincode)) return 'PIN must be 6 digits'
        if (!/^\d{10}$/.test(a.phone)) return 'Phone must be 10 digits'
      }
    }
    // Measurements + Design are OPTIONAL — no blocking validation
    return null
  }

  async function proceed() {
    const err = validate()
    if (err) { toast({ title: err, variant: 'destructive' }); return }

    if (step === 'address' && showAddrForm && !selectedAddressId) {
      try {
        const d = await api<{ address: CustomerAddress }>('/addresses', { method: 'POST', body: addrForm })
        setAddresses((p) => [d.address, ...p])
        setSelectedAddressId(d.address.id)
        setShowAddrForm(false)
      } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }); return }
    }

    if (step === 'design') {
      try {
        const q = await api<{ quote: { totalAmount: number; advanceAmount: number; remainingAmount: number } }>('/checkout/quote', {
          method: 'POST',
          body: {
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, withStitching: i.withStitching })),
            designId: selectedDesign?.id,
          },
        })
        setQuote(q.quote)
      } catch (e) { toast({ title: (e as Error).message, variant: 'destructive' }); return }
    }
    next()
  }

  async function placeOrder() {
    if (!quote || !user) return
    setBusy(true)
    try {
      const addr = selectedAddressId ? addresses.find((a) => a.id === selectedAddressId)! : addrForm

      const result = await api<{ orderId: string; orderNumber: string; advanceAmount: number }>('/checkout/initiate', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, withStitching: i.withStitching })),
          designId: selectedDesign?.id,
          designSnapshot: selectedDesign ? {
            designId: selectedDesign.id,
            title: selectedDesign.title,
            imageUrl: selectedDesign.imageUrl,
            category: selectedDesign.category,
            fabric: selectedDesign.fabric,
          } : null,
          measurementSnapshot: measurements,
          address: addr,
          customization,
        },
      })

      setPlacedOrderNumber(result.orderNumber)
      setAdvanceDue(result.advanceAmount)
      setStep('confirmation')
      toast({ title: 'Order request sent! 🎉', description: 'The seller has been notified.' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-wine-950/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl border border-wine-100 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Stepper */}
        <div className="px-6 pt-6 pb-3 border-b border-wine-100">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center border-2 text-[11px] font-bold transition-colors',
                    i < stepIdx ? 'bg-emerald-500 border-emerald-500 text-white' : i === stepIdx ? 'bg-wine-700 border-wine-700 text-white' : 'bg-card border-wine-200 text-muted-foreground')}>
                    {i < stepIdx ? <Check className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[9px] mt-1 font-medium text-muted-foreground hidden sm:block">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 mx-1 -mt-4', i < stepIdx ? 'bg-emerald-500' : 'bg-wine-100')} />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'cart' && (
              <motion.div key="cart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                {items.map((it) => (
                  <div key={it.id} className="flex gap-3 items-center bg-cream/40 rounded-2xl p-3">
                    <div className="w-12 h-14 rounded-lg overflow-hidden bg-cream-dark shrink-0">
                      <SmartImage src={it.product.images[0]} alt={it.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{it.product.name}</div>
                      <div className="text-xs text-muted-foreground">Qty {it.quantity} · Size {it.size}{it.withStitching && ' · ✂ stitched'}</div>
                    </div>
                    <div className="text-sm font-bold text-wine-800">{inr(it.product.price * it.quantity)}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {step === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm text-muted-foreground">Your name and email are auto-filled from your login profile.</p>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <div><Label>Full name</Label><Input value={user?.name || ''} disabled className="mt-1.5 bg-cream" /></div>
                  <div><Label>Email</Label><Input value={user?.email || ''} disabled className="mt-1.5 bg-cream" /></div>
                </div>
              </motion.div>
            )}

            {step === 'address' && (
              <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {addresses.length > 0 && (
                  <div className="space-y-2">
                    {addresses.map((a) => (
                      <button key={a.id} onClick={() => { setSelectedAddressId(a.id); setShowAddrForm(false) }}
                        className={cn('w-full text-left p-3 rounded-2xl border-2 transition-colors',
                          selectedAddressId === a.id && !showAddrForm ? 'border-wine-700 bg-wine-50' : 'border-wine-100 hover:border-gold-400')}>
                        <div className="text-sm font-semibold">{a.fullName} {a.isDefault && <span className="text-[10px] text-gold-700">★ default</span>}</div>
                        <div className="text-xs text-muted-foreground">{a.line1}, {a.city}, {a.state} {a.pincode}</div>
                        <div className="text-xs text-muted-foreground">📞 {a.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => { setShowAddrForm(true); setSelectedAddressId('') }} className="text-sm text-wine-700 font-semibold flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add a new address
                </button>
                {showAddrForm && (
                  <div className="grid sm:grid-cols-2 gap-3 bg-cream/30 rounded-2xl p-4">
                    <div><Label>Full name *</Label><Input value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} className="mt-1.5 bg-cream" /></div>
                    <div><Label>Phone *</Label><Input value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} maxLength={10} className="mt-1.5 bg-cream" /></div>
                    <div className="sm:col-span-2"><Label>House / Flat, Building *</Label><Input value={addrForm.line1} onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })} className="mt-1.5 bg-cream" /></div>
                    <div className="sm:col-span-2"><Label>Street, Area</Label><Input value={addrForm.line2} onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })} className="mt-1.5 bg-cream" /></div>
                    <div><Label>Landmark</Label><Input value={addrForm.landmark} onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })} className="mt-1.5 bg-cream" /></div>
                    <div><Label>City *</Label><Input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} className="mt-1.5 bg-cream" /></div>
                    <div><Label>State *</Label><Input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} className="mt-1.5 bg-cream" /></div>
                    <div><Label>PIN *</Label><Input value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} maxLength={6} className="mt-1.5 bg-cream" /></div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'measurements' && (
              <motion.div key="measurements" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                {measurements ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="text-sm font-semibold text-emerald-800 flex items-center gap-2"><Check className="w-4 h-4" /> Measurements loaded</div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {Object.entries(measurements).filter(([k, v]) => k !== 'unit' && v != null).map(([k, v]) => (
                        <div key={k} className="flex justify-between"><span className="text-muted-foreground capitalize">{k}</span><span className="font-semibold">{String(v)} {k === 'weight' ? 'kg' : measurements.unit}</span></div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3">A frozen snapshot of these measurements will be saved with this order.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Ruler className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-3">No measurements saved yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">This step is optional — you can skip and provide measurements later via chat.</p>
                    <Button className="mt-4 bg-wine-700 hover:bg-wine-800 text-white rounded-full" onClick={() => navigate({ name: 'dashboard', category: 'measurements' })}>Add measurements</Button>
                    <p className="text-[11px] text-muted-foreground mt-3">or just click <span className="font-semibold text-wine-700">Continue</span> to skip</p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'design' && (
              <motion.div key="design" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <button onClick={() => setSelectedDesign(null)} className={cn('w-full p-4 rounded-2xl border-2 text-sm text-left', !selectedDesign ? 'border-wine-700 bg-wine-50' : 'border-wine-100')}>
                  No custom design — use product as-is
                </button>
                {designs.length > 0 ? (
                  <div>
                    <div className="text-sm font-semibold text-wine-900 mb-2">Pick from your AI designs (optional)</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {designs.map((d) => (
                        <button key={d.id} onClick={() => setSelectedDesign(d)} className={cn('aspect-[3/4] rounded-xl overflow-hidden border-2', selectedDesign?.id === d.id ? 'border-wine-700' : 'border-wine-100')}>
                          <img src={d.imageUrl} alt={d.title} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-cream/30 rounded-2xl">
                    <Sparkles className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">No AI designs saved yet — this step is optional.</p>
                    <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => navigate({ name: 'ai-studio' })}>Generate a design →</Button>
                  </div>
                )}
                {selectedDesign && (
                  <div className="flex gap-3 bg-cream/40 rounded-2xl p-3">
                    <img src={selectedDesign.imageUrl} alt={selectedDesign.title} className="w-20 h-24 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{selectedDesign.title}</div>
                      <div className="text-xs text-muted-foreground">{selectedDesign.category}</div>
                    </div>
                    <button onClick={() => setSelectedDesign(null)} className="text-xs text-red-500">Remove</button>
                  </div>
                )}
                <div>
                  <Label>Customization instructions (optional)</Label>
                  <Textarea value={customization} onChange={(e) => setCustomization(e.target.value)} rows={3} placeholder="e.g. Mandarin collar, gold buttons, knee-length…" className="mt-1.5 bg-cream" />
                </div>
                <p className="text-[11px] text-muted-foreground text-center">Both design and customization are optional — click <span className="font-semibold text-wine-700">Continue</span> to skip</p>
              </motion.div>
            )}

            {step === 'summary' && quote && (
              <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="bg-cream/40 rounded-2xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Items ({items.length})</span><span className="font-semibold">{inr(quote.totalAmount)}</span></div>
                  <div className="flex justify-between text-emerald-600"><span>Delivery</span><span className="font-semibold">FREE</span></div>
                  <div className="border-t border-dashed border-wine-200 pt-2 flex justify-between text-base font-bold">
                    <span>Total</span><span className="text-wine-800">{inr(quote.totalAmount)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-gold-50 border border-gold-200 rounded-xl p-3">
                      <div className="text-[10px] text-muted-foreground">Due later (25% advance)</div>
                      <div className="font-display font-bold text-lg text-gold-800">{inr(quote.advanceAmount)}</div>
                    </div>
                    <div className="bg-wine-50 border border-wine-200 rounded-xl p-3">
                      <div className="text-[10px] text-muted-foreground">When ready (75%)</div>
                      <div className="font-display font-bold text-lg text-wine-800">{inr(quote.remainingAmount)}</div>
                    </div>
                  </div>
                  <div className="bg-cream rounded-xl p-3 mt-2 text-xs text-muted-foreground leading-relaxed">
                    ℹ️ Your order request will be sent to the tailor. You'll pay the 25% advance from your orders page once you're ready. The tailor will see your phone number and can chat with you before payment.
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'confirmation' && (
              <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </motion.div>
                <div className="font-display font-bold text-2xl mt-4 text-wine-900">Order request sent!</div>
                {placedOrderNumber && (
                  <div className="mt-2 inline-block bg-cream border border-wine-200 rounded-full px-4 py-1.5 text-sm font-semibold text-wine-800">
                    Order #{placedOrderNumber}
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto">
                  The seller has been notified and can see your phone number to chat. Pay the 25% advance ({inr(advanceDue)}) when you're ready to start production.
                </p>
                <Button onClick={onDone} className="mt-5 bg-wine-700 hover:bg-wine-800 text-white rounded-xl">View my orders</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step !== 'confirmation' && (
          <div className="px-6 py-4 border-t border-wine-100 flex items-center justify-between bg-cream/20">
            <Button variant="ghost" onClick={back} disabled={stepIdx === 0} className="rounded-full gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <span className="text-xs text-muted-foreground">Step {stepIdx + 1} of {STEPS.length}</span>
            {step === 'summary' ? (
              <Button onClick={placeOrder} disabled={busy} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-1.5">
                {busy ? 'Sending…' : 'Place order request'} <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={proceed} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-1.5">
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
