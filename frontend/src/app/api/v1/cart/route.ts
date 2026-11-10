import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { parseJson } from '@/lib/helpers'

function serialize(item: { id: string; productId: string; size: string; color: string; quantity: number; note: string; withStitching: boolean; product: Record<string, unknown> & { images: string; colors: string; sizes: string; tags: string } }) {
  return {
    id: item.id,
    productId: item.productId,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    note: item.note,
    withStitching: item.withStitching,
    product: {
      ...item.product,
      images: parseJson<string[]>(item.product.images, []),
      colors: parseJson<string[]>(item.product.colors, []),
      sizes: parseJson<string[]>(item.product.sizes, []),
      tags: parseJson<string[]>(item.product.tags, []),
    },
  }
}

export async function GET() {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const items = await db.cartItem.findMany({
    where: { userId: user!.id },
    include: { product: { include: { seller: true, category: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return json({ items: items.map(serialize) })
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { productId, size, color, quantity, note, withStitching } = await req.json()
    if (!productId) return json({ error: 'Product is required' }, 400)

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) return json({ error: 'Product not found' }, 404)

    const existing = await db.cartItem.findUnique({
      where: { userId_productId_size_color: { userId: user!.id, productId, size: size || 'M', color: color || '' } },
    })

    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (parseInt(String(quantity)) || 1), withStitching: withStitching ?? existing.withStitching },
      })
    } else {
      await db.cartItem.create({
        data: {
          userId: user!.id,
          productId,
          size: size || 'M',
          color: color || '',
          quantity: parseInt(String(quantity)) || 1,
          note: note ? String(note) : '',
          withStitching: !!withStitching,
        },
      })
    }
    return json({ ok: true }, 201)
  } catch (e) {
    console.error('cart POST error', e)
    return json({ error: 'Failed to add to cart' }, 500)
  }
}

export async function PATCH(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { id, quantity } = await req.json()
    const item = await db.cartItem.findUnique({ where: { id } })
    if (!item || item.userId !== user!.id) return json({ error: 'Cart item not found' }, 404)
    if (quantity <= 0) {
      await db.cartItem.delete({ where: { id } })
    } else {
      await db.cartItem.update({ where: { id }, data: { quantity: parseInt(String(quantity)) } })
    }
    return json({ ok: true })
  } catch (e) {
    console.error('cart PATCH error', e)
    return json({ error: 'Failed to update cart' }, 500)
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (id) {
    const item = await db.cartItem.findUnique({ where: { id } })
    if (!item || item.userId !== user!.id) return json({ error: 'Cart item not found' }, 404)
    await db.cartItem.delete({ where: { id } })
  } else {
    await db.cartItem.deleteMany({ where: { userId: user!.id } })
  }
  return json({ ok: true })
}
