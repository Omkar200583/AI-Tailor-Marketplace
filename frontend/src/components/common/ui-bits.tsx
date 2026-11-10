'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/helpers'
import { useState, useEffect, useRef } from 'react'

// ---------- Avatar (initials based, no external deps) ----------
export function Avatar({ name, color, size = 40, className }: { name: string; color: string; size?: number; className?: string }) {
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none', className)}
      style={{ width: size, height: size, backgroundColor: color || '#7C2D3E', fontSize: size * 0.38 }}
      aria-label={name}
    >
      {initials(name || '?')}
    </div>
  )
}

// ---------- Rating stars ----------
export function RatingStars({ rating, size = 14, showValue = false, count }: { rating: number; size?: number; showValue?: boolean; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
          />
        ))}
      </div>
      {showValue && <span className="text-xs font-medium text-foreground/80">{rating.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  )
}

// ---------- Animated counter ----------
export function AnimatedCounter({ value, suffix = '', prefix = '', duration = 1.6 }: { value: number; suffix?: string; prefix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const started = useRef(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min((now - start) / (duration * 1000), 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.round(value * eased))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration])

  return (
    <span ref={ref}>
      {prefix}{display.toLocaleString('en-IN')}{suffix}
    </span>
  )
}

// ---------- Product/shop image with graceful fallback ----------
export function SmartImage({ src, alt, className, fallbackClass = 'from-wine-100 to-amber-50' }: { src?: string; alt: string; className?: string; fallbackClass?: string }) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div className={cn('bg-gradient-to-br flex items-center justify-center', fallbackClass, className)} aria-label={alt}>
        <span className="text-3xl opacity-40">🧵</span>
      </div>
    )
  }
  return (
     
    <img src={src} alt={alt} className={className} loading="lazy" onError={() => setError(true)} />
  )
}

// ---------- Section heading with animation ----------
export function SectionHeading({ kicker, title, subtitle, center = false }: { kicker?: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55 }}
      className={cn('mb-8', center && 'text-center')}
    >
      {kicker && (
        <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary/80 bg-primary/5 border border-primary/10 rounded-full px-3 py-1 mb-3">
          {kicker}
        </span>
      )}
      <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className={cn('text-muted-foreground mt-2 max-w-2xl text-sm md:text-base', center && 'mx-auto')}>{subtitle}</p>}
    </motion.div>
  )
}

// ---------- Spinner ----------
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)} role="status" aria-label="Loading">
      <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" style={{ borderWidth: 3 }} />
    </div>
  )
}

// ---------- Empty state ----------
export function EmptyState({ icon, title, subtitle, action }: { icon: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16 px-6"
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-semibold text-lg text-foreground">{title}</h3>
      {subtitle && <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">{subtitle}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </motion.div>
  )
}

// ---------- Stagger container & item ----------
export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}
export const staggerItem = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

// ---------- Verified badge ----------
export function VerifiedBadge({ status }: { status: string }) {
  if (status !== 'VERIFIED') return null
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
      ✓ Verified
    </span>
  )
}
