import { db } from '@/lib/db'
import { json } from '@/lib/auth'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const designer = await db.designerProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, avatarColor: true, isVerified: true, createdAt: true } } },
    })
    if (!designer) return json({ error: 'Designer not found' }, 404)
    return json({ designer })
  } catch (e) {
    console.error('designer GET error', e)
    return json({ error: 'Failed to load designer profile' }, 500)
  }
}
