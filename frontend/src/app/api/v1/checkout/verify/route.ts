import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { notify } from '@/lib/notify'
import crypto from 'crypto'

export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['CUSTOMER', 'DESIGNER'])
  if (denied) return denied

  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId, kind } = await req.json()
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return json({ error: 'Missing payment parameters' }, 400)
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { payments: true, seller: { include: { user: true } }, design: true, items: true },
    })
    if (!order || order.customerId !== user!.id) {
      return json({ error: 'Order not found' }, 404)
    }

    // Idempotency — already verified?
    const already = order.payments.find(
      (p) => p.razorpayPaymentId === razorpayPaymentId && p.status === 'SUCCESS'
    )
    if (already) {
      return json({ ok: true, alreadyVerified: true })
    }

    // Verify signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expected !== razorpaySignature) {
      await db.paymentTransaction.create({
        data: { orderId, razorpayOrderId, razorpayPaymentId, kind, amount: 0, status: 'FAILED', failureReason: 'Signature mismatch' },
      })
      return json({ error: 'Payment signature verification failed' }, 400)
    }

    // FIX: use remainingAmount directly (set at order creation)
    const amount = kind === 'ADVANCE' ? order.advanceAmount : order.remainingAmount

    await db.$transaction(async (tx) => {
      await tx.paymentTransaction.create({
        data: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, kind, amount, status: 'SUCCESS', verifiedAt: new Date() },
      })

      if (kind === 'ADVANCE') {
        await tx.order.update({
          where: { id: orderId },
          data: { advancePaid: amount, advanceStatus: 'PAID', paymentStatus: 'PARTIAL' },
        })
        await tx.orderStatusHistory.create({
          data: { orderId, status: 'REQUESTED', note: 'Advance payment received — order activated', actorId: user!.id },
        })
      } else {
        await tx.order.update({
          where: { id: orderId },
          data: { finalStatus: 'PAID', paymentStatus: 'PAID' },
        })
        await tx.orderStatusHistory.create({
          data: { orderId, status: order.status, note: 'Final payment received', actorId: user!.id },
        })
      }
    })

    // Link/create conversation + drop an order card message
    const conversation = await db.conversation.upsert({
      where: { customerId_sellerId: { customerId: user!.id, sellerId: order.sellerId } },
      create: { customerId: user!.id, sellerId: order.sellerId },
      update: {},
    })
    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user!.id,
        content: `🧾 Order ${order.orderNumber} · ${kind === 'ADVANCE' ? '25% advance paid ✅' : 'Final payment received ✅'}`,
        type: 'ORDER',
        refId: order.id,
      },
    })
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessage: `🧾 Order ${order.orderNumber}`, lastMessageAt: new Date() },
    })

    // Notifications — customer + seller
    if (kind === 'ADVANCE') {
      await notify({ userId: user!.id, type: 'PAYMENT', title: 'Advance payment successful 💳', body: `₹${amount} paid for ${order.orderNumber}. Seller has been notified.`, refId: order.id })
      await notify({ userId: order.seller.userId, type: 'PAYMENT', title: '25% Advance Received ✅', body: `${order.orderNumber} — ₹${amount} advance payment received. You can now start production!`, refId: order.id })
    } else {
      await notify({ userId: user!.id, type: 'PAYMENT', title: 'Final payment successful 💳', body: `₹${amount} final payment for ${order.orderNumber}.`, refId: order.id })
      await notify({ userId: order.seller.userId, type: 'PAYMENT', title: 'Final Payment Received ✅', body: `${order.orderNumber} — ₹${amount} final payment received. Dispatch now!`, refId: order.id })
    }

    return json({ ok: true, amount, kind, orderNumber: order.orderNumber })
  } catch (e) {
    console.error('checkout/verify error', e)
    return json({ error: 'Payment verification failed' }, 500)
  }
}
