'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { Hero } from '@/components/landing/hero'
import { CategoriesSection, FeaturedSection, AIFeatureSection, HowItWorks, NearbyTailorsSection, Testimonials, CtaSection } from '@/components/landing/sections'
import type { Product, Seller, Category } from '@/types'

/** Customer storefront home (formerly the `home` view of the single-page app). */
export function StorefrontHome() {
  const [products, setProducts] = useState<Product[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    Promise.all([
      api<{ products: Product[] }>('/products?limit=12'),
      api<{ sellers: Seller[] }>('/sellers?verified=1'),
      api<{ categories: Category[] }>('/categories'),
    ])
      .then(([p, s, c]) => { setProducts(p.products); setSellers(s.sellers); setCategories(c.categories) })
      .catch(() => null)
  }, [])

  return (
    <>
      <Hero featuredImages={products.filter((p) => p.isFeatured).map((p) => p.images[0]).concat(products.map((p) => p.images[0])).filter(Boolean)} />
      <CategoriesSection categories={categories} />
      <FeaturedSection products={products} />
      <AIFeatureSection />
      <HowItWorks />
      <NearbyTailorsSection sellers={sellers} />
      <Testimonials />
      <CtaSection />
    </>
  )
}
