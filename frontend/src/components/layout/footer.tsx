'use client'

import { useAppStore } from '@/store/app-store'
import { Sparkles, MapPin, MessageCircle, ShieldCheck, Star } from 'lucide-react'

export function Footer() {
  const navigate = useAppStore((s) => s.navigate)
  const go = useAppStore((s) => s.go)

  return (
    <footer className="mt-auto bg-wine-900 text-wine-100">
      {/* Ticker */}
      <div className="border-b border-wine-800 overflow-hidden py-3">
        <div className="flex whitespace-nowrap animate-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center gap-10 pr-10 text-sm font-medium tracking-wide text-gold-300/90">
              <span>✦ AI DESIGN STUDIO</span><span>✦ VIRTUAL TRY-ON</span><span>✦ PERFECT FIT GUARANTEE</span>
              <span>✦ 500+ VERIFIED TAILORS</span><span>✦ DOORSTEP DELIVERY</span><span>✦ CUSTOM MEASUREMENTS</span>
              <span>✦ LIVE CHAT WITH TAILORS</span><span>✦ SECURE PAYMENTS</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-wine-900" />
            </div>
            <span className="font-display font-bold text-xl text-white">AI Tailor</span>
          </div>
          <p className="text-sm text-wine-200/80 leading-relaxed">
            India&apos;s AI-powered custom tailoring marketplace. Design with AI, try virtually, stitch with trusted local tailors.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3 uppercase tracking-wider">Marketplace</h4>
          <ul className="space-y-2 text-sm text-wine-200/80">
            <li><button className="hover:text-gold-300 transition-colors" onClick={() => navigate({ name: 'explore' })}>Explore Products</button></li>
            <li><button className="hover:text-gold-300 transition-colors" onClick={() => navigate({ name: 'categories' })}>Categories</button></li>
            <li><button className="hover:text-gold-300 transition-colors" onClick={() => navigate({ name: 'designers' })}>Fashion Designers</button></li>
            <li><button className="hover:text-gold-300 transition-colors" onClick={() => navigate({ name: 'find-tailors' })}>Nearby Tailors</button></li>
            {/* NEW: Testimonials link */}
            <li><button className="hover:text-gold-300 transition-colors flex items-center gap-1.5" onClick={() => go('/testimonials')}><Star className="w-3.5 h-3.5 text-gold-400" /> Testimonials</button></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3 uppercase tracking-wider">AI Features</h4>
          <ul className="space-y-2 text-sm text-wine-200/80">
            <li><button className="hover:text-gold-300 transition-colors" onClick={() => navigate({ name: 'ai-studio' })}>AI Design Studio</button></li>
            <li><button className="hover:text-gold-300 transition-colors" onClick={() => navigate({ name: 'tryon' })}>Virtual Try-On</button></li>
            <li><button className="hover:text-gold-300 transition-colors" onClick={() => navigate({ name: 'ai-studio' })}>Fashion Assistant</button></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3 uppercase tracking-wider">Trust & Support</h4>
          <ul className="space-y-2.5 text-sm text-wine-200/80">
            <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gold-400" /> Verified sellers only</li>
            <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-gold-400" /> 24×7 chat support</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gold-400" /> Pune · Mumbai · Nashik</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-wine-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-wine-300/70">
          <span>© {new Date().getFullYear()} AI Tailor Platform · Crafted with 🧵 in Pune</span>
          <span>Demo build — payments &amp; maps are simulated for preview</span>
        </div>
      </div>
    </footer>
  )
}
