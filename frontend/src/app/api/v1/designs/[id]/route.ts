import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'

// PATCH /api/v1/designs/:id — save | send-to-tailor
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { id } = await params
    const { action, sellerId } = await req.json()

    const design = await db.design.findUnique({ where: { id } })
    if (!design || design.userId !== user!.id) return json({ error: 'Design not found' }, 404)

    if (action === 'save') {
      const updated = await db.design.update({ where: { id }, data: { status: 'SAVED' } })
      return json({ design: updated })
    }

    if (action === 'send-to-tailor') {
      if (!sellerId) return json({ error: 'Choose a tailor first' }, 400)
      const seller = await db.sellerProfile.findUnique({ where: { id: sellerId } })
      if (!seller) return json({ error: 'Tailor not found' }, 404)

      const updated = await db.design.update({ where: { id }, data: { status: 'SENT_TO_TAILOR', sentToSellerId: sellerId } })

      // Create or reuse conversation and post the design as a message
      const conversation = await db.conversation.upsert({
        where: { customerId_sellerId: { customerId: user!.id, sellerId } },
        create: { customerId: user!.id, sellerId },
        update: {},
      })
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user!.id,
          content: `🎨 AI Design: ${design.title}`,
          type: 'IMAGE',
          refId: design.id,
        },
      })
      await db.conversation.update({
        where: { id: conversation.id },
        data: { lastMessage: `🎨 AI Design: ${design.title}`, lastMessageAt: new Date() },
      })

      await db.notification.create({
        data: { userId: seller.userId, title: 'New AI Design Received 🎨', body: `${user!.name} sent you an AI-generated design.`, type: 'AI', refId: design.id },
      })
      await db.notification.create({
        data: { userId: user!.id, title: 'Design Sent to Tailor ✅', body: `Your design was shared with ${seller.shopName}. Chat with them to finalize.`, type: 'AI' },
      })

      return json({ design: updated, conversationId: conversation.id })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    console.error('design PATCH error', e)
    return json({ error: 'Failed to update design' }, 500)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const { id } = await params
  const design = await db.design.findUnique({ where: { id } })
  if (!design || design.userId !== user!.id) return json({ error: 'Design not found' }, 404)
  await db.design.delete({ where: { id } })
  return json({ ok: true })
}
