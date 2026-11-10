'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/common/ui-bits'
import { testimonials, featuredTestimonial, testimonialStats, type Testimonial } from '@/lib/testimonials-data'
import {
  Star, Quote, BadgeCheck, Sparkles, Heart, Users, TrendingUp, MessageSquare,
  ArrowRight, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

// ═══════════════ Star Rating Component ═══════════════
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          style={{ width: size, height: size }}
          className={cn(
            star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-wine-100 text-wine-200'
          )}
        />
      ))}
    </div>
  )
}

// ═══════════════ Testimonial Card ═══════════════
function TestimonialCard({ t, index }: { t: Testimonial; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1 }}
      whileHover={{ y: -6 }}
      className="bg-card rounded-3xl border border-wine-100 p-6 shadow-sm hover:shadow-xl hover:shadow-wine-700/10 transition-shadow flex flex-col"
    >
      {/* Quote icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center">
          <Quote className="w-5 h-5 text-gold-600" />
        </div>
        <StarRating rating={t.rating} size={16} />
      </div>

      {/* Testimonial text */}
      <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-4">
        "{t.text}"
      </p>

      {/* Product tag */}
      <div className="text-xs text-gold-800 font-medium mb-4 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        {t.product}
      </div>

      {/* Customer info */}
      <div className="flex items-center gap-3 pt-4 border-t border-wine-50">
        <Avatar name={t.name} color={t.avatarColor} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate">{t.name}</span>
            {t.verified && <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
          </div>
          <div className="text-xs text-muted-foreground">{t.role} · {t.location}</div>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════ Stats Card ═══════════════
function StatsCard({ icon: Icon, value, label, accent, delay }: {
  icon: any; value: string; label: string; accent: string; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-card rounded-3xl border border-wine-100 p-6 text-center shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3', accent)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="font-display text-3xl font-bold text-wine-900">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </motion.div>
  )
}

// ═══════════════ Featured Testimonial Carousel ═══════════════
function FeaturedTestimonial() {
  const [current, setCurrent] = useState(0)
  const featured = [featuredTestimonial, testimonials[2], testimonials[6]]

  const next = () => setCurrent((p) => (p + 1) % featured.length)
  const prev = () => setCurrent((p) => (p - 1 + featured.length) % featured.length)

  const t = featured[current]

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-wine-800 via-wine-700 to-wine-900 relative overflow-hidden">
      {/* Decorative circles */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
        className="absolute -right-20 -top-20 w-72 h-72 border-2 border-dashed border-gold-400/20 rounded-full"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 50, ease: 'linear' }}
        className="absolute -left-16 -bottom-16 w-56 h-56 border-2 border-dashed border-gold-400/15 rounded-full"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-gold-300 mb-3">
            ★ Featured Story ★
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Stories That Inspire
          </h2>
        </div>

        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 sm:p-10"
        >
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="shrink-0">
              <div className="rounded-3xl p-1 bg-gradient-to-br from-gold-400 to-gold-600 shadow-xl">
                <Avatar name={t.name} color={t.avatarColor} size={80} />
              </div>
            </div>
            <div className="flex-1">
              <Quote className="w-10 h-10 text-gold-400/40 mb-3" />
              <p className="text-base sm:text-lg text-white/90 leading-relaxed italic mb-5">
                "{t.text}"
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-white text-lg">{t.name}</span>
                    {t.verified && <BadgeCheck className="w-5 h-5 text-emerald-400" />}
                  </div>
                  <div className="text-sm text-gold-300">{t.role}</div>
                </div>
                <div className="ml-auto">
                  <StarRating rating={t.rating} size={18} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Carousel controls */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === current ? 'bg-gold-400 w-6' : 'bg-white/30 hover:bg-white/50'
                )}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

// ═══════════════ Main Page Component ═══════════════
export function TestimonialsPage() {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="min-h-screen bg-cream">
      {/* ═══ A. Hero Section ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-wine-700 via-wine-800 to-wine-900 pt-20 pb-24 sm:pt-28 sm:pb-32">
        {/* Animated decorative elements */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 35, ease: 'linear' }}
          className="absolute -right-12 -top-12 w-64 h-64 border-2 border-dashed border-gold-400/20 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 45, ease: 'linear' }}
          className="absolute -left-16 top-1/2 w-48 h-48 border-2 border-dashed border-gold-400/15 rounded-full"
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream to-transparent" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-300 bg-white/10 rounded-full px-4 py-2 mb-6 backdrop-blur-sm">
              <Heart className="w-3.5 h-3.5" /> Customer Love
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
          >
            Real Stories.
            <br />
            <span className="text-gold-400">Real Experiences.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-wine-100/80 mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Every outfit tells a story. Discover what our customers say about their AI Tailor
            experience — from the first design to the final stitch. Authentic reviews from verified buyers.
          </motion.p>

          {/* Hero stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10"
          >
            <div className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold text-gold-400">{testimonialStats.averageRating}</div>
              <div className="text-xs text-wine-200 mt-1">Average Rating</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold text-gold-400">{testimonialStats.satisfaction}</div>
              <div className="text-xs text-wine-200 mt-1">Satisfaction Rate</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold text-gold-400">{testimonialStats.verifiedReviews}</div>
              <div className="text-xs text-wine-200 mt-1">Verified Reviews</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ D. Customer Statistics ═══ */}
      <section className="py-16 sm:py-20 -mt-12 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard icon={Users} value={testimonialStats.totalCustomers} label="Happy Customers" accent="bg-wine-50 text-wine-700" delay={0} />
            <StatsCard icon={TrendingUp} value={testimonialStats.satisfaction} label="Satisfaction Rate" accent="bg-emerald-50 text-emerald-600" delay={0.1} />
            <StatsCard icon={BadgeCheck} value={testimonialStats.verifiedReviews} label="Verified Reviews" accent="bg-gold-50 text-gold-700" delay={0.2} />
            <StatsCard icon={Star} value={testimonialStats.averageRating} label="Average Rating" accent="bg-amber-50 text-amber-600" delay={0.3} />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            * Statistics shown are demo data for illustration purposes.
          </p>
        </div>
      </section>

      {/* ═══ B. Customer Testimonials — Top 3 ═══ */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-700">What Customers Say</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-wine-900 mt-2">
              Loved by Thousands
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
              Real reviews from verified customers who experienced the AI Tailor difference.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((t, i) => (
              <TestimonialCard key={t.id} t={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ C. Featured Testimonial ═══ */}
      <FeaturedTestimonial />

      {/* ═══ E. Testimonials Grid ═══ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-700">All Reviews</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-wine-900 mt-2">
              More Customer Experiences
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
              Browse through all verified customer reviews and see why they choose AI Tailor.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(3).map((t, i) => (
              <TestimonialCard key={t.id} t={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ F. Call-to-Action Section ═══ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-500 to-gold-600 p-8 sm:p-12 text-center"
          >
            <div className="absolute -right-6 -bottom-8 text-[120px] opacity-15 select-none">💬</div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-wine-900 text-gold-400 flex items-center justify-center mx-auto mb-5">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-wine-900">
                Your Experience Matters!
              </h2>
              <p className="text-base text-wine-900/70 mt-4 max-w-xl mx-auto leading-relaxed">
                We would love to hear about your experience. Share your feedback and help us improve
                — your story could inspire the next customer.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-8">
                <Button
                  size="lg"
                  onClick={() => navigate({ name: 'dashboard', category: 'orders' })}
                  className="bg-wine-900 hover:bg-wine-800 text-white rounded-full gap-2 px-8"
                >
                  <Star className="w-4 h-4" /> Share Your Experience
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate({ name: 'explore' })}
                  className="rounded-full gap-2 px-8 border-wine-300 text-wine-900 hover:bg-wine-50"
                >
                  Explore Products <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default TestimonialsPage
