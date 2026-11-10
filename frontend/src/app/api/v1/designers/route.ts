import { db } from '@/lib/db'
import { json } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const where: Record<string, unknown> = {}
    if (q) {
      where.OR = [
        { specialty: { contains: q } },
        { title: { contains: q } },
        { bio: { contains: q } },
      ]
    }
    const designers = await db.designerProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatarColor: true, isVerified: true } } },
      orderBy: { rating: 'desc' },
    })
    return json({ designers })
  } catch (e) {
    console.error('designers GET error', e)
    return json({ error: 'Failed to load designers' }, 500)
  }
}
