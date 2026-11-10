import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'

// GET /api/v1/chat/conversations — role aware
export async function GET() {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const where =
    user!.role === 'SELLER'
      ? { seller: { userId: user!.id } }
      : { customerId: user!.id }

  const conversations = await db.conversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    include: {
      customer: { select: { id: true, name: true, avatarColor: true, role: true } },
      seller: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  return json({
    conversations: conversations.map((c) => ({
      id: c.id,
      customerId: c.customerId,
      sellerId: c.sellerId,
      lastMessage: c.messages[0]?.content || c.lastMessage || 'Say hello 👋',
      lastMessageAt: c.lastMessageAt,
      customer: c.customer,
      seller: { ...c.seller, user: c.seller.user },
    })),
  })
}

// POST /api/v1/chat/conversations — find or create with a seller
export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { sellerId } = await req.json()
    if (!sellerId) return json({ error: 'sellerId is required' }, 400)

    const seller = await db.sellerProfile.findUnique({ where: { id: sellerId } })
    if (!seller) return json({ error: 'Tailor not found' }, 404)

    // Seller can't chat with self
    if (seller.userId === user!.id) return json({ error: 'This is your own shop' }, 400)

    let conversation = await db.conversation.findUnique({
      where: { customerId_sellerId: { customerId: user!.id, sellerId } },
    })
    if (!conversation) {
      conversation = await db.conversation.create({
        data: { customerId: user!.id, sellerId },
      })
    }
    return json({ conversation }, 201)
  } catch (e) {
    console.error('conversation POST error', e)
    return json({ error: 'Failed to open conversation' }, 500)
  }
}
