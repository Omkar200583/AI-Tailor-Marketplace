'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { Product, Category } from '@/types'
import { ProductCard } from '@/components/marketplace/product-card'
import { Spinner, EmptyState } from '@/components/common/ui-bits'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, SlidersHorizontal, X, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExploreView({ initialCategory, initialQuery }: { initialCategory?: string; initialQuery?: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState(initialQuery || '')
  const [category, setCategory] = useState(initialCategory || 'all')
  const [sort, setSort] = useState('newest')
  const [maxPrice, setMaxPrice] = useState(30000)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    api<{ categories: Category[] }>('/categories').then((d) => setCategories(d.categories)).catch(() => null)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (category !== 'all') params.set('category', category)
      if (sort !== 'newest') params.set('sort', sort)
      if (maxPrice < 30000) params.set('maxPrice', String(maxPrice))
      const data = await api<{ products: Product[] }>(`/products?${params}`)
      setProducts(data.products)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [q, category, sort, maxPrice])

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0)
    return () => clearTimeout(t)
  }, [load, q])

  const activeCategory = categories.find((c) => c.slug === category)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-wine-900">
            {activeCategory ? activeCategory.name : 'Explore Custom Fashion'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? 'Finding the best pieces…' : `${products.length} styles · every piece stitchable to your measurements`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-wine-300 text-wine-800 rounded-full gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {(maxPrice < 30000) && <span className="w-2 h-2 rounded-full bg-gold-500" />}
          </Button>
        </div>
      </div>

      {/* Search + sort bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search kurtas, sarees, fabrics…"
            className="pl-10 h-11 bg-card border-wine-200 rounded-full"
            aria-label="Search products"
          />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-wine-50" aria-label="Clear search">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-48 h-11 bg-card border-wine-200 rounded-full" aria-label="Sort products">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">✨ Newest first</SelectItem>
            <SelectItem value="popular">🔥 Most popular</SelectItem>
            <SelectItem value="rating">⭐ Top rated</SelectItem>
            <SelectItem value="price_low">💰 Price: low → high</SelectItem>
            <SelectItem value="price_high">💎 Price: high → low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 [scrollbar-width:none]">
        <CategoryChip active={category === 'all'} onClick={() => setCategory('all')} label="All" icon="🛍️" />
        {categories.map((c) => (
          <CategoryChip key={c.id} active={category === c.slug} onClick={() => setCategory(c.slug)} label={c.name} icon={c.icon} />
        ))}
      </div>

      {/* Filters panel */}
      <motion.div
        initial={false}
        animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="bg-card rounded-2xl border border-wine-100 p-5 mb-5 grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-semibold text-foreground flex justify-between mb-2">
              <span>Max budget</span>
              <span className="text-wine-800 font-display">₹{maxPrice.toLocaleString('en-IN')}{maxPrice >= 30000 ? '+' : ''}</span>
            </label>
            <input
              type="range" min={500} max={30000} step={500} value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              className="w-full accent-wine-700" aria-label="Maximum price filter"
            />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={() => { setMaxPrice(30000); setCategory('all'); setQ(''); setSort('newest') }} className="text-muted-foreground">
              Reset all filters
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No outfits match your filters"
          subtitle="Try widening the budget or clearing the search. Or design your own with AI!"
          action={
            <Button onClick={() => navigate({ name: 'ai-studio' })} className="bg-wine-700 hover:bg-wine-800 text-white rounded-full gap-2">
              <Wand2 className="w-4 h-4" /> Design it with AI instead
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryChip({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
        active
          ? 'bg-wine-700 text-white border-wine-700 shadow-lg shadow-wine-700/25'
          : 'bg-card text-foreground/70 border-wine-200 hover:border-wine-400 hover:text-wine-800'
      }`}
    >
      <span>{icon}</span> {label}
    </motion.button>
  )
}
