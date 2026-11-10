
'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { AnimatedCounter, SmartImage } from '@/components/common/ui-bits'
import {
  Sparkles,
  ScanFace,
  MapPin,
  ArrowRight,
  Play,
  Star,
  Shirt,
  Palette,
} from 'lucide-react'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function Hero({ featuredImages }: { featuredImages: string[] }) {
  const navigate = useAppStore((state) => state.navigate)
  const setAuthOpen = useAppStore((state) => state.setAuthOpen)
  const user = useAppStore((state) => state.user)

  const collage = featuredImages.filter(Boolean).slice(0, 3)

  return (
    <section className="relative overflow-hidden paisley-bg">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gold-300/25 blur-3xl animate-float-slow" />

      <div className="pointer-events-none absolute top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-wine-300/20 blur-3xl animate-float-slower" />

      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gold-200/30 blur-3xl animate-float-slow" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 md:pt-20 md:pb-24 lg:grid-cols-2">
        {/* Hero content */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="mb-5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/60 bg-white/80 px-3 py-1.5 text-xs font-semibold text-gold-800 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-gold-600" />
              Powered by Generative AI
              <span className="h-1 w-1 rounded-full bg-gold-500" />
              Made in India
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="font-display text-4xl font-bold leading-[1.08] text-wine-900 md:text-6xl"
          >
            Stitch Your

            <span className="relative mx-3 inline-block bg-gradient-to-r from-wine-700 via-wine-500 to-gold-600 bg-clip-text text-transparent">
              Imagination

              <motion.svg
                viewBox="0 0 220 12"
                className="absolute -bottom-1 left-0 w-full"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <motion.path
                  d="M3 9 C 60 3, 160 3, 217 8"
                  fill="none"
                  stroke="#D69A28"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    delay: 1,
                    duration: 0.9,
                    ease: 'easeOut',
                  }}
                />
              </motion.svg>
            </span>

            Into Reality
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-base leading-relaxed text-foreground/70 md:text-lg"
          >
            Describe your dream outfit in words, watch AI design it, try it on
            virtually — then get it stitched to your exact measurements by{' '}
            <span className="font-semibold text-wine-800">
              verified master tailors near you
            </span>.
          </motion.p>

          {/* Action buttons */}
          <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => navigate({ name: 'ai-studio' })}
              className="h-12 gap-2 rounded-full bg-wine-700 px-7 text-white shadow-xl shadow-wine-700/25 hover:bg-wine-800"
            >
              <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
              Design with AI
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate({ name: 'explore' })}
              className="h-12 gap-2 rounded-full border-wine-300 px-7 text-wine-800 hover:bg-wine-50"
            >
              <Shirt className="h-5 w-5" />
              Explore Marketplace
            </Button>

            {!user && (
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setAuthOpen(true)}
                className="h-12 gap-2 rounded-full px-5 text-gold-800 hover:bg-gold-100"
              >
                <Play className="h-4 w-4 fill-gold-700 text-gold-700" />
                Start free
              </Button>
            )}
          </motion.div>

          {/* Statistics */}
          <motion.div
            variants={item}
            className="mt-10 grid max-w-md grid-cols-3 gap-6"
          >
            {[
              { value: 500, suffix: '+', label: 'Verified Tailors' },
              { value: 12000, suffix: '+', label: 'Happy Customers' },
              { value: 35, suffix: 'K+', label: 'Designs Created' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-2xl font-bold text-wine-800 md:text-3xl">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                  />
                </div>

                <div className="mt-0.5 text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Fashion image collage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative hidden h-[420px] sm:block md:h-[520px]"
        >
          {collage[0] && (
            <motion.div
              whileHover={{ scale: 1.03, rotate: 0, zIndex: 30 }}
              className="absolute top-6 left-0 z-20 w-[54%] rotate-[-4deg] overflow-hidden rounded-3xl shadow-2xl shadow-wine-900/25"
            >
              <SmartImage
                src={collage[0]}
                alt="Ethnic fashion collection"
                className="aspect-[3/4] w-full object-cover"
              />
            </motion.div>
          )}

          {collage[1] && (
            <motion.div
              whileHover={{ scale: 1.03, rotate: 0, zIndex: 30 }}
              className="absolute top-0 right-0 z-10 w-[46%] rotate-[3deg] overflow-hidden rounded-3xl shadow-2xl shadow-wine-900/20"
            >
              <SmartImage
                src={collage[1]}
                alt="Designer fashion collection"
                className="aspect-[3/4] w-full object-cover"
              />
            </motion.div>
          )}

          {collage[2] && (
            <motion.div
              whileHover={{ scale: 1.03, rotate: 0, zIndex: 30 }}
              className="absolute bottom-0 left-[24%] z-30 w-[44%] rotate-[2deg] overflow-hidden rounded-3xl shadow-2xl shadow-wine-900/25"
            >
              <SmartImage
                src={collage[2]}
                alt="Custom stitched outfit"
                className="aspect-[3/4] w-full object-cover"
              />
            </motion.div>
          )}

          {/* Virtual try-on floating card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="absolute bottom-24 -left-4 z-40 flex items-center gap-3 rounded-2xl border border-wine-100 bg-white/95 p-3.5 shadow-xl backdrop-blur animate-float-slow"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-wine-700">
              <ScanFace className="h-5 w-5 text-gold-300" />
            </div>

            <div>
              <div className="text-xs font-bold text-wine-900">
                Virtual Try-On
              </div>
              <div className="text-[10px] text-muted-foreground">
                See before you stitch
              </div>
            </div>
          </motion.div>

          {/* Nearby tailor floating card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35 }}
            className="absolute right-2 bottom-16 z-40 flex items-center gap-3 rounded-2xl border border-wine-100 bg-white/95 p-3.5 shadow-xl backdrop-blur animate-float-slower"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500">
              <MapPin className="h-5 w-5 text-white" />
            </div>

            <div>
              <div className="text-xs font-bold text-wine-900">
                Tailors near you
              </div>

              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                4.8 · within 5 km
              </div>
            </div>
          </motion.div>

          {/* Animated palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.55 }}
            className="absolute top-2 right-[38%] z-40"
          >
            <motion.div
              animate={{ rotate: [0, 10, -8, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg"
            >
              <Palette className="h-6 w-6 text-white" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="hidden justify-center pb-8 md:flex"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          <ArrowRight className="h-5 w-5 rotate-90 text-wine-400" />
        </motion.div>
      </motion.div>
    </section>
  )
}

