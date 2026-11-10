
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { Hero } from '@/components/landing/hero'
import {
  ProductsShowcaseSection,
  CategoriesSection,
  FeaturedSection,
  AIFeatureSection,
  HowItWorks,
  NearbyTailorsSection,
  Testimonials,
  CtaSection,
} from '@/components/landing/sections'
import type { Product, Seller } from '@/types'

export function StorefrontHome() {
  const [products, setProducts] = useState<Product[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])

  useEffect(() => {
    Promise.all([
      api<{ products: Product[] }>('/products?limit=12'),
      api<{ sellers: Seller[] }>('/sellers?verified=1'),
    ])
      .then(([productResponse, sellerResponse]) => {
        setProducts(productResponse.products)
        setSellers(sellerResponse.sellers)
      })
      .catch((error) => {
        console.error('Failed to load storefront data:', error)
      })
  }, [])

  return (
    <>
      <Hero
        featuredImages={products
          .filter((product) => product.isFeatured)
          .map((product) => product.images[0])
          .concat(products.map((product) => product.images[0]))
          .filter(Boolean)}
      />

      <ProductsShowcaseSection products={products} />

      <FeaturedSection
  products={products.filter((p) => p.isFeatured).length > 0
    ? products.filter((p) => p.isFeatured)
    : products}
/>


      <AIFeatureSection />

      <HowItWorks />

      <NearbyTailorsSection sellers={sellers} />

      <Testimonials />

      <CtaSection />
    </>
  )
}
