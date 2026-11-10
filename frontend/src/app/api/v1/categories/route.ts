import { db } from '@/lib/db'
import { json } from '@/lib/auth'

// GET /api/v1/categories
// Returns the list of categories, sorted by name.
// Used by the seller dashboard's Category combobox (datalist) and by the
// customer-facing filters.
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    })

    return json({ categories })
  } catch (e) {
    console.error('categories GET error', e)
    return json({ error: 'Failed to load categories' }, 500)
  }
}
