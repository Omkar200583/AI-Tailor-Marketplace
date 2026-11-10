'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { Product, CartItem } from '@/types'
import { SmartImage, RatingStars, Spinner } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckoutFlow } from '@/components/checkout/checkout-flow'
import { toast } from '@/hooks/use-toast'
import { inr } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import {
  ShoppingCart, Zap, Heart, Check, Ruler, Truck, Star, Shield, Sparkles,
  ChevronLeft, MessageCircle,
} from 'lucide-react'

export function ProductDetailView({ productId }: { productId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const back = useAppStore((s) => s.back)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [withStitching, setWithStitching] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(null)
  const [activeImage, setActiveImage] = useState(0)

  // Load product
  useState(() => {
    if (!productId) return
    api<{ product: Product }>(`/products/${productId}`).then((d) => {
      setProduct(d.product)
      setSelectedSize(d.product.sizes?.[0] || 'M')
      setSelectedColor(d.product.colors?.[0] || '')
      setWithStitching(d.product.customizationAvailable)
    }).catch(() => null).finally(() => setLoading(false))
  })

  if (loading) return <Spinner />
  if (!product) {
    return (
      <div className="py-24 text-center">
        <p className="text-2xl">🧐</p>
        <p className="mt-2 text-muted-foreground">Product not found.</p>
        <button className="text-wine-700 underline mt-3" onClick={() => navigate({ name: 'explore' })}>Back to explore</button>
      </div>
    )
  }

  const totalPrice = (product.price + (withStitching && product.stitchingPrice ? product.stitchingPrice : 0)) * quantity

  async function addToCart() {
    try {
      await api('/cart', {
        method: 'POST',
        body: { productId: product!.id, size: selectedSize, color: selectedColor, quantity, withStitching },
      })
      setAdded(true)
      useAppStore.getState().setCartCount(useAppStore.getState().cartCount + quantity)
      toast({ title: 'Added to cart 🛒', description: `${quantity} × ${product!.name}` })
      setTimeout(() => setAdded(false), 2000)
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  function orderNow() {
    const item: CartItem = {
      id: `direct-${product!.id}`,
      productId: product!.id,
      product: product!,
      size: selectedSize,
      color: selectedColor,
      quantity,
      note: '',
      withStitching,
    }
    setCheckoutItem(item)
  }

  async function toggleWishlist() {
    if (wishlisted) {
      await api(`/wishlist?id=${product!.id}`, { method: 'DELETE' }).catch(() => null)
      setWishlisted(false)
    } else {
      await api('/wishlist', { method: 'POST', body: { productId: product!.id } }).catch(() => null)
      setWishlisted(true)
      toast({ title: 'Added to wishlist ❤️' })
    }
  }

  const images = product.images || []

  return (
    <div className="pb-10">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <button onClick={back} className="text-sm text-muted-foreground hover:text-wine-700 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 grid lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-[3/4] bg-cream-dark rounded-3xl overflow-hidden border border-wine-100"
          >
            <SmartImage src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn('w-16 h-20 rounded-lg overflow-hidden border-2 shrink-0', activeImage === i ? 'border-wine-700' : 'border-wine-100')}
                >
                  <SmartImage src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col">
          {/* Seller */}
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => navigate({ name: 'tailor', id: product.seller?.id })} className="text-sm text-muted-foreground hover:text-wine-700">
              {product.seller?.shopName || 'AI Tailor'}
            </button>
            {product.seller?.verificationStatus === 'VERIFIED' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Verified</span>
            )}
          </div>

          {/* Name */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-wine-900">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mt-2">
            <RatingStars rating={product.rating} size={16} />
            <span className="text-sm text-muted-foreground">{product.rating.toFixed(1)} ({product.ratingCount} reviews)</span>
            <span className="text-sm text-muted-foreground">· {product.soldCount} sold</span>
          </div>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-wine-800">{inr(product.price)}</span>
            {product.stitchingPrice ? (
              <span className="text-sm text-muted-foreground">+ {inr(product.stitchingPrice)} stitching</span>
            ) : null}
          </div>

          {/* Fabric + delivery */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-cream/40 rounded-xl p-3 text-sm">
              <span className="text-muted-foreground">Fabric: </span>
              <span className="font-semibold">{product.fabric}</span>
            </div>
            <div className="bg-cream/40 rounded-xl p-3 text-sm">
              <span className="text-muted-foreground">Delivery: </span>
              <span className="font-semibold">{product.deliveryDays} days</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-foreground/70 mt-4 leading-relaxed">{product.description}</p>
          )}

          {/* Color selection */}
          {product.colors?.length > 0 && (
            <div className="mt-5">
              <Label className="text-sm font-semibold">Color</Label>
              <div className="flex gap-2 mt-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={cn('px-4 py-2 rounded-full text-xs font-medium border-2 transition-colors',
                      selectedColor === c ? 'border-wine-700 bg-wine-50 text-wine-800' : 'border-wine-100 hover:border-gold-400')}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selection */}
          {product.sizes?.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-semibold">Size</Label>
              <div className="flex gap-2 mt-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={cn('w-11 h-11 rounded-full text-sm font-bold border-2 transition-colors',
                      selectedSize === s ? 'border-wine-700 bg-wine-700 text-white' : 'border-wine-200 hover:border-wine-400')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stitching toggle */}
          {product.customizationAvailable && product.stitchingPrice ? (
            <div className="mt-4 bg-cream/40 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-gold-600" />
                <div>
                  <div className="text-sm font-semibold">Stitch to measurements</div>
                  <div className="text-xs text-muted-foreground">+{inr(product.stitchingPrice)} · perfect fit guarantee</div>
                </div>
              </div>
              <button
                onClick={() => setWithStitching(!withStitching)}
                className={cn('w-12 h-6 rounded-full transition-colors relative', withStitching ? 'bg-wine-700' : 'bg-wine-200')}
                aria-label="Toggle stitching"
              >
                <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform', withStitching ? 'translate-x-6' : 'translate-x-0.5')} />
              </button>
            </div>
          ) : null}

          {/* Quantity */}
          <div className="mt-4">
            <Label className="text-sm font-semibold">Quantity</Label>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-full border border-wine-200 flex items-center justify-center hover:bg-wine-50" aria-label="Decrease quantity">−</button>
              <span className="text-sm font-semibold w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 rounded-full border border-wine-200 flex items-center justify-center hover:bg-wine-50" aria-label="Increase quantity">+</button>
              <span className="ml-3 text-sm text-muted-foreground">{product.stock} in stock</span>
            </div>
          </div>

          {/* Total */}
          <div className="mt-5 bg-gradient-to-br from-wine-50 to-gold-50 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-wine-900">Total</span>
            <span className="font-display text-2xl font-bold text-wine-800">{inr(totalPrice)}</span>
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex gap-3">
            <Button
              variant="outline"
              onClick={addToCart}
              className="flex-1 h-12 rounded-full border-wine-300 text-wine-800 hover:border-gold-400 gap-2"
            >
              {added ? <><Check className="w-5 h-5" /> Added!</> : <><ShoppingCart className="w-5 h-5" /> Add to Cart</>}
            </Button>
            <Button
              onClick={orderNow}
              className="flex-1 h-12 rounded-full bg-wine-700 hover:bg-wine-800 text-white gap-2"
            >
              <Zap className="w-5 h-5" /> Order Now
            </Button>
          </div>

          {/* Wishlist + chat */}
          <div className="mt-3 flex gap-3">
            <Button variant="ghost" onClick={toggleWishlist} className="flex-1 rounded-full gap-2 text-wine-700">
              <Heart className={cn('w-4 h-4', wishlisted ? 'fill-red-500 text-red-500' : '')} /> {wishlisted ? 'Wishlisted' : 'Wishlist'}
            </Button>
            <Button variant="ghost" onClick={() => navigate({ name: 'dashboard', category: 'messages' })} className="flex-1 rounded-full gap-2 text-wine-700">
              <MessageCircle className="w-4 h-4" /> Chat with tailor
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="bg-card rounded-xl border border-wine-100 p-3">
              <Shield className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="text-[10px] text-muted-foreground">Secure payment</div>
            </div>
            <div className="bg-card rounded-xl border border-wine-100 p-3">
              <Truck className="w-5 h-5 text-gold-600 mx-auto mb-1" />
              <div className="text-[10px] text-muted-foreground">{product.deliveryDays} day delivery</div>
            </div>
            <div className="bg-card rounded-xl border border-wine-100 p-3">
              <Sparkles className="w-5 h-5 text-wine-600 mx-auto mb-1" />
              <div className="text-[10px] text-muted-foreground">AI design ready</div>
            </div>
          </div>
        </div>
      </div>

      {/* Full multi-step checkout flow — opens when "Order Now" is clicked */}
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
    </div>
  )
}
