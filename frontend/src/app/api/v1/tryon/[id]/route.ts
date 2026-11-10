import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { notify } from '@/lib/notify'

// DELETE /api/v1/tryon/:id — delete a single try-on session (ownership checked)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { id } = await params
    const session = await db.tryonSession.findUnique({ where: { id } })
    if (!session || session.userId !== user!.id) {
      return json({ error: 'Try-on session not found' }, 404)
    }

    await db.tryonSession.delete({ where: { id } })
    return json({ ok: true })
  } catch (e) {
    console.error('tryon DELETE one error', e)
    return json({ error: 'Failed to delete try-on session' }, 500)
  }
}

// POST /api/v1/tryon/:id/share — share a try-on result with a seller via chat
// Body: { sellerId }
// Creates/reuses the conversation and posts the try-on image as a message
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { id } = await params
    const { sellerId } = await req.json()
    if (!sellerId) return json({ error: 'sellerId is required' }, 400)

    const session = await db.tryonSession.findUnique({ where: { id } })
    if (!session || session.userId !== user!.id) {
      return json({ error: 'Try-on session not found' }, 404)
    }

    const seller = await db.sellerProfile.findUnique({ where: { id: sellerId } })
    if (!seller) return json({ error: 'Seller not found' }, 404)
    if (seller.userId === user!.id) return json({ error: 'Cannot share with your own shop' }, 400)

    // Create or reuse the conversation
    const conversation = await db.conversation.upsert({
      where: { customerId_sellerId: { customerId: user!.id, sellerId } },
      create: { customerId: user!.id, sellerId },
      update: {},
    })

    // Post the try-on result as an IMAGE message
    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user!.id,
        content: `🪞 Try-On: ${session.productName}`,
        type: 'IMAGE',
        refId: session.id,
      },
    })

    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessage: `🪞 Try-On: ${session.productName}`, lastMessageAt: new Date() },
    })

    // Notify the seller
    await notify({
      userId: seller.userId,
      type: 'AI',
      title: 'New Try-On shared 🪞',
      body: `${user!.name} shared a virtual try-on result with you.`,
      refId: session.id,
    })

    return json({ ok: true, conversationId: conversation.id, messageId: message.id }, 201)
  } catch (e) {
    console.error('tryon share error', e)
    return json({ error: 'Failed to share try-on' }, 500)
  }
}
