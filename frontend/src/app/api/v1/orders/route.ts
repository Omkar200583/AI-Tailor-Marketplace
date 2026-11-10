import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { parseJson, calcOrderTotals } from '@/lib/helpers'
import { notify } from '@/lib/notify'
import type { Prisma } from '@prisma/client'

// GET /api/v1/orders — role-aware order list
export async function GET() {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    let where: Prisma.OrderWhereInput = {}

    if (user!.role === 'CUSTOMER' || user!.role === 'DESIGNER') {
      where = { customerId: user!.id }
    } else if (user!.role === 'SELLER') {
      const seller = await db.sellerProfile.findUnique({ where: { userId: user!.id } })
      if (!seller) return json({ orders: [] })
      where = { sellerId: seller.id }
    }
    // ADMIN sees all orders (where = {})

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        customer: {
          select: { id: true, name: true, avatarColor: true, phone: true, email: true },
        },
        seller: {
          include: {
            user: { select: { name: true, avatarColor: true } },
          },
        },
        measurements: true,
        design: true,
        payments: { orderBy: { createdAt: 'desc' } },
        timeline: true,
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    return json({ orders })
  } catch (error) {
    console.error('orders GET error:', error)
    return json({ error: 'Failed to load orders' }, 500)
  }
}

// POST /api/v1/orders — create order from cart or direct buy (legacy/backup flow)
// The primary checkout flow uses /checkout/initiate instead.
export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['CUSTOMER', 'DESIGNER'])
  if (denied) return denied

  try {
    const body = await req.json()
    const { address, notes, directBuy } = body || {}
    if (!address || !String(address).trim()) return json({ error: 'Delivery address is required' }, 400)

    // Build line items
    let lines: { productId: string | null; name: string; image: string; price: number; size: string; color: string; quantity: number; withStitching: boolean; customization: string; sellerId: string }[] = []

    if (directBuy?.productId) {
      const product = await db.product.findUnique({ where: { id: directBuy.productId } })
      if (!product) return json({ error: 'Product not found' }, 404)
      const price = product.price + (directBuy.withStitching && product.stitchingPrice ? product.stitchingPrice : 0)
      lines = [{
        productId: product.id, name: product.name,
        image: parseJson<string[]>(product.images, [])[0] || '',
        price, size: directBuy.size || 'M', color: directBuy.color || '',
        quantity: parseInt(String(directBuy.quantity)) || 1,
        withStitching: !!directBuy.withStitching,
        customization: directBuy.customization || '',
        sellerId: product.sellerId,
      }]
    } else {
      const cartItems = await db.cartItem.findMany({
        where: { userId: user!.id },
        include: { product: true },
      })
      if (cartItems.length === 0) return json({ error: 'Your cart is empty' }, 400)
      lines = cartItems.map((ci) => {
        const price = ci.product.price + (ci.withStitching && ci.product.stitchingPrice ? ci.product.stitchingPrice : 0)
        return {
          productId: ci.productId, name: ci.product.name,
          image: parseJson<string[]>(ci.product.images, [])[0] || '',
          price, size: ci.size, color: ci.color,
          quantity: ci.quantity, withStitching: ci.withStitching,
          customization: ci.note || '', sellerId: ci.product.sellerId,
        }
      })
    }

    // Group by seller
    const bySeller = new Map<string, typeof lines>()
    for (const line of lines) {
      const arr = bySeller.get(line.sellerId) || []
      arr.push(line)
      bySeller.set(line.sellerId, arr)
    }

    const createdOrders: any[] = []

    for (const [sellerId, sellerLines] of bySeller) {
      const subtotal = sellerLines.reduce((sum, l) => sum + l.price * l.quantity, 0)
      const totals = calcOrderTotals(subtotal)
      const advanceAmount = Math.round(subtotal * 0.25 * 100) / 100
      const remainingAmount = Math.round((subtotal - advanceAmount) * 100) / 100
      const orderNumber = `AIT-${Date.now()}${Math.floor(Math.random() * 90 + 10)}`

      const order = await db.order.create({
        data: {
          orderNumber,
          customerId: user!.id,
          sellerId,
          status: 'REQUESTED',
          totalAmount: totals.subtotal,
          commission: totals.commission,
          sellerEarning: totals.sellerEarning,
          advanceAmount,
          remainingAmount,
          advanceStatus: 'UNPAID',
          finalStatus: 'UNPAID',
          paymentStatus: 'UNPAID',
          address: String(address),
          notes: notes ? String(notes) : '',
          timeline: { create: {} },
          statusHistory: {
            create: { status: 'REQUESTED', note: 'Order request created', actorId: user!.id },
          },
          items: {
            create: sellerLines.map((l) => ({
              productId: l.productId, name: l.name, image: l.image,
              price: l.price, size: l.size, color: l.color,
              quantity: l.quantity, withStitching: l.withStitching,
              customization: l.customization,
            })),
          },
        },
        include: { items: true },
      })
      createdOrders.push(order)

      // Notify seller
      const seller = await db.sellerProfile.findUnique({ where: { id: sellerId }, include: { user: true } })
      if (seller) {
        await notify({
          userId: seller.userId, type: 'ORDER',
          title: 'New order request 🧾',
          body: `Order ${orderNumber} from ${user!.name}.`,
          refId: order.id,
        })
      }

      // Clear purchased cart items
      if (!directBuy?.productId) {
        await db.cartItem.deleteMany({ where: { userId: user!.id } })
      }
    }

    return json({ orders: createdOrders }, 201)
  } catch (e) {
    console.error('orders POST error', e)
    return json({ error: 'Failed to place order' }, 500)
  }
}
