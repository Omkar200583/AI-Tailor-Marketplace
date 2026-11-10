// app/api/v1/orders/[id]/route.ts
import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { notify } from '@/lib/notify'

// ═══════════════ GET — load single order with all details ═══════════════
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: { select: { id: true, name: true, email: true, phone: true, avatarColor: true } },
        seller: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
        measurements: true,
        design: true,
        payments: { orderBy: { createdAt: 'desc' } },
        timeline: true,
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })
    if (!order) return json({ error: 'Order not found' }, 404)

    const isCustomer = order.customerId === user!.id
    const isSeller = user!.role === 'SELLER' && order.seller?.userId === user!.id
    const isAdmin = user!.role === 'ADMIN'
    if (!isCustomer && !isSeller && !isAdmin) return json({ error: 'Not allowed' }, 403)

    // PRIVACY GATE: before advance is paid, seller sees LIMITED info only
    if (isSeller && order.advanceStatus !== 'PAID') {
      return json({
        order: {
          ...order,
          measurements: null,
          design: null,
          address: 'Full address available after 25% advance payment',
          deliveryAddressJson: null,
        },
      })
    }

    return json({ order })
  } catch (e) {
    console.error('order GET error', e)
    return json({ error: 'Failed to load order' }, 500)
  }
}

// ═══════════════ PATCH — workflow actions ═══════════════
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { id } = await params
    const body = await req.json()
    const { action, completionDate, dispatchDate, deliveryDate, reason } = body

    const order = await db.order.findUnique({
      where: { id },
      include: { seller: { include: { user: true } }, timeline: true },
    })
    if (!order) return json({ error: 'Order not found' }, 404)

    const isCustomer = order.customerId === user!.id
    const isSeller = user!.role === 'SELLER' && order.seller?.userId === user!.id
    const isAdmin = user!.role === 'ADMIN'

    if (!isCustomer && !isSeller && !isAdmin) {
      return json({ error: 'Not allowed — you do not own this order' }, 403)
    }

    let newStatus: string | null = null
    let note = ''
    const notifications: { userId: string; title: string; body: string }[] = []
    const customerUserId = order.customerId
    const sellerUserId = order.seller?.userId

    switch (action) {

           case 'accept': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can accept' }, 403)
        if (order.status !== 'REQUESTED') return json({ error: 'Order is not pending approval' }, 403)
        // Seller approves FIRST — customer pays 25% advance AFTER approval
        newStatus = 'ACCEPTED'
        note = 'Order approved by seller — awaiting 25% advance payment'
        notifications.push({
          userId: customerUserId,
          title: 'Order Approved ✅',
          body: `Great news! ${order.orderNumber} was approved. Pay the 25% advance (₹${order.advanceAmount}) to start production.`,
        })
        break
      }
      case 'reject': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can reject' }, 403)
        if (!['REQUESTED', 'ACCEPTED'].includes(order.status)) return json({ error: 'Order cannot be rejected now' }, 400)
        newStatus = 'REJECTED'
        note = reason || 'Order rejected by seller'
        notifications.push({ userId: customerUserId, title: 'Order Declined ❌', body: `Order ${order.orderNumber} was declined.${reason ? ' ' + reason : ''}` })
        break
      }
      case 'confirm-measurements': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can confirm measurements' }, 403)
        if (order.status !== 'ACCEPTED') return json({ error: 'Accept the order first' }, 400)
        newStatus = 'CONFIRMED'
        note = 'Measurements confirmed — ready to stitch'
        notifications.push({ userId: customerUserId, title: 'Measurements Confirmed 📏', body: `Tailor confirmed your measurements for ${order.orderNumber}.` })
        break
      }
      case 'start-stitching': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can start stitching' }, 403)
        if (order.status !== 'CONFIRMED') return json({ error: 'Confirm measurements first' }, 400)
        newStatus = 'IN_PRODUCTION'
        note = 'Stitching started'
        await db.productionTimeline.update({ where: { orderId: id }, data: { startDate: new Date() } }).catch(() => null)
        notifications.push({ userId: customerUserId, title: 'Stitching Started 🧵', body: `Your outfit for ${order.orderNumber} is now being stitched.` })
        break
      }
      case 'mark-ready': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can mark ready' }, 403)
        if (order.status !== 'IN_PRODUCTION') return json({ error: 'Start stitching first' }, 400)
        newStatus = 'READY'
        note = 'Order ready for delivery'
        notifications.push({ userId: customerUserId, title: 'Order Ready 📦', body: `${order.orderNumber} is ready! Pay the remaining amount to take delivery.` })
        break
      }
      case 'request-remaining-payment': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can request payment' }, 403)
        if (order.status !== 'READY') return json({ error: 'Mark order ready first' }, 400)
        note = 'Seller requested remaining payment'
        notifications.push({ userId: customerUserId, title: 'Remaining Payment Required 💳', body: `Pay ₹${order.remainingAmount} for ${order.orderNumber}.` })
        break
      }
      case 'mark-shipped': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can ship' }, 403)
        if (order.status !== 'READY') return json({ error: 'Order not ready yet' }, 400)
        if (order.finalStatus !== 'PAID') return json({ error: 'Wait for final payment before shipping' }, 400)
        newStatus = 'DISPATCHED'
        note = 'Order shipped'
        notifications.push({ userId: customerUserId, title: 'Order Shipped 🚚', body: `${order.orderNumber} has been dispatched.` })
        break
      }
      case 'mark-delivered': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can mark delivered' }, 403)
        if (order.status !== 'DISPATCHED') return json({ error: 'Ship the order first' }, 400)
        newStatus = 'DELIVERED'
        note = 'Order delivered'
        notifications.push({ userId: customerUserId, title: 'Order Delivered 🎉', body: `${order.orderNumber} delivered. Leave a review!` })
        break
      }
      case 'set-completion-date': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can set completion date' }, 403)
        if (!completionDate) return json({ error: 'completionDate is required' }, 400)
        await db.productionTimeline.upsert({
          where: { orderId: id },
          create: { orderId: id, estimatedCompletion: new Date(completionDate) },
          update: { estimatedCompletion: new Date(completionDate) },
        })
        await db.order.update({ where: { id }, data: { deliveryDate: new Date(completionDate) } })
        notifications.push({ userId: customerUserId, title: 'Estimated Completion Updated 📅', body: `Est. completion for ${order.orderNumber}: ${new Date(completionDate).toLocaleDateString('en-IN')}` })
        break
      }
      case 'set-dispatch-date': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can set dispatch date' }, 403)
        if (!dispatchDate) return json({ error: 'dispatchDate is required' }, 400)
        await db.productionTimeline.upsert({
          where: { orderId: id },
          create: { orderId: id, expectedDispatch: new Date(dispatchDate) },
          update: { expectedDispatch: new Date(dispatchDate) },
        })
        break
      }
      case 'advance': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can update production' }, 403)
        const flow: Record<string, string> = {
          CONFIRMED: 'IN_PRODUCTION',
          IN_PRODUCTION: 'READY',
          READY: 'DELIVERED',
          DELIVERED: 'COMPLETED',
        }
        const nextStatus = flow[order.status]
        if (!nextStatus) return json({ error: 'Cannot advance this order' }, 400)
        newStatus = nextStatus
        note = 'Status advanced'
        break
      }
      case 'set-delivery': {
        if (!isSeller && !isAdmin) return json({ error: 'Only the seller can set delivery date' }, 403)
        await db.order.update({ where: { id }, data: { deliveryDate: deliveryDate ? new Date(deliveryDate) : null } })
        break
      }
      case 'cancel': {
        if (!isCustomer && !isAdmin) {
          return json({ error: 'You can only cancel your own orders' }, 403)
        }
        if (!['REQUESTED', 'ACCEPTED'].includes(order.status)) {
          return json({ error: 'Order can no longer be cancelled' }, 400)
        }
        newStatus = 'CANCELLED'
        note = 'Order cancelled by customer'
        if (sellerUserId) {
          notifications.push({ userId: sellerUserId, title: 'Order Cancelled ❌', body: `Customer cancelled ${order.orderNumber}.` })
        }
        break
      }
      default:
        return json({ error: 'Unknown action' }, 400)
    }

    const updated = newStatus
      ? await db.order.update({ where: { id }, data: { status: newStatus } })
      : order

    // Create status history entry
    if (newStatus || note) {
      await db.orderStatusHistory.create({
        data: { orderId: id, status: newStatus || order.status, note, actorId: user!.id },
      }).catch(() => null)
    }

    // Send notifications
    for (const n of notifications) {
      await notify({ userId: n.userId, type: 'ORDER', title: n.title, body: n.body, refId: order.id })
    }

    return json({ order: updated })
  } catch (e) {
    console.error('order PATCH error', e)
    return json({ error: 'Failed to update order' }, 500)
  }
}
