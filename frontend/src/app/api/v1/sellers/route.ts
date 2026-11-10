import { db } from '@/lib/db'
import { json } from '@/lib/auth'
import { haversineKm } from '@/lib/geo'
import { parseJson } from '@/lib/helpers'

// GET /api/v1/sellers?lat=&lng=&radius=&q=&verified=1
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')
    const radius = parseFloat(searchParams.get('radius') || '')
    const q = searchParams.get('q')

    const where: Record<string, unknown> = {}
    if (searchParams.get('verified') === '1') where.verificationStatus = 'VERIFIED'
    if (q) {
      where.OR = [
        { shopName: { contains: q } },
        { specialization: { contains: q } },
        { address: { contains: q } },
      ]
    }

    const sellers = await db.sellerProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatarColor: true, isVerified: true } }, _count: { select: { products: true } } },
    })

    let list = sellers.map((s) => ({
      ...s,
      services: parseJson<string[]>(s.services, []),
      productCount: s._count.products,
      distanceKm:
        !isNaN(lat) && !isNaN(lng)
          ? Math.round(haversineKm(lat, lng, s.lat, s.lng) * 10) / 10
          : undefined,
    }))

    if (!isNaN(radius)) list = list.filter((s) => (s.distanceKm ?? 999) <= radius)
    if (!isNaN(lat) && !isNaN(lng)) list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))

    return json({ sellers: list })
  } catch (e) {
    console.error('sellers GET error', e)
    return json({ error: 'Failed to load tailors' }, 500)
  }
}
