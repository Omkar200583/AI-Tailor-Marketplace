
'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import {
  SectionHeading,
  staggerContainer,
  staggerItem,
  Avatar,
  VerifiedBadge,
} from '@/components/common/ui-bits'
import { ProductCard } from '@/components/marketplace/product-card'
import { Button } from '@/components/ui/button'
import type { Product, Seller, Category } from '@/types'
import {
  Sparkles,
  ScanFace,
  Wand2,
  ArrowRight,
  Star,
  MapPin,
  Ruler,
  Scissors,
  CreditCard,
  Package,
  PenLine,
  Handshake,
  ClipboardCheck,
} from 'lucide-react'

// Categories
export function CategoriesSection({
  categories,
}: {
  categories: Category[]
}) {
  const navigate = useAppStore((state) => state.navigate)

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading
        kicker="Shop by category"
        title="A wardrobe for every occasion"
        subtitle="From wedding sherwanis to office kurtis — every piece customizable to your measurements."
      />

      {categories.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
        >
          {categories.map((category) => (
            <motion.button
              key={category.id}
              type="button"
              variants={staggerItem}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() =>
                navigate({
                  name: 'explore',
                  category: category.slug,
                })
              }
              className="group rounded-2xl border border-wine-100/70 bg-card p-5 text-center shadow-sm transition-all hover:border-gold-300 hover:shadow-lg hover:shadow-wine-700/10"
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: 8 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-wine-50 to-gold-100 text-3xl"
              >
                {category.icon}
              </motion.div>

              <div className="mt-3 text-sm font-semibold text-foreground transition-colors group-hover:text-wine-800">
                {category.name}
              </div>

              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {category.productCount} styles
              </div>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <p className="rounded-2xl border border-dashed border-wine-200 p-8 text-center text-sm text-muted-foreground">
          Categories will appear here when they become available.
        </p>
      )}
    </section>
  )
}

// Featured products
export function FeaturedSection({
  products,
}: {
  products: Product[]
}) {
  const navigate = useAppStore((state) => state.navigate)

  return (
    <section className="border-y border-wine-100/60 bg-white/60 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            kicker="Handpicked for you"
            title="Featured creations"
            subtitle="Top-rated pieces from our verified master tailors."
          />

          <Button
            variant="ghost"
            onClick={() => navigate({ name: 'explore' })}
            className="hidden shrink-0 gap-1.5 text-wine-800 sm:inline-flex"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.slice(0, 8).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-wine-200 px-4 py-12 text-center">
            <Scissors className="mx-auto mb-3 h-8 w-8 text-wine-400" />
            <h3 className="font-semibold text-wine-900">
              No featured products yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              New designs from our sellers will appear here.
            </p>

            <Button
              variant="outline"
              onClick={() => navigate({ name: 'explore' })}
              className="mt-4 border-wine-300 text-wine-800"
            >
              Explore marketplace
            </Button>
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Button
            variant="outline"
            onClick={() => navigate({ name: 'explore' })}
            className="border-wine-300 text-wine-800"
          >
            View all products
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

// AI features
export function AIFeatureSection() {
  const navigate = useAppStore((state) => state.navigate)

  const features = [
    {
      icon: Sparkles,
      title: 'AI Design Studio',
      color: 'bg-wine-700',
      desc: 'Type your dream outfit — "black wedding kurta with golden embroidery" — and watch AI paint it in seconds. Different collars, sleeves and patterns to choose from.',
      action: () => navigate({ name: 'ai-studio' }),
      cta: 'Open AI Studio',
    },
    {
      icon: ScanFace,
      title: 'Virtual Try-On',
      color: 'bg-gold-600',
      desc: 'Upload your photo and preview outfits on yourself before ordering. AI segments, fits and renders — so you know the look before the first stitch.',
      action: () => navigate({ name: 'tryon' }),
      cta: 'Enter Fitting Room',
    },
    {
      icon: Wand2,
      title: 'Smart Recommendations',
      color: 'bg-teal-700',
      desc: 'Budget, favourite colours, past orders and location — the AI learns your taste and suggests outfits and tailors that match, with honest prices from real shops.',
      action: () => navigate({ name: 'explore' }),
      cta: 'Get Suggestions',
    },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading
        center
        kicker="The AI engine"
        title="Fashion, powered by intelligence"
        subtitle="Four AI modules working together — design, try-on, recommendations and your personal fashion assistant."
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="grid gap-5 md:grid-cols-3"
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={staggerItem}
            whileHover={{ y: -8 }}
            className="relative overflow-hidden rounded-3xl border border-wine-100/70 bg-card p-7 shadow-sm transition-shadow hover:shadow-xl hover:shadow-wine-700/10"
          >
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-gold-100 to-transparent opacity-60" />

            <motion.div
              whileHover={{ rotate: 8, scale: 1.08 }}
              className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl ${feature.color} shadow-lg`}
            >
              <feature.icon className="h-6 w-6 text-white" />
            </motion.div>

            <h3 className="mt-4 font-display text-xl font-bold text-foreground">
              {feature.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.desc}
            </p>

            <Button
              variant="link"
              onClick={feature.action}
              className="mt-3 gap-1 px-0 font-semibold text-wine-700 transition-all hover:gap-2.5"
            >
              {feature.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

// How it works
export function HowItWorks() {
  const steps = [
    {
      icon: PenLine,
      title: 'Describe or pick',
      desc: 'Type your idea in the AI Studio or choose from the marketplace.',
    },
    {
      icon: Ruler,
      title: 'Add measurements',
      desc: 'Fill your body profile once — every tailor gets perfect-fit data.',
    },
    {
      icon: Handshake,
      title: 'Tailor approves',
      desc: 'Sellers review, confirm the final price and delivery date.',
    },
    {
      icon: CreditCard,
      title: 'Pay securely',
      desc: 'Pay online only after approval. Commission split is automatic.',
    },
    {
      icon: Package,
      title: 'Get it stitched',
      desc: 'Track production live until your outfit arrives at your door.',
    },
  ]

  return (
    <section className="relative overflow-hidden bg-wine-900 py-16">
      <div className="absolute inset-0 paisley-bg opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-gold-400">
            Simple process
          </span>

          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            From imagination to doorstep
          </h2>
        </div>

        <div className="relative">
          <div className="absolute top-9 right-[10%] left-[10%] hidden h-0.5 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent lg:block" />

          <div className="grid gap-6 lg:grid-cols-5">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.12,
                  duration: 0.5,
                }}
                className="relative text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative z-10 mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-xl shadow-gold-600/30"
                >
                  <step.icon className="h-7 w-7 text-wine-900" />

                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-wine-900">
                    {index + 1}
                  </span>
                </motion.div>

                <h3 className="mt-4 font-semibold text-white">
                  {step.title}
                </h3>

                <p className="mt-1.5 px-1 text-xs leading-relaxed text-wine-200/80">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Nearby tailors
export function NearbyTailorsSection({
  sellers,
}: {
  sellers: Seller[]
}) {
  const navigate = useAppStore((state) => state.navigate)

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          kicker="Local & trusted"
          title="Master tailors near you"
          subtitle="Real shops with ratings, walking directions and one-tap WhatsApp."
        />

        <Button
          variant="ghost"
          onClick={() => navigate({ name: 'find-tailors' })}
          className="hidden shrink-0 gap-1.5 text-wine-800 sm:inline-flex"
        >
          Open map
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {sellers.length > 0 ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {sellers.slice(0, 4).map((seller) => (
            <motion.button
              key={seller.id}
              type="button"
              variants={staggerItem}
              whileHover={{ y: -6 }}
              onClick={() =>
                navigate({
                  name: 'tailor',
                  id: seller.id,
                })
              }
              className="cursor-pointer rounded-2xl border border-wine-100/70 bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-xl hover:shadow-wine-700/10"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={seller.shopName}
                  color="#7C2D3E"
                  size={46}
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    <span className="truncate">{seller.shopName}</span>
                    <VerifiedBadge status={seller.verificationStatus} />
                  </div>

                  <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {seller.city || 'Location unavailable'}
                  </div>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {seller.description || 'Discover custom tailoring services from this seller.'}
              </p>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-semibold text-wine-800">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {seller.rating.toFixed(1)} ({seller.ratingCount})
                </span>

                <span className="text-muted-foreground">
                  {seller.experienceYears}+ yrs exp
                </span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-dashed border-wine-200 px-4 py-10 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-wine-400" />

          <h3 className="font-semibold text-wine-900">
            No verified tailors available yet
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Verified tailor shops will appear here.
          </p>
        </div>
      )}

      <div className="mt-6 text-center sm:hidden">
        <Button
          variant="outline"
          onClick={() => navigate({ name: 'find-tailors' })}
          className="border-wine-300 text-wine-800"
        >
          Find tailors
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </section>
  )
}

// Testimonials
export function Testimonials() {
  const quotes = [
    {
      name: 'Ananya Deshpande',
      role: 'Bride, Pune',
      color: '#9D174D',
      text: 'I designed my reception lehenga in the AI Studio at midnight, sent it to Sai Tailors, and it arrived exactly like the render. Fitting was perfect!',
    },
    {
      name: 'Vikram Joshi',
      role: 'Groom, Baner',
      color: '#B45309',
      text: 'Virtual try-on saved me from a fashion disaster. Saw the sherwani on my own photo before paying a rupee. This is the future of tailoring.',
    },
    {
      name: 'Sana Shaikh',
      role: 'Working professional',
      color: '#0F766E',
      text: 'My body measurements are saved once, and every kurti now fits like custom-made. The chat with tailors is instant and friendly.',
    },
  ]

  return (
    <section className="border-y border-wine-100/60 bg-white/60 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          center
          kicker="Love letters"
          title="What our customers say"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-5 md:grid-cols-3"
        >
          {quotes.map((quote) => (
            <motion.figure
              key={quote.name}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              className="relative rounded-3xl border border-wine-100/70 bg-card p-6 shadow-sm transition-shadow hover:shadow-xl hover:shadow-wine-700/10"
            >
              <div className="absolute top-4 right-5 select-none font-display text-6xl text-gold-300/60">
                &ldquo;
              </div>

              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              <blockquote className="text-sm leading-relaxed text-foreground/80">
                {quote.text}
              </blockquote>

              <figcaption className="mt-4 flex items-center gap-2.5">
                <Avatar
                  name={quote.name}
                  color={quote.color}
                  size={36}
                />

                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {quote.name}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {quote.role}
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Final CTA
export function CtaSection() {
  const navigate = useAppStore((state) => state.navigate)
  const setAuthOpen = useAppStore((state) => state.setAuthOpen)
  const user = useAppStore((state) => state.user)

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-wine-800 via-wine-700 to-wine-900 px-8 py-14 text-center md:px-16"
      >
        <div className="absolute inset-0 paisley-bg opacity-30" />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 40,
            ease: 'linear',
          }}
          className="absolute -top-20 -right-20 h-64 w-64 rounded-full border-[3px] border-dashed border-gold-500/30"
        />

        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            repeat: Infinity,
            duration: 55,
            ease: 'linear',
          }}
          className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full border-[3px] border-dotted border-gold-500/20"
        />

        <div className="relative">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{
              type: 'spring',
              stiffness: 200,
              delay: 0.2,
            }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500 shadow-2xl shadow-gold-600/40"
          >
            <Scissors className="h-8 w-8 text-wine-900" />
          </motion.div>

          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight text-white md:text-5xl">
            Your dream outfit is one sentence away
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm text-wine-200 md:text-base">
            Join thousands designing with AI and stitching with the best local
            tailors. Free to start — no card needed.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate({ name: 'ai-studio' })}
              className="h-12 rounded-full bg-gold-500 px-8 font-bold text-wine-900 shadow-xl shadow-gold-600/30 hover:bg-gold-600"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start designing free
            </Button>

            {!user && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setAuthOpen(true)}
                className="h-12 rounded-full border-wine-300/40 px-8 text-white hover:bg-white/10"
              >
                <ClipboardCheck className="mr-2 h-5 w-5" />
                Create account
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
