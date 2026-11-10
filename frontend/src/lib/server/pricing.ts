// lib/server/pricing.ts
import { COMMISSION_RATE } from '@/lib/helpers'

export interface QuoteInput {
  items: { productId: string; quantity: number; withStitching: boolean; size?: string }[]
  designId?: string
  deliveryDays?: number
}

export interface Quote {
  items: { productId: string; name: string; price: number; stitchingPrice: number; quantity: number; lineTotal: number }[]
  subtotal: number
  deliveryCharge: number
  customizationCharge: number
  totalAmount: number
  advanceAmount: number      // 25% rounded
  remainingAmount: number    // 75%
  commission: number
  sellerEarning: number
}

export async function computeQuote(input: QuoteInput): Promise<Quote> {
  // ALWAYS read prices from DB — never trust the client
  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map(i => i.productId) } },
  })

  const lineItems = input.items.map(i => {
    const p = products.find(p => p.id === i.productId)
    if (!p) throw new Error(`Product ${i.productId} not found`)
    if (p.stock < i.quantity) throw new Error(`${p.name} is out of stock`)
    const stitching = i.withStitching ? (p.stitchingPrice ?? 0) : 0
    const lineTotal = (p.price + stitching) * i.quantity
    return { productId: p.id, name: p.name, price: p.price, stitchingPrice: stitching, quantity: i.quantity, lineTotal }
  })

  const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0)
  const customizationCharge = 0 // hook for design-driven charges later
  const deliveryCharge = 0      // free for now; pull from pincode logic later
  const totalAmount = subtotal + customizationCharge + deliveryCharge

  const advanceAmount = Math.round(totalAmount * 0.25 * 100) / 100
  const remainingAmount = Math.round((totalAmount - advanceAmount) * 100) / 100
  const commission = Math.round(totalAmount * COMMISSION_RATE * 100) / 100
  const sellerEarning = totalAmount - commission

  return { items: lineItems, subtotal, deliveryCharge, customizationCharge, totalAmount, advanceAmount, remainingAmount, commission, sellerEarning }
}
