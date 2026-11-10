import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'

// GET /api/v1/chat/messages?conversationId=
export async function GET(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get('conversationId')
  if (!conversationId) return json({ error: 'conversationId is required' }, 400)

  const conversation = await db.conversation.findUnique({ where: { id: conversationId } })
  if (!conversation) return json({ error: 'Conversation not found' }, 404)

  // Authorization: only the two participants
  let allowed = conversation.customerId === user!.id
  if (!allowed && user!.role === 'SELLER') {
    const seller = await db.sellerProfile.findUnique({ where: { userId: user!.id } })
    allowed = seller?.id === conversation.sellerId
  }
  if (!allowed && user!.role !== 'ADMIN') return json({ error: 'Not allowed' }, 403)

  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 200,
    include: { sender: { select: { id: true, name: true, role: true, avatarColor: true } } },
  })
  return json({ messages })
}

// POST /api/v1/chat/messages — send a message (persisted; realtime via socket)
export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { conversationId, content, type, refId } = await req.json()
    if (!conversationId || !content) return json({ error: 'Conversation and message content are required' }, 400)

    const conversation = await db.conversation.findUnique({ where: { id: conversationId } })
    if (!conversation) return json({ error: 'Conversation not found' }, 404)

    let allowed = conversation.customerId === user!.id
    if (!allowed && user!.role === 'SELLER') {
      const seller = await db.sellerProfile.findUnique({ where: { userId: user!.id } })
      allowed = seller?.id === conversation.sellerId
    }
    if (!allowed) return json({ error: 'Not allowed' }, 403)

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: user!.id,
        content: String(content).slice(0, 2000),
        type: ['TEXT', 'PRODUCT', 'ORDER', 'IMAGE'].includes(type) ? type : 'TEXT',
        refId: refId || null,
      },
      include: { sender: { select: { id: true, name: true, role: true, avatarColor: true } } },
    })

    await db.conversation.update({
      where: { id: conversationId },
      data: { lastMessage: String(content).slice(0, 120), lastMessageAt: new Date() },
    })

    return json({ message }, 201)
  } catch (e) {
    console.error('message POST error', e)
    return json({ error: 'Failed to send message' }, 500)
  }
}
