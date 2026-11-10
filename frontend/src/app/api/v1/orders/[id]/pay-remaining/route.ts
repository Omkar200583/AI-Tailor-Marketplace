import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { razorpay } from '@/lib/razorpay'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['CUSTOMER', 'DESIGNER'])
  if (denied) return denied

  const { id } = await params
  const order = await db.order.findUnique({ where: { id } })
  if (!order || order.customerId !== user!.id) {
    return json({ error: 'Order not found' }, 404)
  }
  if (order.status !== 'READY') return json({ error: 'Pay the remaining amount only after the seller marks the order ready' }, 400)

  const rzp = razorpay()
  const rzpOrder = await rzp.orders.create({
    amount: Math.round(order.totalAmount * 100),
    currency: 'INR',
    receipt: `${order.orderNumber}-FINAL`,
    notes: { orderId: order.id, kind: 'FINAL' },
  })

  return json({
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    amount: order.totalAmount,
    currency: 'INR',
  })
}
