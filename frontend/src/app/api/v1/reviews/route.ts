import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sellerId = searchParams.get('sellerId')
  const productId = searchParams.get('productId')
  const where: Record<string, unknown> = {}
  if (sellerId) where.sellerId = sellerId
  if (productId) where.productId = productId

  const reviews = await db.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { customer: { select: { id: true, name: true, avatarColor: true } } },
  })
  return json({ reviews })
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['CUSTOMER', 'DESIGNER'])
  if (denied) return denied

  try {
    const { sellerId, productId, orderId, rating, comment } = await req.json()
    if (!sellerId || !rating) return json({ error: 'Seller and rating are required' }, 400)
    const ratingNum = parseInt(String(rating))
    if (ratingNum < 1 || ratingNum > 5) return json({ error: 'Rating must be 1-5' }, 400)

    const review = await db.review.create({
      data: {
        customerId: user!.id,
        sellerId,
        productId: productId || null,
        orderId: orderId || null,
        rating: ratingNum,
        comment: comment ? String(comment) : '',
      },
      include: { customer: { select: { id: true, name: true, avatarColor: true } } },
    })

    // Recompute seller rating aggregate
    const agg = await db.review.aggregate({ where: { sellerId }, _avg: { rating: true }, _count: { rating: true } })
    await db.sellerProfile.update({
      where: { id: sellerId },
      data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, ratingCount: agg._count.rating },
    })

    // Product rating aggregate
    if (productId) {
      const pagg = await db.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: { rating: true } })
      await db.product.update({
        where: { id: productId },
        data: { rating: Math.round((pagg._avg.rating || 0) * 10) / 10, ratingCount: pagg._count.rating },
      })
    }

    return json({ review }, 201)
  } catch (e) {
    console.error('review POST error', e)
    return json({ error: 'Failed to submit review' }, 500)
  }
}
