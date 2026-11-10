'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { Product, Seller } from '@/types'
import type { Review } from '@/types'
import { ProductCard } from '@/components/marketplace/product-card'
import { RatingStars, SmartImage, Spinner, Avatar, VerifiedBadge, EmptyState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/helpers'
import { ArrowLeft, MapPin, Clock, Star, Phone, MessageCircle, Scissors, Package, Award, Navigation, Sparkles, Check } from 'lucide-react'

interface TailorData {
  seller: Seller & { completedOrders: number }
  products: Product[]
  reviews: Review[]
}

export function TailorProfileView({ tailorId }: { tailorId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const back = useAppStore((s) => s.back)
  const user = useAppStore((s) => s.user)
  const [data, setData] = useState<TailorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatting, setChatting] = useState(false)

  useEffect(() => {
    setLoading(true)
    api<TailorData>(`/sellers/${tailorId}`)
      .then(setData)
      .catch((e) => toast({ title: e.message, variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [tailorId])

  if (loading) return <Spinner />
  if (!data) {
    return (
      <div className="py-24 text-center">
        <p className="text-2xl">🧐</p><p className="mt-2 text-muted-foreground">Tailor not found.</p>
        <Button variant="link" onClick={() => navigate({ name: 'find-tailors' })}>Find tailors near you</Button>
      </div>
    )
  }

  const { seller, products, reviews } = data

  async function startChat() {
    if (!user) { useAppStore.getState().setAuthOpen(true); return }
    setChatting(true)
    try {
      await api('/chat/conversations', { method: 'POST', body: { sellerId: seller.id } })
      toast({ title: 'Chat opened 💬', description: `Say hello to ${seller.shopName}` })
      navigate({ name: 'dashboard', category: 'messages' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setChatting(false)
    }
  }

  return (
    <div className="pb-10">
      {/* Hero banner */}
      <div className="relative h-52 md:h-64 overflow-hidden">
        <SmartImage src={seller.shopImage ?? undefined} alt={seller.shopName} className="w-full h-full object-cover" fallbackClass="from-wine-700 to-wine-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 via-wine-900/40 to-transparent" />
        <button onClick={back} className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-white/90 hover:text-white bg-black/30 backdrop-blur px-3.5 py-2 rounded-full transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {seller.distanceKm !== undefined && (
          <span className="absolute top-4 right-4 bg-gold-500 text-wine-900 text-xs font-bold px-3 py-1.5 rounded-full shadow">
            📍 {seller.distanceKm} km away
          </span>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Identity card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative -mt-16 bg-card rounded-3xl border border-wine-100 shadow-xl p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <motion.div whileHover={{ scale: 1.05, rotate: -3 }} className="shrink-0">
              <div className="rounded-3xl p-1 bg-gradient-to-br from-gold-400 to-wine-600 shadow-lg">
                <div className="rounded-[20px] bg-card p-1">
                  <Avatar name={seller.shopName} color="#7C2D3E" size={84} />
                </div>
              </div>
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-wine-900">{seller.shopName}</h1>
                <VerifiedBadge status={seller.verificationStatus} />
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1"><Scissors className="w-3.5 h-3.5 text-gold-600" /> {seller.specialization}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {seller.address || seller.city}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {seller.availability}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Button
                onClick={startChat}
                disabled={chatting}
                className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-2 shadow-lg shadow-wine-700/25"
              >
                <MessageCircle className="w-4 h-4" /> {chatting ? 'Opening…' : 'Chat now'}
              </Button>
              {seller.whatsappNumber && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${seller.whatsappNumber!.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${seller.shopName}! I found your shop on AI Tailor.`)}`, '_blank')}
                  className="rounded-full gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Phone className="w-4 h-4" /> WhatsApp
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Star, value: seller.rating.toFixed(1), label: `${seller.ratingCount} reviews`, accent: 'text-amber-500' },
              { icon: Award, value: `${seller.experienceYears}+`, label: 'years experience', accent: 'text-gold-600' },
              { icon: Package, value: `${products.length}`, label: 'products in shop', accent: 'text-wine-700' },
              { icon: Check, value: `${seller.completedOrders}`, label: 'orders completed', accent: 'text-emerald-600' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="bg-cream rounded-2xl p-4 border border-wine-100/60 text-center"
              >
                <s.icon className={`w-5 h-5 mx-auto ${s.accent}`} />
                <div className="font-display text-xl font-bold text-wine-900 mt-1">{s.value}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Left: about + map + services */}
          <div className="space-y-6">
            <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-3xl border border-wine-100 p-6">
              <h2 className="font-display font-bold text-lg text-wine-900">About the shop</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">{seller.description}</p>
              <h3 className="text-sm font-semibold mt-5 mb-2.5">Services offered</h3>
              <div className="flex flex-wrap gap-2">
                {seller.services.map((s) => (
                  <motion.span key={s} whileHover={{ scale: 1.06 }} className="text-xs font-medium bg-gold-100 text-gold-900 border border-gold-200 rounded-full px-3 py-1.5">
                    ✂ {s}
                  </motion.span>
                ))}
              </div>
            </motion.section>

            {/* Mini map */}
            <motion.section initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-wine-100 overflow-hidden">
              <div className="relative h-48 bg-[#EAF0E5]">
                {/* stylized map */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
                  <path d="M0 40 Q100 30 200 45 T400 35" stroke="#CFE0C8" strokeWidth="10" fill="none" />
                  <path d="M0 110 Q120 100 240 115 T400 105" stroke="#D8E6D0" strokeWidth="14" fill="none" />
                  <path d="M0 165 Q140 155 260 170 T400 160" stroke="#CFE0C8" strokeWidth="8" fill="none" />
                  <path d="M70 0 Q80 70 60 140 T75 200" stroke="#E2ECD9" strokeWidth="9" fill="none" />
                  <path d="M190 0 Q200 80 185 150 T200 200" stroke="#DDE9D4" strokeWidth="12" fill="none" />
                  <path d="M310 0 Q300 60 320 130 T305 200" stroke="#E2ECD9" strokeWidth="8" fill="none" />
                  <rect x="30" y="55" width="26" height="20" rx="3" fill="#D8E6D0" />
                  <rect x="240" y="70" width="34" height="24" rx="3" fill="#D8E6D0" />
                  <rect x="110" y="130" width="30" height="22" rx="3" fill="#DDE9D4" />
                  <rect x="340" y="140" width="24" height="18" rx="3" fill="#D8E6D0" />
                </svg>
                {/* shop marker */}
                <motion.div
                  initial={{ scale: 0, y: -30 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.35 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full"
                >
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="flex flex-col items-center">
                    <div className="bg-wine-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap">{seller.shopName}</div>
                    <div className="w-3.5 h-3.5 bg-wine-700 rotate-45 -mt-1.5 rounded-sm shadow" />
                  </motion.div>
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                  transition={{ repeat: Infinity, duration: 2.2 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-wine-600"
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-wine-800 border-2 border-white shadow z-10" />
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{seller.city}</div>
                  <div className="text-xs text-muted-foreground">{seller.lat.toFixed(4)}° N, {seller.lng.toFixed(4)}° E</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5 border-wine-300 text-wine-800"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${seller.lat},${seller.lng}`, '_blank')}
                >
                  <Navigation className="w-3.5 h-3.5" /> Directions
                </Button>
              </div>
            </motion.section>

            {/* Send design promo */}
            <motion.section
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="rounded-3xl bg-gradient-to-br from-wine-800 to-wine-900 p-6 text-white relative overflow-hidden"
            >
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-gold-500/20" />
              <Sparkles className="w-7 h-7 text-gold-400" />
              <h3 className="font-display font-bold text-lg mt-3">Have a design idea?</h3>
              <p className="text-xs text-wine-200 mt-1.5 leading-relaxed">Create it in the AI Studio and send it straight to {seller.shopName.split(' ')[0]} for stitching.</p>
              <Button size="sm" onClick={() => navigate({ name: 'ai-studio' })} className="mt-4 bg-gold-500 hover:bg-gold-600 text-wine-900 rounded-full font-semibold gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Open AI Studio
              </Button>
            </motion.section>
          </div>

          {/* Right: products + reviews */}
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="font-display text-2xl font-bold text-wine-900 mb-5">Shop creations ({products.length})</h2>
              {products.length === 0 ? (
                <EmptyState icon="🧵" title="No products listed yet" subtitle={`${seller.shopName} hasn't added products. Chat with them directly for custom orders!`} />
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold text-wine-900 mb-5">Customer reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card border border-wine-100 rounded-2xl p-5"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={r.customer.name} color={r.customer.avatarColor} size={40} />
                        <div>
                          <div className="text-sm font-semibold">{r.customer.name}</div>
                          <div className="flex items-center gap-2">
                            <RatingStars rating={r.rating} size={11} />
                            <span className="text-[10px] text-muted-foreground">{formatDate(r.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/75 mt-3 leading-relaxed">{r.comment}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
