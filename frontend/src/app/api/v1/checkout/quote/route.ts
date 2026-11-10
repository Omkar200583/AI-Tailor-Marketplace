import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { computeQuote } from '@/lib/order-quote'

// POST /api/v1/checkout/quote — server-side price calculation
export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['CUSTOMER', 'DESIGNER'])
  if (denied) return denied

  try {
    const body = await req.json()
    const quote = await computeQuote({
      items: (body.items || []).map((i: any) => ({
        productId: String(i.productId),
        quantity: parseInt(String(i.quantity)) || 1,
        withStitching: !!i.withStitching,
      })),
      designId: body.designId || null,
    })
    return json({ quote })
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
}
