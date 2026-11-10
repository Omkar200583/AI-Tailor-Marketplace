import { db } from '@/lib/db'
import { json } from '@/lib/auth'
import { engineHealth } from '@/lib/ai-engine'

export const dynamic = 'force-dynamic'

// GET /api/v1/health — one call to verify the whole chain (app → database → AI engine).
// Booleans and counts only; no secrets or URLs are exposed.
export async function GET() {
  let database: { ok: boolean; users?: number; products?: number; error?: string }
  try {
    const [users, products] = await Promise.all([db.user.count(), db.product.count()])
    database = { ok: true, users, products }
  } catch (e) {
    console.error('health: database check failed', e)
    database = { ok: false, error: 'Database unreachable. Check DATABASE_URL in .env' }
  }
  const aiEngine = await engineHealth()
  return json({ status: database.ok ? 'ok' : 'degraded', database, aiEngine }, database.ok ? 200 : 503)
}
