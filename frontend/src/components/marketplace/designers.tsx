'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { Designer } from '@/types'
import { Spinner, Avatar, RatingStars, SmartImage, EmptyState, staggerContainer, staggerItem, SectionHeading } from '@/components/common/ui-bits'
import { Palette, MapPin, Award, ArrowRight } from 'lucide-react'

export function DesignersListView() {
  const navigate = useAppStore((s) => s.navigate)
  const [designers, setDesigners] = useState<Designer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ designers: Designer[] }>('/designers').then((d) => setDesigners(d.designers)).catch(() => null).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <SectionHeading kicker="Meet the artists" title="Fashion Designers" subtitle="Award-winning designers whose collections you can commission through AI Tailor." />
      {designers.length === 0 ? (
        <EmptyState icon="🎨" title="No designers yet" />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-6">
          {designers.map((d) => (
            <motion.div
              key={d.id}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              onClick={() => navigate({ name: 'designer', id: d.id })}
              className="bg-card rounded-3xl border border-wine-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-wine-700/10 transition-shadow cursor-pointer flex flex-col sm:flex-row"
            >
              <div className="sm:w-44 shrink-0 aspect-[4/3] sm:aspect-auto relative bg-gradient-to-br from-wine-100 to-gold-100">
                <SmartImage src={d.portfolioImage ?? undefined} alt={d.user?.name || d.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1">
                <div className="flex items-center gap-3">
                  <Avatar name={d.user?.name || 'D'} color={d.user?.avatarColor || '#7C2D3E'} size={42} />
                  <div>
                    <div className="font-semibold">{d.user?.name}</div>
                    <div className="text-xs text-muted-foreground">{d.title}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{d.bio}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-gold-800 font-semibold"><Palette className="w-3.5 h-3.5" /> {d.specialty}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {d.city}</span>
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {d.experienceYears} yrs</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <RatingStars rating={d.rating} size={13} showValue count={d.ratingCount} />
                  <span className="text-xs font-semibold text-wine-700 flex items-center gap-1">View portfolio <ArrowRight className="w-3.5 h-3.5" /></span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

export function DesignerProfileView({ designerId }: { designerId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const back = useAppStore((s) => s.back)
  const [designer, setDesigner] = useState<Designer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ designer: Designer }>(`/designers/${designerId}`).then((d) => setDesigner(d.designer)).catch(() => null).finally(() => setLoading(false))
  }, [designerId])

  if (loading) return <Spinner />
  if (!designer) {
    return (
      <div className="py-24 text-center">
        <p className="text-2xl">🧐</p><p className="mt-2 text-muted-foreground">Designer not found.</p>
        <button className="text-wine-700 underline" onClick={() => navigate({ name: 'designers' })}>All designers</button>
      </div>
    )
  }

  return (
    <div className="pb-10">
      <div className="relative h-56 md:h-72 overflow-hidden bg-gradient-to-br from-wine-800 via-wine-700 to-wine-900">
        <SmartImage src={designer.portfolioImage ?? undefined} alt={designer.user?.name || ''} className="w-full h-full object-cover opacity-45" fallbackClass="from-wine-700 to-wine-900" />
        <div className="absolute inset-0 bg-gradient-to-t from-wine-900/90 to-transparent" />
        <button onClick={back} className="absolute top-4 left-4 text-sm text-white/90 hover:text-white bg-black/30 backdrop-blur px-3.5 py-2 rounded-full">← Back</button>
        <div className="absolute bottom-6 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-end gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="rounded-3xl p-1 bg-gradient-to-br from-gold-400 to-gold-600 shadow-xl">
              <Avatar name={designer.user?.name || 'D'} color={designer.user?.avatarColor || '#7C2D3E'} size={88} />
            </motion.div>
            <div className="pb-1">
              <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl font-bold text-white">{designer.user?.name}</motion.h1>
              <p className="text-gold-300 text-sm font-semibold">{designer.title} · {designer.specialty}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl border border-wine-100 p-7">
            <h2 className="font-display font-bold text-xl text-wine-900">The designer&apos;s story</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">{designer.bio}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { v: `${designer.experienceYears}+`, l: 'years in fashion' },
                { v: designer.rating.toFixed(1), l: `rating (${designer.ratingCount})` },
                { v: designer.city, l: 'based in' },
              ].map((s) => (
                <div key={s.l} className="bg-cream rounded-2xl p-4 text-center border border-wine-100/60">
                  <div className="font-display text-xl font-bold text-wine-900">{s.v}</div>
                  <div className="text-[11px] text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-6 rounded-3xl bg-gradient-to-br from-gold-500 to-gold-600 p-7 text-wine-900 relative overflow-hidden">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 30, ease: 'linear' }} className="absolute -right-10 -bottom-10 w-40 h-40 border-[3px] border-dashed border-white/40 rounded-full" />
            <h3 className="font-display font-bold text-xl">Commission a custom piece</h3>
            <p className="text-sm text-wine-900/80 mt-1.5 max-w-md">{designer.user?.name.split(' ')[0]} creates bespoke designs through the AI Design Studio. Describe your occasion, budget and style — the studio does the rest.</p>
            <button
              onClick={() => navigate({ name: 'ai-studio' })}
              className="mt-4 inline-flex items-center gap-2 bg-wine-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-wine-800 transition-colors"
            >
              <Palette className="w-4 h-4" /> Start a design
            </button>
          </motion.section>
        </div>

        <div className="space-y-5">
          <div className="bg-card rounded-3xl border border-wine-100 p-6">
            <h3 className="font-semibold mb-3">Rating</h3>
            <RatingStars rating={designer.rating} size={18} showValue count={designer.ratingCount} />
          </div>
          <div className="bg-card rounded-3xl border border-wine-100 p-6">
            <h3 className="font-semibold mb-2">Specialty</h3>
            <span className="text-sm bg-gold-100 text-gold-900 border border-gold-200 rounded-full px-3 py-1.5 inline-block">{designer.specialty}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
