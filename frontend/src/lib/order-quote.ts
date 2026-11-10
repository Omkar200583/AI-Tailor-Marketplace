// lib/order-quote.ts
import { db } from '@/lib/db'
import { parseJson, COMMISSION_RATE } from '@/lib/helpers'

export interface QuoteInput {
  items: { productId: string; quantity: number; withStitching: boolean }[]
  designId?: string | null
}

export interface QuoteLine {
  productId: string
  name: string
  image: string
  price: number
  stitchingPrice: number
  quantity: number
  lineTotal: number
  sellerId: string
}

export interface Quote {
  lines: QuoteLine[]
  subtotal: number
  deliveryCharge: number
  customizationCharge: number
  totalAmount: number
  advanceAmount: number
  remainingAmount: number
  commission: number
  sellerEarning: number
  sellerId: string
}

export async function computeQuote(input: QuoteInput): Promise<Quote> {
  if (!input.items?.length) throw new Error('Cart is empty')

  const products = await db.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
  })

  const lines: QuoteLine[] = input.items.map((i) => {
    const p = products.find((x) => x.id === i.productId)
    if (!p) throw new Error(`Product ${i.productId} not found`)
    if (p.stock < i.quantity) throw new Error(`${p.name} is out of stock`)
    const stitching = i.withStitching && p.stitchingPrice ? p.stitchingPrice : 0
    const lineTotal = (p.price + stitching) * i.quantity
    return {
      productId: p.id,
      name: p.name,
      image: parseJson<string[]>(p.images, [])[0] || '',
      price: p.price,
      stitchingPrice: stitching,
      quantity: i.quantity,
      lineTotal,
      sellerId: p.sellerId,
    }
  })

  const sellerIds = Array.from(new Set(lines.map((l) => l.sellerId)))
  if (sellerIds.length > 1) {
    throw new Error('Items in cart belong to multiple sellers. Please checkout separately.')
  }
  const sellerId = sellerIds[0]

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0)
  const deliveryCharge = 0
  const customizationCharge = 0
  const totalAmount = subtotal + deliveryCharge + customizationCharge

  const advanceAmount = Math.round(totalAmount * 0.25 * 100) / 100
  const remainingAmount = Math.round((totalAmount - advanceAmount) * 100) / 100
  const commission = Math.round(totalAmount * COMMISSION_RATE * 100) / 100
  const sellerEarning = totalAmount - commission

  return { lines, subtotal, deliveryCharge, customizationCharge, totalAmount, advanceAmount, remainingAmount, commission, sellerEarning, sellerId }
}
