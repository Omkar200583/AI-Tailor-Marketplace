'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { Product, CartItem } from '@/types'
import { SmartImage, RatingStars } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { CheckoutFlow } from '@/components/checkout/checkout-flow'
import { toast } from '@/hooks/use-toast'
import { inr } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import { ShoppingCart, Zap, Heart, Check } from 'lucide-react'

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const navigate = useAppStore((s) => s.navigate)
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(null)

  // Build a CartItem from the product for direct checkout
  function buildCartItem(withStitching: boolean): CartItem {
    return {
      id: `direct-${product.id}`,
      productId: product.id,
      product,
      size: product.sizes?.[0] || 'M',
      color: product.colors?.[0] || '',
      quantity: 1,
      note: '',
      withStitching,
    }
  }

  async function addToCart() {
    try {
      await api('/cart', {
        method: 'POST',
        body: {
          productId: product.id,
          size: product.sizes?.[0] || 'M',
          color: product.colors?.[0] || '',
          quantity: 1,
          withStitching: product.customizationAvailable,
        },
      })
      setAdded(true)
      useAppStore.getState().setCartCount(useAppStore.getState().cartCount + 1)
      toast({ title: 'Added to cart 🛒', description: product.name })
      setTimeout(() => setAdded(false), 2000)
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  async function toggleWishlist() {
    if (wishlisted) {
      try {
        await api(`/wishlist?id=${product.id}`, { method: 'DELETE' })
        setWishlisted(false)
      } catch (e) { /* ignore */ }
    } else {
      try {
        await api('/wishlist', { method: 'POST', body: { productId: product.id } })
        setWishlisted(true)
        toast({ title: 'Added to wishlist ❤️' })
      } catch (e) { /* ignore */ }
    }
  }

  // Direct order — opens checkout flow with just this product
  function orderNow() {
    const item = buildCartItem(product.customizationAvailable)
    setCheckoutItem(item)
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.4) }}
        whileHover={{ y: -4 }}
        className="bg-card rounded-2xl border border-wine-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-wine-700/10 transition-shadow group flex flex-col"
      >
        {/* Image */}
        <div className="relative aspect-[3/4] bg-cream-dark overflow-hidden cursor-pointer" onClick={() => navigate({ name: 'product', id: product.id })}>
          <SmartImage src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

          {/* Wishlist button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleWishlist() }}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow hover:scale-110 transition-transform"
            aria-label="Add to wishlist"
          >
            <Heart className={cn('w-4 h-4', wishlisted ? 'fill-red-500 text-red-500' : 'text-wine-400')} />
          </button>

          {/* Status badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {product.isFeatured && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gold-500 text-wine-900">★ Featured</span>
            )}
            {product.customizationAvailable && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-wine-700 text-white">✂ Stitchable</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5 flex flex-col flex-1">
          {/* Seller */}
          <div className="text-[10px] text-muted-foreground mb-0.5 truncate">
            {product.seller?.shopName || 'AI Tailor'}
          </div>

          {/* Name */}
          <h3
            className="text-sm font-semibold text-wine-900 line-clamp-1 cursor-pointer hover:text-wine-700"
            onClick={() => navigate({ name: 'product', id: product.id })}
          >
            {product.name}
          </h3>

          {/* Fabric + rating */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">{product.fabric}</span>
            <RatingStars rating={product.rating} size={10} />
          </div>

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-lg text-wine-800">{inr(product.price)}</span>
            {product.stitchingPrice ? (
              <span className="text-[10px] text-muted-foreground">+ {inr(product.stitchingPrice)} stitch</span>
            ) : null}
          </div>

          {/* Delivery */}
          <div className="text-[10px] text-muted-foreground mt-1">
            🚚 {product.deliveryDays} days · {product.stock} in stock
          </div>

          {/* Buttons */}
          <div className="mt-3 flex gap-2">
            {/* Add to cart */}
            <Button
              size="sm"
              variant="outline"
              onClick={addToCart}
              className="flex-1 h-9 rounded-full text-xs gap-1.5 border-wine-200 hover:border-gold-400"
            >
              {added ? <><Check className="w-3.5 h-3.5" /> Added</> : <><ShoppingCart className="w-3.5 h-3.5" /> Cart</>}
            </Button>

            {/* Order Now — direct checkout */}
            <Button
              size="sm"
              onClick={orderNow}
              className="flex-1 h-9 rounded-full text-xs gap-1.5 bg-wine-700 hover:bg-wine-800 text-white"
            >
              <Zap className="w-3.5 h-3.5" /> Order Now
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Direct checkout flow for this single product */}
      {checkoutItem && (
        <CheckoutFlow
          items={[checkoutItem]}
          onClose={() => setCheckoutItem(null)}
          onDone={() => {
            setCheckoutItem(null)
            navigate({ name: 'dashboard', category: 'orders' })
          }}
        />
      )}
    </>
  )
}
