import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { parseJson } from '@/lib/helpers'

export async function GET() {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const items = await db.wishlistItem.findMany({
    where: { userId: user!.id },
    include: { product: { include: { seller: true, category: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return json({
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      product: {
        ...i.product,
        images: parseJson<string[]>(i.product.images, []),
        colors: parseJson<string[]>(i.product.colors, []),
        sizes: parseJson<string[]>(i.product.sizes, []),
        tags: parseJson<string[]>(i.product.tags, []),
      },
    })),
  })
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { productId } = await req.json()
    if (!productId) return json({ error: 'Product is required' }, 400)

    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId: user!.id, productId } },
    })
    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } })
      return json({ wishlisted: false })
    }
    await db.wishlistItem.create({ data: { userId: user!.id, productId } })
    return json({ wishlisted: true })
  } catch (e) {
    console.error('wishlist POST error', e)
    return json({ error: 'Failed to update wishlist' }, 500)
  }
}
