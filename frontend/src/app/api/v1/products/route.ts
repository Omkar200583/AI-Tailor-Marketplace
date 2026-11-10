import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { parseJson } from '@/lib/helpers'

const isObjectId = (v: string) => /^[a-f\d]{24}$/i.test(v)
const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// Accept "colors" / "sizes" / "tags" as either an array or "S, M, L" string
const toList = (v: unknown, fallback: string[] = []): string[] => {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean)
  if (typeof v === 'string' && v.trim()) return v.split(',').map((x) => x.trim()).filter(Boolean)
  return fallback
}

// GET /api/v1/products — list with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') // slug
    const q = searchParams.get('q')
    const sellerId = searchParams.get('sellerId')
    const featured = searchParams.get('featured')
    const minPrice = parseFloat(searchParams.get('minPrice') || '')
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '')
    const sort = searchParams.get('sort') || 'newest'
    const limit = Math.min(parseInt(searchParams.get('limit') || '60'), 100)

    const where: Record<string, unknown> = { status: 'ACTIVE' }
    if (category) where.category = { slug: category }
    if (sellerId) where.sellerId = sellerId
    if (featured === '1') where.isFeatured = true
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      where.price = {
        ...(isNaN(minPrice) ? {} : { gte: minPrice }),
        ...(isNaN(maxPrice) ? {} : { lte: maxPrice }),
      }
    }
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { fabric: { contains: q } },
        { tags: { contains: q } },
      ]
    }

    const orderBy =
      sort === 'price_low' ? { price: 'asc' as const }
      : sort === 'price_high' ? { price: 'desc' as const }
      : sort === 'rating' ? { rating: 'desc' as const }
      : sort === 'popular' ? { soldCount: 'desc' as const }
      : { createdAt: 'desc' as const }

    const products = await db.product.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        category: true,
        seller: { include: { user: { select: { name: true, avatarColor: true } } } },
      },
    })

    return json({
      products: products.map((p) => ({
        ...p,
        images: parseJson<string[]>(p.images, []),
        colors: parseJson<string[]>(p.colors, []),
        sizes: parseJson<string[]>(p.sizes, []),
        tags: parseJson<string[]>(p.tags, []),
      })),
    })
  } catch (e) {
    console.error('products GET error', e)
    return json({ error: 'Failed to load products' }, 500)
  }
}

// POST /api/v1/products — create (seller or admin)
// Category is AUTO-CREATED if it doesn't exist, so sellers never get blocked.
export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['SELLER', 'ADMIN'])
  if (denied) return denied

  try {
    const body = await req.json()

    const {
      name, description, categoryId, category: categoryInput,
      fabric, price, stitchingPrice, colors, sizes, images,
      deliveryDays, stock, customizationAvailable, tags,
    } = body

    const categoryRef = String(categoryId ?? categoryInput ?? '').trim()
    const hasPrice = price !== undefined && price !== null && String(price).trim() !== ''

    if (!String(name ?? '').trim()) return json({ error: 'Product name is required' }, 400)
    if (!categoryRef) return json({ error: 'Please select a category' }, 400)
    if (!hasPrice) return json({ error: 'Price is required' }, 400)

    const productPrice = Number(price)
    if (!Number.isFinite(productPrice) || productPrice <= 0) {
      return json({ error: 'Please provide a valid product price' }, 400)
    }

    // Get sellerId from the authenticated user
    let sellerId: string
    if (user!.role === 'SELLER') {
      const seller = await db.sellerProfile.findUnique({ where: { userId: user!.id } })
      if (!seller) {
        return json({ error: 'Seller profile not found. Complete your seller registration.' }, 404)
      }
      sellerId = seller.id
    } else {
      // Admin must specify sellerId
      sellerId = body.sellerId
      if (!sellerId) return json({ error: 'sellerId is required for admin' }, 400)
    }

    // Resolve category by id, slug, or case-insensitive name — auto-create if missing
    let category = isObjectId(categoryRef)
      ? await db.category.findUnique({ where: { id: categoryRef } })
      : await db.category.findFirst({
          where: {
            OR: [
              { slug: slugify(categoryRef) },
              { name: { equals: categoryRef, mode: 'insensitive' } },
            ],
          },
        })

    if (!category) {
      try {
        category = await db.category.create({
          data: {
            name: categoryRef,
            slug: slugify(categoryRef) || `cat-${Date.now()}`,
            icon: '👕',
            description: '',
          },
        })
      } catch (createErr: any) {
        // Race condition: another request created it between findFirst and create
        if (createErr?.code === 'P2002') {
          category = await db.category.findFirst({ where: { slug: slugify(categoryRef) } })
          if (!category) throw createErr
        } else {
          throw createErr
        }
      }
    }

    const parsedStitching =
      stitchingPrice !== undefined && stitchingPrice !== null && String(stitchingPrice).trim() !== ''
        ? Number(stitchingPrice)
        : null

    const product = await db.product.create({
      data: {
        sellerId,
        categoryId: category!.id,
        name: String(name).trim(),
        description: description ? String(description) : '',
        fabric: fabric ? String(fabric) : 'Cotton',
        price: productPrice,
        stitchingPrice: parsedStitching !== null && Number.isFinite(parsedStitching) ? parsedStitching : null,
        images: JSON.stringify(Array.isArray(images) ? images : []),
        colors: JSON.stringify(toList(colors)),
        sizes: JSON.stringify(toList(sizes, ['S', 'M', 'L', 'XL'])),
        deliveryDays: Number(deliveryDays) || 7,
        stock: stock !== undefined && stock !== '' ? Number(stock) : 10,
        customizationAvailable: customizationAvailable !== false,
        tags: JSON.stringify(toList(tags)),
        status: 'ACTIVE',
      },
      include: {
        category: true,
        seller: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    })

    return json(
      {
        success: true,
        message: 'Product created successfully',
        product: {
          ...product,
          images: parseJson<string[]>(product.images, []),
          colors: parseJson<string[]>(product.colors, []),
          sizes: parseJson<string[]>(product.sizes, []),
          tags: parseJson<string[]>(product.tags, []),
        },
      },
      201
    )
  } catch (e) {
    console.error('products POST error:', e)

    if (typeof e === 'object' && e !== null && 'code' in e && e.code === 'P2003') {
      return json({ success: false, error: 'Invalid seller or category reference.' }, 400)
    }

    return json({ success: false, error: 'Failed to create product' }, 500)
  }
}
