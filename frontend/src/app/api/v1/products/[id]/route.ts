import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { parseJson } from '@/lib/helpers'

// GET /api/v1/products/:id — single product with reviews + related
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          include: { user: { select: { name: true, avatarColor: true, id: true } } },
        },
      },
    })
    if (!product) return json({ error: 'Product not found' }, 404)

    const reviews = await db.review.findMany({
      where: { OR: [{ productId: id }, { sellerId: product.sellerId }] },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { customer: { select: { id: true, name: true, avatarColor: true } } },
    })

    const related = await db.product.findMany({
      where: { categoryId: product.categoryId, id: { not: id }, status: 'ACTIVE' },
      take: 4,
      include: { category: true, seller: true },
    })

    return json({
      product: {
        ...product,
        images: parseJson<string[]>(product.images, []),
        colors: parseJson<string[]>(product.colors, []),
        sizes: parseJson<string[]>(product.sizes, []),
        tags: parseJson<string[]>(product.tags, []),
      },
      reviews,
      related: related.map((p) => ({
        ...p,
        images: parseJson<string[]>(p.images, []),
        colors: parseJson<string[]>(p.colors, []),
        sizes: parseJson<string[]>(p.sizes, []),
        tags: parseJson<string[]>(p.tags, []),
      })),
    })
  } catch (e) {
    console.error('product GET error', e)
    return json({ error: 'Failed to load product' }, 500)
  }
}

// PUT /api/v1/products/:id — owner seller or admin
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['SELLER', 'ADMIN'])
  if (denied) return denied

  try {
    const { id } = await params
    const existing = await db.product.findUnique({ where: { id }, include: { seller: true } })
    if (!existing) return json({ error: 'Product not found' }, 404)
    if (user!.role === 'SELLER' && existing.seller.userId !== user!.id) {
      return json({ error: 'You can only edit your own products' }, 403)
    }

    const body = await req.json()
    const data: Record<string, unknown> = {}

    const fields = ['name', 'description', 'fabric', 'status']
    for (const f of fields) if (body[f] !== undefined) data[f] = body[f]
    if (body.price !== undefined) data.price = parseFloat(String(body.price))
    if (body.stitchingPrice !== undefined) data.stitchingPrice = body.stitchingPrice ? parseFloat(String(body.stitchingPrice)) : null
    if (body.deliveryDays !== undefined) data.deliveryDays = parseInt(String(body.deliveryDays))
    if (body.stock !== undefined) data.stock = parseInt(String(body.stock))
    if (body.customizationAvailable !== undefined) data.customizationAvailable = !!body.customizationAvailable
    if (body.categoryId) data.categoryId = body.categoryId
    if (Array.isArray(body.images)) data.images = JSON.stringify(body.images)
    if (Array.isArray(body.colors)) data.colors = JSON.stringify(body.colors)
    if (Array.isArray(body.sizes)) data.sizes = JSON.stringify(body.sizes)
    if (Array.isArray(body.tags)) data.tags = JSON.stringify(body.tags)

    const product = await db.product.update({ where: { id }, data })

    return json({
      product: {
        ...product,
        images: parseJson<string[]>(product.images, []),
        colors: parseJson<string[]>(product.colors, []),
        sizes: parseJson<string[]>(product.sizes, []),
        tags: parseJson<string[]>(product.tags, []),
      },
    })
  } catch (e) {
    console.error('product PUT error', e)
    return json({ error: 'Failed to update product' }, 500)
  }
}

// DELETE /api/v1/products/:id — owner seller or admin
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['SELLER', 'ADMIN'])
  if (denied) return denied

  try {
    const { id } = await params
    const existing = await db.product.findUnique({ where: { id }, include: { seller: true } })
    if (!existing) return json({ error: 'Product not found' }, 404)
    if (user!.role === 'SELLER' && existing.seller.userId !== user!.id) {
      return json({ error: 'You can only delete your own products' }, 403)
    }
    await db.product.delete({ where: { id } })
    return json({ ok: true })
  } catch (e) {
    console.error('product DELETE error', e)
    return json({ error: 'Failed to delete product' }, 500)
  }
}
