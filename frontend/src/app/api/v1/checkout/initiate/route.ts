// app/api/v1/checkout/initiate/route.ts
import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { computeQuote } from '@/lib/order-quote'
import { notify } from '@/lib/notify'
import { inr } from '@/lib/helpers'

export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['CUSTOMER', 'DESIGNER'])
  if (denied) return denied

  try {
    const body = await req.json()
    const { items, designId, designSnapshot, measurementSnapshot, address, customization } = body || {}

    if (!items?.length) return json({ error: 'Cart is empty' }, 400)
    if (!address || !address.fullName || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
      return json({ error: 'Complete delivery address is required' }, 400)
    }
    if (!/^\d{6}$/.test(String(address.pincode))) return json({ error: 'PIN must be 6 digits' }, 400)
    if (!/^\d{10}$/.test(String(address.phone))) return json({ error: 'Phone must be 10 digits' }, 400)

    // Server-side price calculation
    const quote = await computeQuote({ items, designId })

    // Load customer's body profile for the snapshot
    let measurementData: Record<string, unknown> = {}
    if (measurementSnapshot) {
      measurementData = measurementSnapshot
    } else {
      const bp = await db.bodyProfile.findUnique({ where: { userId: user!.id } })
      if (bp) measurementData = bp
    }

    // Build the design snapshot
    let designData: { title: string; imageUrl: string; category?: string; fabric?: string; color?: string; customization?: string; designId?: string; productId?: string } | null = null
    if (designId) {
      const d = await db.design.findUnique({ where: { id: String(designId) } })
      if (d && d.userId === user!.id) {
        designData = { designId: d.id, title: d.title, imageUrl: d.imageUrl, category: d.category, fabric: d.fabric, customization: customization || undefined }
      }
    } else if (designSnapshot) {
      designData = {
        title: designSnapshot.title || 'Custom design',
        imageUrl: designSnapshot.imageUrl || '',
        category: designSnapshot.category,
        fabric: designSnapshot.fabric,
        color: designSnapshot.color,
        customization: customization || designSnapshot.customization,
        productId: designSnapshot.productId,
      }
    }

    const orderNumber = `AIT-${Date.now()}${Math.floor(Math.random() * 90 + 10)}`
    const addressJson = {
      fullName: address.fullName, phone: address.phone,
      line1: address.line1, line2: address.line2 || '',
      landmark: address.landmark || '',
      city: address.city, state: address.state, pincode: address.pincode,
    }

    // Create the order + snapshots (NO Razorpay order — payment happens later via /pay-advance)
    const order = await db.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNumber,
          customerId: user!.id,
          sellerId: quote.sellerId,
          status: 'REQUESTED',
          totalAmount: quote.totalAmount,
          commission: quote.commission,
          sellerEarning: quote.sellerEarning,
          paymentStatus: 'UNPAID',
          advanceAmount: quote.advanceAmount,
          remainingAmount: quote.remainingAmount,
          advanceStatus: 'UNPAID',
          finalStatus: 'UNPAID',
          address: `${addressJson.line1}, ${addressJson.city}, ${addressJson.state} ${addressJson.pincode}`,
          notes: customization || '',
          deliveryAddressJson: addressJson,
          items: {
            create: quote.lines.map((l) => ({
              productId: l.productId, name: l.name, image: l.image,
              price: l.price + l.stitchingPrice,
              size: 'M', color: '',
              quantity: l.quantity,
              withStitching: l.stitchingPrice > 0,
              customization: customization || '',
            })),
          },
        },
      })

      // Measurement snapshot (immutable)
      if (Object.keys(measurementData).length > 0) {
        await (tx as any).orderMeasurement.create({
          data: {
            orderId: o.id,
            unit: String((measurementData as any).unit || 'cm'),
            height: (measurementData as any).height ?? null,
            weight: (measurementData as any).weight ?? null,
            chest: (measurementData as any).chest ?? null,
            waist: (measurementData as any).waist ?? null,
            hip: (measurementData as any).hip ?? null,
            shoulder: (measurementData as any).shoulder ?? null,
            sleeveLength: (measurementData as any).sleeveLength ?? null,
            raw: measurementData as any,
          },
        })
      }

      // Design snapshot (immutable)
      if (designData) {
        await (tx as any).orderDesign.create({
          data: {
            orderId: o.id,
            designId: designData.designId || null,
            productId: designData.productId || null,
            title: designData.title,
            imageUrl: designData.imageUrl,
            category: designData.category || null,
            fabric: designData.fabric || null,
            color: designData.color || null,
            customization: designData.customization || null,
          },
        })
      }

      // Empty production timeline (seller fills later)
      await (tx as any).productionTimeline.create({ data: { orderId: o.id } })

      // Initial status history
      await (tx as any).orderStatusHistory.create({
        data: { orderId: o.id, status: 'REQUESTED', note: 'Order request created — awaiting advance payment', actorId: user!.id },
      })

      return o
    })

    // Link/create conversation so customer + seller can chat before payment
    const conversation = await db.conversation.upsert({
      where: { customerId_sellerId: { customerId: user!.id, sellerId: quote.sellerId } },
      create: { customerId: user!.id, sellerId: quote.sellerId },
      update: {},
    })
    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user!.id,
        content: `🧾 Order request: ${order.orderNumber} — ${inr(quote.totalAmount)} (25% advance: ${inr(quote.advanceAmount)})`,
        type: 'ORDER',
        refId: order.id,
      },
    })
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessage: `🧾 Order request: ${order.orderNumber}`, lastMessageAt: new Date() },
    })

    // Notify seller: new order request
    const seller = await db.sellerProfile.findUnique({
      where: { id: quote.sellerId },
      include: { user: true },
    })
    if (seller) {
      await notify({
        userId: seller.userId,
        type: 'ORDER',
        title: 'New order request 🧾',
        body: `${order.orderNumber} from ${user!.name}. Review the request — customer will pay 25% advance.`,
        refId: order.id,
      })
    }

    return json({ orderId: order.id, orderNumber: order.orderNumber, advanceAmount: quote.advanceAmount })
  } catch (e) {
    console.error('checkout/initiate error', e)
    return json({ error: (e as Error).message || 'Failed to create order' }, 500)
  }
}
