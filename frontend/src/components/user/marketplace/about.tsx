'use client'

import { motion } from 'framer-motion'
import { Building2, Cpu, Scissors } from 'lucide-react'

export function AboutView() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-gold-700 bg-gold-100 rounded-full px-3 py-1 mb-3">Our story</span>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-wine-900">Fashion, tailored by intelligence</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          AI Tailor bridges India&apos;s 7-lakh strong tailoring workforce with modern AI. Customers design with words,
          preview virtually, and local master tailors craft the final garment — preserving craft, creating livelihoods.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-5 mb-12">
        {[
          { icon: Cpu, title: 'Our AI engine', desc: 'Generative design, virtual try-on, recommendations and an assistant — all grounded in real shop inventory and honest prices.' },
          { icon: Scissors, title: 'Our tailors', desc: 'Every shop is verified before listing. Sellers control pricing, approvals and delivery promises.' },
          { icon: Building2, title: 'Our promise', desc: 'Perfect fit from your saved measurements, pay-after-approval orders, and private-by-default photos.' },
        ].map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-3xl border border-wine-100 p-6 shadow-sm">
            <c.icon className="w-8 h-8 text-gold-600" />
            <h3 className="font-display font-bold text-lg mt-3 text-wine-900">{c.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{c.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {[
          { v: '500+', l: 'Verified tailors' }, { v: '12K+', l: 'Customers served' },
          { v: '35K+', l: 'AI designs' }, { v: '4.8★', l: 'Platform rating' },
        ].map((s) => (
          <div key={s.l} className="bg-cream rounded-3xl border border-wine-100 p-6">
            <div className="font-display text-3xl font-bold text-wine-800">{s.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
