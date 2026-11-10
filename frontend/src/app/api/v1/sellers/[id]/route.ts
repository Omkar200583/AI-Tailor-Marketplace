import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { parseJson } from '@/lib/helpers'
import { Prisma } from '@prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Detect which fields the live Prisma SellerProfile model actually has,
// so we never crash with `Unknown argument 'portfolio'` (or any other field
// the user hasn't migrated yet).
// ─────────────────────────────────────────────────────────────────────────────
const SELLER_PROFILE_FIELDS = new Set<string>(
  Prisma.dmmf.datamodel.models
    .find((m) => m.name === 'SellerProfile')
    ?.fields.map((f) => f.name) ?? []
)

function hasField(name: string): boolean {
  return SELLER_PROFILE_FIELDS.has(name)
}

// Helper: parse a JSON-string column back into an array, tolerating
// missing columns / nulls / non-array values.
function readJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[]
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

// GET /api/v1/sellers/:id — tailor profile with products + reviews
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const seller = await db.sellerProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, avatarColor: true, isVerified: true, createdAt: true } } },
    })
    if (!seller) return json({ error: 'Tailor not found' }, 404)

    const [products, reviews, orderCount] = await Promise.all([
      db.product.findMany({
        where: { sellerId: id, status: 'ACTIVE' },
        include: {
          category: true,
          seller: { include: { user: { select: { id: true, name: true, avatarColor: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.review.findMany({
        where: { sellerId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { customer: { select: { id: true, name: true, avatarColor: true } } },
      }),
      db.order.count({ where: { sellerId: id, status: { in: ['CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'COMPLETED'] } } }),
    ])

    // Build the seller response dynamically, only including columns that exist.
    const sellerOut: Record<string, unknown> = { ...seller }
    if (hasField('services')) sellerOut.services = readJsonArray((seller as any).services)
    if (hasField('portfolio')) sellerOut.portfolio = readJsonArray((seller as any).portfolio)
    sellerOut.completedOrders = orderCount

    return json({
      seller: sellerOut,
      products: products.map((p) => ({
        ...p,
        images: readJsonArray(p.images),
        colors: readJsonArray(p.colors),
        sizes: readJsonArray(p.sizes),
        tags: readJsonArray(p.tags),
      })),
      reviews,
    })
  } catch (e) {
    console.error('seller GET error', e)
    return json({ error: 'Failed to load tailor profile' }, 500)
  }
}

// PUT /api/v1/sellers/:id — update the seller's own shop profile
// Only writes fields that exist in the live Prisma schema, so adding/removing
// columns later never breaks this endpoint.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['SELLER', 'ADMIN'])
  if (denied) return denied

  try {
    const { id } = await params

    const seller = await db.sellerProfile.findUnique({ where: { id } })
    if (!seller) return json({ error: 'Seller not found' }, 404)

    // Only the owner (or an admin) may edit this profile.
    if (user!.role === 'SELLER' && seller.userId !== user!.id) {
      return json({ error: 'You can only edit your own shop profile' }, 403)
    }

    const body = await req.json()
    const {
      shopName, description, contactNumber, whatsappNumber,
      address, city, services, specialization, experienceYears,
      availability, portfolio, lat, lng,
    } = body

    const toString = (v: unknown): string | undefined =>
      v === undefined || v === null ? undefined : String(v).trim()

    const data: Record<string, unknown> = {}
    const skipped: string[] = []

    // ── String fields ──────────────────────────────────────────────────────
    if (shopName !== undefined) {
      const v = toString(shopName)
      if (!v) return json({ error: 'Shop name cannot be empty' }, 400)
      if (hasField('shopName')) data.shopName = v
    }
    if (description !== undefined && hasField('description')) {
      data.description = toString(description) ?? ''
    }
    if (contactNumber !== undefined && hasField('contactNumber')) {
      data.contactNumber = toString(contactNumber)
    }
    if (whatsappNumber !== undefined && hasField('whatsappNumber')) {
      data.whatsappNumber = toString(whatsappNumber)
    }
    if (address !== undefined) {
      const v = toString(address)
      if (!v) return json({ error: 'Address cannot be empty' }, 400)
      if (hasField('address')) data.address = v
    }
    if (city !== undefined && hasField('city')) {
      data.city = toString(city)
    }
    if (specialization !== undefined && hasField('specialization')) {
      data.specialization = toString(specialization) ?? ''
    }
    if (availability !== undefined && hasField('availability')) {
      data.availability = toString(availability) ?? ''
    }

    // ── Number fields ──────────────────────────────────────────────────────
    if (experienceYears !== undefined && hasField('experienceYears')) {
      const n = Number(experienceYears)
      data.experienceYears = Number.isFinite(n) && n >= 0 ? n : 0
    }

    // ── JSON-array fields (services, portfolio) ───────────────────────────
    if (services !== undefined && hasField('services')) {
      data.services = JSON.stringify(
        Array.isArray(services) ? services.filter(Boolean) : []
      )
    }
    if (portfolio !== undefined && hasField('portfolio')) {
      data.portfolio = JSON.stringify(
        Array.isArray(portfolio) ? portfolio.filter(Boolean) : []
      )
    }

    // ── Geo fields (lat/lng) ───────────────────────────────────────────────
    if (lat !== undefined && lng !== undefined) {
      const la = Number(lat), lo = Number(lng)
      if (Number.isFinite(la) && Number.isFinite(lo)) {
        if (hasField('lat')) data.lat = la
        if (hasField('lng')) data.lng = lo
      }
    }

    // Track fields the caller asked for but the schema doesn't have, so the
    // response explains why nothing was saved (helpful for debugging).
    const requestedFields: { v: unknown; field: string }[] = [
      { v: shopName, field: 'shopName' },
      { v: description, field: 'description' },
      { v: contactNumber, field: 'contactNumber' },
      { v: whatsappNumber, field: 'whatsappNumber' },
      { v: address, field: 'address' },
      { v: city, field: 'city' },
      { v: services, field: 'services' },
      { v: specialization, field: 'specialization' },
      { v: experienceYears, field: 'experienceYears' },
      { v: availability, field: 'availability' },
      { v: portfolio, field: 'portfolio' },
      { v: lat, field: 'lat' },
      { v: lng, field: 'lng' },
    ]
    for (const { v, field } of requestedFields) {
      if (v !== undefined && !hasField(field)) skipped.push(field)
    }

    // If after filtering there's nothing to update, return early.
    if (Object.keys(data).length === 0) {
      return json({
        seller: { ...seller, services: readJsonArray((seller as any).services) },
        warning: 'No updatable fields matched your Prisma schema.',
        skipped,
      })
    }

    const updated = await db.sellerProfile.update({ where: { id }, data })

    const sellerOut: Record<string, unknown> = { ...updated }
    if (hasField('services')) sellerOut.services = readJsonArray((updated as any).services)
    if (hasField('portfolio')) sellerOut.portfolio = readJsonArray((updated as any).portfolio)

    return json({
      seller: sellerOut,
      skipped: skipped.length ? skipped : undefined,
    })
  } catch (e) {
    console.error('seller PUT error', e)
    return json({ error: 'Failed to update seller profile' }, 500)
  }
}
