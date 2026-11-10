// Maps products from the app database (Prisma/SQLite) to the catalog shape the AI engine ranks.
// The engine receives this per request, so the app DB stays the single source of truth.
import { db } from '@/lib/db'
import { parseJson } from '@/lib/helpers'

export type EngineProduct = {
  id: string
  name: string
  category: string
  price: number
  colors: string[]
  fabric: string
  tags: string[]
  rating: number
  salesCount: number
  stock: number
  location: string
  shopName: string
}

export async function loadEngineCatalog(extraWhere: Record<string, unknown> = {}, take = 150): Promise<EngineProduct[]> {
  const products = await db.product.findMany({
    where: { status: 'ACTIVE', ...extraWhere },
    include: { seller: true, category: true },
    orderBy: { soldCount: 'desc' },
    take,
  })
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category.name,
    price: p.price,
    colors: parseJson<string[]>(p.colors, []),
    fabric: p.fabric,
    tags: parseJson<string[]>(p.tags, []),
    rating: p.rating,
    salesCount: p.soldCount,
    stock: p.stock,
    location: p.seller.city,
    shopName: p.seller.shopName,
  }))
}
