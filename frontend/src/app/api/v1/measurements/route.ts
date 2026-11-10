import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const profile = await db.bodyProfile.findUnique({ where: { userId: user!.id } })
  return json({ profile })
}

export async function PUT(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const body = await req.json()
    const num = (v: unknown) => (v === '' || v === null || v === undefined || isNaN(parseFloat(String(v))) ? null : parseFloat(String(v)))
    const data = {
      height: num(body.height),
      weight: num(body.weight),
      chest: num(body.chest),
      waist: num(body.waist),
      hip: num(body.hip),
      shoulder: num(body.shoulder),
      sleeveLength: num(body.sleeveLength),
      unit: ['cm', 'inch'].includes(body.unit) ? body.unit : 'cm',
    }

    const profile = await db.bodyProfile.upsert({
      where: { userId: user!.id },
      create: { userId: user!.id, ...data },
      update: data,
    })
    return json({ profile })
  } catch (e) {
    console.error('measurements PUT error', e)
    return json({ error: 'Failed to save measurements' }, 500)
  }
}
