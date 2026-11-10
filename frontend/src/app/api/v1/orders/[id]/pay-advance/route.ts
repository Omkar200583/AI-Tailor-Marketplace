// app/api/v1/orders/[id]/pay-advance/route.ts
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
  const advanceAmount = order.totalAmount / 2

  const rzp = razorpay()
  const rzpOrder = await rzp.orders.create({
    amount: Math.round(advanceAmount * 100),
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order.id, kind: 'ADVANCE', customerId: user!.id },
  })

  return json({
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    amount: advanceAmount,
    currency: 'INR',
  })
}
