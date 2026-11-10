'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { Category, Product } from '@/types'
import { Spinner, SectionHeading, staggerContainer, staggerItem } from '@/components/common/ui-bits'
import { ProductCard } from '@/components/marketplace/product-card'
import { ArrowRight } from 'lucide-react'

export function CategoriesView() {
  const navigate = useAppStore((s) => s.navigate)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api<{ categories: Category[] }>('/categories'),
      api<{ products: Product[] }>('/products?limit=100'),
    ])
      .then(([c, p]) => { setCategories(c.categories); setProducts(p.products) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const shown = active ? products.filter((p) => p.category?.slug === active) : products.filter((p) => p.isFeatured)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <SectionHeading kicker="Browse everything" title="All categories" subtitle="Pick a category to see every style our tailors offer." />

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
        {categories.map((c) => (
          <motion.button
            key={c.id}
            variants={staggerItem}
            whileHover={{ y: -6 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setActive(active === c.slug ? null : c.slug)}
            className={`rounded-3xl p-6 text-center border-2 transition-all ${
              active === c.slug ? 'bg-wine-700 border-wine-700 shadow-xl shadow-wine-700/25' : 'bg-card border-wine-100 hover:border-gold-300 shadow-sm'
            }`}
          >
            <motion.div animate={active === c.slug ? { scale: [1, 1.25, 1] } : {}} className="text-4xl">{c.icon}</motion.div>
            <div className={`mt-2.5 font-semibold text-sm ${active === c.slug ? 'text-white' : 'text-foreground'}`}>{c.name}</div>
            <div className={`text-[11px] mt-0.5 ${active === c.slug ? 'text-wine-200' : 'text-muted-foreground'}`}>{c.productCount} styles</div>
          </motion.button>
        ))}
      </motion.div>

      {shown.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold text-wine-900">
              {active ? categories.find((c) => c.slug === active)?.name : 'Featured across categories'}
            </h2>
            <button onClick={() => navigate({ name: 'explore', category: active || undefined })} className="text-sm font-semibold text-wine-700 flex items-center gap-1 hover:gap-2 transition-all">
              View in marketplace <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {shown.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </>
      )}
    </div>
  )
}
