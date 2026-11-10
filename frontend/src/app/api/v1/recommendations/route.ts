import { db } from '@/lib/db'
import { json } from '@/lib/auth'
import { parseJson } from '@/lib/helpers'
import { aiEngineEnabled, engineJson } from '@/lib/ai-engine'
import { loadEngineCatalog } from '@/lib/ai-catalog'

// GET /api/v1/recommendations?budget=&category=&q=
// Heuristic AI-style recommendation engine
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const budget = parseFloat(searchParams.get('budget') || '')
    const categorySlug = searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20)

    const where: Record<string, unknown> = { status: 'ACTIVE' }
    if (categorySlug) where.category = { slug: categorySlug }

    const products = await db.product.findMany({
      where,
      include: { category: true, seller: true },
    })

    // Preferred path: rank with the Python AI engine, then map back to full DB rows so the
    // response shape is identical to the heuristic below. Any failure falls through to it.
    if (aiEngineEnabled() && products.length > 0) {
      try {
        const catalog = await loadEngineCatalog(categorySlug ? { category: { slug: categorySlug } } : {})
        const out = await engineJson<{ products: { id: string; matchScore: number }[] }>(
          '/api/v1/recommendations',
          { budget: isNaN(budget) ? undefined : budget, limit, catalog },
          8_000
        )
        const byId = new Map(products.map((p) => [p.id, p]))
        const ranked = out.products
          .map((r) => (byId.has(r.id) ? { ...byId.get(r.id)!, score: r.matchScore } : null))
          .filter((x): x is NonNullable<typeof x> => x !== null)
        if (ranked.length > 0) {
          return json({
            products: ranked.map((p) => ({
              ...p,
              images: parseJson<string[]>(p.images, []),
              colors: parseJson<string[]>(p.colors, []),
              sizes: parseJson<string[]>(p.sizes, []),
              tags: parseJson<string[]>(p.tags, []),
            })),
          })
        }
      } catch (engineErr) {
        console.error('recommendations: AI engine failed, using built-in ranking', engineErr)
      }
    }

    // Recommendation score: popularity + rating + budget proximity
    const scored = products.map((p) => {
      let score = p.rating * 12 + Math.min(p.soldCount, 100) * 0.15 + (p.isFeatured ? 8 : 0)
      if (!isNaN(budget)) {
        const diff = Math.abs(p.price - budget)
        score += diff <= budget * 0.15 ? 25 : diff <= budget * 0.4 ? 12 : diff <= budget ? 6 : -18
      }
      return { ...p, score }
    })
    scored.sort((a, b) => b.score - a.score)

    return json({
      products: scored.slice(0, limit).map((p) => ({
        ...p,
        images: parseJson<string[]>(p.images, []),
        colors: parseJson<string[]>(p.colors, []),
        sizes: parseJson<string[]>(p.sizes, []),
        tags: parseJson<string[]>(p.tags, []),
      })),
    })
  } catch (e) {
    console.error('recommendations GET error', e)
    return json({ error: 'Failed to load recommendations' }, 500)
  }
}
