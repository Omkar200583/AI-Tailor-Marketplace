'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { Design, Product, Seller } from '@/types'
import { SmartImage, Spinner, SectionHeading, Avatar } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/helpers'
import {
  Sparkles, Wand2, Shirt, Palette, Scissors, Send, Save, RefreshCw, Zap, MessageCircle, History, Loader2, X, ScanFace,
} from 'lucide-react'

const CATEGORIES = ['Kurta', 'Saree', 'Lehenga', 'Sherwani', 'Kurti', 'Blouse', 'Kids Wear', 'Gown']
const FABRICS = ['Silk', 'Cotton', 'Georgette', 'Velvet', 'Chanderi', 'Linen']
const COLORS = [
  { name: 'Black', hex: '#1C1917' }, { name: 'Gold', hex: '#D69A28' }, { name: 'Maroon', hex: '#7C2D3E' },
  { name: 'Ivory', hex: '#F5F0E6' }, { name: 'Royal Red', hex: '#B91C1C' }, { name: 'Emerald', hex: '#047857' },
  { name: 'Rani Pink', hex: '#BE185D' }, { name: 'Navy', hex: '#1E3A5F' },
]

const IDEAS = [
  'Black wedding kurta with golden embroidery and traditional Indian patterns',
  'मला लग्नासाठी रात्रीचा गडद हिरवा शेरवानी हवा आहे सोन्याच्या कढ़ाईसह',
  'Pastel pink bridal lehenga with mirror work and sequin dupatta',
  'Office kurti with jaipuri block print, mandarin collar and pockets',
]

// ═══════════════ AI Design Studio ═══════════════
export function AIStudioView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)

  const [prompt, setPrompt] = useState('')
  const [category, setCategory] = useState('Kurta')
  const [fabric, setFabric] = useState('Silk')
  const [colors, setColors] = useState<string[]>(['Maroon', 'Gold'])
  const [generating, setGenerating] = useState(false)
  const [stage, setStage] = useState(0)
  const [current, setCurrent] = useState<Design | null>(null)
  const [history, setHistory] = useState<Design[]>([])
  const [sendDialog, setSendDialog] = useState<Design | null>(null)
  const [sellers, setSellers] = useState<Seller[]>([])
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  const stages = ['Understanding your prompt…', 'Sketching silhouettes & collars…', 'Rendering fabric & embroidery…', 'Polishing final design…']

  useEffect(() => {
    if (!user) return
    api<{ designs: Design[] }>('/designs').then((d) => setHistory(d.designs)).catch(() => null)
    api<{ sellers: Seller[] }>('/sellers?verified=1').then((d) => setSellers(d.sellers)).catch(() => null)
  }, [user])

  useEffect(() => {
    if (!generating) { setStage(0); return }
    const t = setInterval(() => setStage((s) => (s + 1) % stages.length), 1800)
    return () => clearInterval(t)
     
  }, [generating])

  async function generate() {
    if (!user) { useAppStore.getState().setAuthOpen(true); return }
    if (!prompt.trim()) { toast({ title: 'Describe your outfit first ✍️', variant: 'destructive' }); return }
    setGenerating(true)
    setCurrent(null)
    try {
      const d = await api<{ design: Design }>('/designs', { method: 'POST', body: { prompt, category, fabric, colors } })
      setCurrent(d.design)
      setHistory((h) => [d.design, ...h])
      toast({ title: 'Design ready! ✨', description: 'Save it or send it straight to a tailor.' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  async function sendToTailor(designId: string, sellerId: string) {
    setSendingTo(sellerId)
    try {
      await api(`/designs/${designId}`, { method: 'PATCH', body: { action: 'send-to-tailor', sellerId } })
      toast({ title: 'Sent to tailor! 🎨', description: 'Open Messages to discuss fabric, price & delivery.' })
      setSendDialog(null)
      navigate({ name: 'dashboard', category: 'messages' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally { setSendingTo(null) }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <SectionHeading
        kicker="Module 1 — AI Fashion Design Generator"
        title="AI Design Studio"
        subtitle="Describe your dream outfit in any language. AI paints it — you send it to a master tailor for stitching."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Prompt panel */}
        <div className="lg:col-span-2 space-y-5">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl border border-wine-100 p-6 shadow-sm">
            <label className="text-sm font-semibold flex items-center gap-2"><Wand2 className="w-4 h-4 text-gold-600" /> Describe your design</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "Black wedding kurta with golden embroidery and traditional Indian patterns"'
              rows={4}
              className="mt-2 bg-cream border-wine-200"
            />
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {IDEAS.map((idea, i) => (
                <button key={i} onClick={() => setPrompt(idea)} className="text-[11px] bg-gold-50 hover:bg-gold-100 border border-gold-200 text-gold-900 rounded-full px-2.5 py-1 transition-colors text-left">
                  ✨ {idea.slice(0, 44)}{idea.length > 44 ? '…' : ''}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategory(c)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    category === c ? 'bg-wine-700 text-white border-wine-700' : 'bg-cream border-wine-200 hover:border-wine-400')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fabric</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {FABRICS.map((f) => (
                  <button key={f} onClick={() => setFabric(f)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    fabric === f ? 'bg-gold-500 text-white border-gold-500' : 'bg-cream border-wine-200 hover:border-gold-400')}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Colours</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {COLORS.map((c) => (
                  <motion.button
                    key={c.name}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setColors((cs) => cs.includes(c.name) ? cs.filter((x) => x !== c.name) : [...cs, c.name])}
                    className={cn('relative w-9 h-9 rounded-full border-2 transition-all', colors.includes(c.name) ? 'border-wine-700 scale-110 shadow-md' : 'border-wine-100')}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={c.name}
                  >
                    {colors.includes(c.name) && <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow">✓</span>}
                  </motion.button>
                ))}
              </div>
            </div>

            <Button
              onClick={generate}
              disabled={generating}
              className="w-full mt-6 h-12 bg-gradient-to-r from-wine-700 to-wine-800 hover:from-wine-800 hover:to-wine-900 text-white rounded-2xl font-bold gap-2 shadow-xl shadow-wine-700/25"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {generating ? 'Designing…' : 'Generate design'}
            </Button>
            {!user && <p className="text-[11px] text-muted-foreground text-center mt-2">Login free to generate & save designs</p>}
          </motion.div>

          {/* History */}
          {history.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-3xl border border-wine-100 p-5 shadow-sm">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3"><History className="w-4 h-4 text-wine-700" /> Recent designs</h3>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {history.slice(0, 8).map((d) => (
                  <button key={d.id} onClick={() => setCurrent(d)} className="rounded-xl overflow-hidden border border-wine-100 hover:border-gold-400 transition-colors" title={d.title}>
                    <SmartImage src={d.imageUrl} alt={d.title} className="w-full aspect-[3/4] object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Result canvas */}
        <div className="lg:col-span-3">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-3xl border border-wine-100 shadow-sm overflow-hidden min-h-[560px] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-wine-100 bg-cream/40">
              <span className="text-sm font-bold flex items-center gap-2"><Shirt className="w-4 h-4 text-wine-700" /> Design canvas</span>
              {current && <span className="text-[11px] text-muted-foreground">{current.category} · {timeAgo(current.createdAt)}</span>}
            </div>

            <div className="flex-1 relative flex items-center justify-center p-6">
              {generating ? (
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    className="w-24 h-24 mx-auto rounded-full border-4 border-dashed border-wine-300 flex items-center justify-center"
                  >
                    <Scissors className="w-8 h-8 text-wine-700" />
                  </motion.div>
                  <div className="mt-6 space-y-1.5">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={stage}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-sm font-semibold text-wine-800"
                      >
                        {stages[stage]}
                      </motion.p>
                    </AnimatePresence>
                    <p className="text-xs text-muted-foreground">Usually takes 8–20 seconds on the AI engine</p>
                  </div>
                  <div className="mt-5 w-56 h-2 bg-wine-100 rounded-full overflow-hidden mx-auto">
                    <motion.div animate={{ x: ['-100%', '250%'] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }} className="w-1/3 h-full bg-gradient-to-r from-wine-600 to-gold-500 rounded-full" />
                  </div>
                </div>
              ) : current ? (
                <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                  <div className="max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-wine-900/20 relative">
                    <SmartImage src={current.imageUrl} alt={current.title} className="w-full aspect-[3/4] object-cover" fallbackClass="from-wine-100 to-gold-100 aspect-[3/4]" />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur rounded-2xl p-3"
                    >
                      <div className="text-xs font-bold text-wine-900 line-clamp-1">{current.title}</div>
                      <div className="text-[10px] text-muted-foreground">{current.fabric}{Array.isArray(current.colors) && current.colors.length > 0 ? ` · ${current.colors.join(', ')}` : ''}</div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center px-8">
                  <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-6xl mb-4">🪄</motion.div>
                  <h3 className="font-display font-bold text-xl text-wine-900">Your canvas awaits</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                    Write a prompt like <i>&ldquo;black wedding kurta with golden embroidery&rdquo;</i>, pick fabric &amp; colours, and hit generate.
                  </p>
                </div>
              )}
            </div>

            {current && !generating && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-6 pb-6 flex flex-wrap gap-2.5">
                <Button onClick={() => setSendDialog(current)} className="flex-1 min-w-40 h-11 bg-wine-700 hover:bg-wine-800 text-white rounded-xl gap-2 font-semibold">
                  <Send className="w-4 h-4" /> Send to tailor
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => { await api(`/designs/${current.id}`, { method: 'PATCH', body: { action: 'save' } }); toast({ title: 'Design saved ★' }) }}
                  className="h-11 rounded-xl gap-2 border-wine-300 text-wine-800"
                >
                  <Save className="w-4 h-4" /> Save
                </Button>
                <Button onClick={generate} variant="outline" className="h-11 rounded-xl gap-2 border-wine-300 text-wine-800">
                  <RefreshCw className="w-4 h-4" /> Regenerate
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Send to tailor dialog */}
      <Dialog open={!!sendDialog} onOpenChange={(open) => !open && setSendDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-wine-900">Choose a tailor</DialogTitle>
            <DialogDescription>Your design + prompt will be shared in chat for pricing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {sellers.map((s) => (
              <button
                key={s.id}
                onClick={() => sendDialog && sendToTailor(sendDialog.id, s.id)}
                disabled={!!sendingTo}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-wine-100 bg-cream hover:border-gold-400 hover:bg-gold-50 transition-all text-left disabled:opacity-60"
              >
                <Avatar name={s.shopName} color="#7C2D3E" size={42} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{s.shopName}</div>
                  <div className="text-xs text-muted-foreground">{s.specialization} · ⭐ {s.rating.toFixed(1)}</div>
                </div>
                {sendingTo === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4 text-wine-400" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════ Virtual Try-On ═══════════════
const TRYON_STAGES = [
  'Uploading your photo…',
  'Detecting body landmarks…',
  'Segmenting person & garment…',
  'Fitting outfit to your pose…',
  'Rendering final preview…',
]

export function TryOnView() {
  const user = useAppStore((s) => s.user)
  const [products, setProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [stage, setStage] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api<{ products: Product[] }>('/products?limit=12&sort=rating').then((d) => setProducts(d.products)).catch(() => null)
  }, [])

  useEffect(() => {
    if (!processing) { setStage(0); return }
    const t = setInterval(() => setStage((s) => Math.min(s + 1, TRYON_STAGES.length - 1)), 1300)
    return () => clearInterval(t)
  }, [processing])

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast({ title: 'Please upload an image file', variant: 'destructive' }); return }
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function runTryOn() {
    if (!user) { useAppStore.getState().setAuthOpen(true); return }
    if (!photo) { toast({ title: 'Upload your photo first 📸', variant: 'destructive' }); return }
    if (!selected) { toast({ title: 'Pick an outfit to try on', variant: 'destructive' }); return }
    setProcessing(true)
    setResult(null)
    try {
      const d = await api<{ session: { resultImage: string } }>('/tryon', { method: 'POST', body: { productId: selected.id, userPhoto: photo } })
      await new Promise((r) => setTimeout(r, 1800)) // let stages play
      setResult(d.session.resultImage)
      toast({ title: 'Try-on ready! 🪞', description: 'This is a visual preview, not exact fitting.' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <SectionHeading
        kicker="Module 2 — Virtual Try-On"
        title="Virtual Fitting Room"
        subtitle="Upload your photo, pick an outfit and preview the look. (Visual preview — not a fitting guarantee.)"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Photo upload + result */}
        <div className="bg-card rounded-3xl border border-wine-100 p-6 shadow-sm">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-4"><ScanFaceIcon /> Your photo</h3>
          <div className="relative rounded-3xl overflow-hidden bg-cream border-2 border-dashed border-wine-200 aspect-[3/4]">
            {processing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream/90 p-6 text-center">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} className="w-16 h-16 rounded-full bg-wine-700/10 flex items-center justify-center">
                  <ScanFaceIcon />
                </motion.div>
                <AnimatePresence mode="wait">
                  <motion.p key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs font-semibold text-wine-800 mt-4">
                    {TRYON_STAGES[stage]}
                  </motion.p>
                </AnimatePresence>
                <div className="mt-4 w-44 h-1.5 bg-wine-100 rounded-full overflow-hidden">
                  <motion.div animate={{ width: ['20%', '95%'] }} transition={{ duration: 7, ease: 'easeInOut' }} className="h-full bg-gradient-to-r from-wine-600 to-gold-500" />
                </div>
              </div>
            ) : result ? (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full">
                { }
                <img src={result} alt="Try-on result" className="w-full h-full object-cover" />
                <span className="absolute bottom-3 left-3 bg-wine-700/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">AI PREVIEW</span>
              </motion.div>
            ) : photo ? (
              <>
                { }
                <img src={photo} alt="Your upload" className="w-full h-full object-cover" />
                <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow" aria-label="Remove photo"><X className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 hover:bg-gold-50/50 transition-colors">
                <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.4 }} className="text-4xl mb-3">📸</motion.span>
                <span className="text-sm font-semibold text-wine-800">Upload your photo</span>
                <span className="text-[11px] text-muted-foreground mt-1">Front-facing, full upper body works best</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" aria-label="Photo upload" />
          <Button onClick={runTryOn} disabled={processing} className="w-full mt-4 h-12 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-wine-900 rounded-2xl font-bold gap-2 shadow-lg shadow-gold-500/30">
            <Zap className="w-5 h-5" /> {processing ? 'Fitting…' : 'Try it on me'}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-2.5 leading-relaxed">🔒 Photo stays private — visible only to you, deleted on request. AI training needs separate consent.</p>
        </div>

        {/* Outfit picker */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-3xl border border-wine-100 p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Shirt className="w-4 h-4 text-wine-700" /> Pick an outfit ({products.length})</h3>
            {products.length === 0 ? (
              <Spinner />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[480px] overflow-y-auto p-1">
                {products.map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelected(p)}
                    className={cn(
                      'rounded-2xl overflow-hidden border-2 transition-all text-left',
                      selected?.id === p.id ? 'border-gold-500 shadow-lg shadow-gold-500/25 scale-[1.03]' : 'border-wine-100'
                    )}
                  >
                    <div className="aspect-[3/4] bg-cream-dark">
                      <SmartImage src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <div className="text-[10px] font-semibold line-clamp-1">{p.name}</div>
                      <div className="text-[10px] text-wine-800 font-bold">₹{p.price.toLocaleString('en-IN')}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
            {selected && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-3 bg-gold-50 border border-gold-200 rounded-2xl p-3.5">
                <div className="w-11 h-13 h-[52px] rounded-xl overflow-hidden">
                  <SmartImage src={selected.images[0]} alt={selected.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{selected.name}</div>
                  <div className="text-xs text-muted-foreground">{selected.seller.shopName} · {selected.fabric}</div>
                </div>
                <Button size="sm" onClick={() => useAppStore.getState().navigate({ name: 'product', id: selected.id })} variant="outline" className="rounded-full text-xs border-gold-400 text-gold-800">
                  View product
                </Button>
              </motion.div>
            )}
          </div>

          <div className="mt-5 bg-gradient-to-br from-wine-800 to-wine-900 rounded-3xl p-6 text-white relative overflow-hidden">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 40, ease: 'linear' }} className="absolute -right-10 -top-10 w-36 h-36 border-2 border-dashed border-gold-400/30 rounded-full" />
            <h3 className="font-display font-bold text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-gold-400" /> How it works</h3>
            <div className="grid sm:grid-cols-3 gap-4 mt-4 text-xs text-wine-200/90">
              {[
                'Photo is preprocessed & the person is segmented on-device.',
                'Garment is warped to your pose by the try-on model (IDM-VTON / CatVTON class).',
                'Final preview is saved to your Try-On History — never shared.',
              ].map((t, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
                  <span className="inline-flex w-5 h-5 rounded-full bg-gold-500 text-wine-900 text-[10px] font-bold items-center justify-center mb-2">{i + 1}</span>
                  <p className="leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScanFaceIcon() {
  return <ScanFace className="w-5 h-5 text-wine-700" />
}

// ═══════════════ AI Assistant (floating) ═══════════════
interface AssistantMsg { role: 'user' | 'assistant'; content: string }

export function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AssistantMsg[]>([
    { role: 'assistant', content: 'नमस्ते! 👋 I\'m your AI fashion assistant. Tell me the occasion, budget or style — I\'ll find real outfits and tailors from our marketplace. Try: "मला 1500 रुपयात कुर्ता पाहिजे"' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    const content = input.trim()
    if (!content || busy) return
    const next = [...messages, { role: 'user' as const, content }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const d = await api<{ reply: string }>('/assistant', { method: 'POST', body: { messages: next.slice(-6) } })
      setMessages((m) => [...m, { role: 'assistant', content: d.reply }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I hit a snag. Please try again!' }])
    } finally { setBusy(false) }
  }

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-wine-700 to-wine-900 shadow-2xl shadow-wine-700/40 flex items-center justify-center"
        aria-label="AI Fashion Assistant"
      >
        <AnimatePresence mode="wait">
          <motion.span key={open ? 'x' : 'chat'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
            {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-gold-300" />}
          </motion.span>
        </AnimatePresence>
        {!open && (
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-500 border-2 border-white" />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            className="fixed bottom-24 right-5 z-50 w-[92vw] max-w-sm bg-card rounded-3xl shadow-2xl border border-wine-100 overflow-hidden flex flex-col"
            style={{ height: 'min(540px, 70vh)' }}
          >
            <div className="p-4 bg-gradient-to-r from-wine-700 to-wine-800 text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center"><Sparkles className="w-4.5 h-4.5 w-[18px] h-[18px] text-wine-900" /></div>
              <div>
                <div className="font-bold text-sm">AI Fashion Assistant</div>
                <div className="text-[10px] text-wine-200">Powered by live marketplace data</div>
              </div>
            </div>
            <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream/30">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
                    m.role === 'user' ? 'bg-wine-700 text-white rounded-br-md' : 'bg-card border border-wine-100 rounded-bl-md'
                  )}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-card border border-wine-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-wine-400" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-wine-400" />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-wine-400" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-wine-100 flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask about outfits, budget…" className="flex-1 h-10 bg-cream border-wine-200 rounded-full text-sm" aria-label="Assistant input" />
              <Button onClick={send} disabled={busy} size="icon" className="w-10 h-10 rounded-full bg-wine-700 hover:bg-wine-800" aria-label="Send">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
