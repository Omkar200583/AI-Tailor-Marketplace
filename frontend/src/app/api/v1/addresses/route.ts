import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied
  const addresses = await db.customerAddress.findMany({
    where: { customerId: user!.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })
  return json({ addresses })
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const body = await req.json()
    const { fullName, phone, line1, line2, landmark, city, state, pincode, isDefault } = body
    if (!fullName || !phone || !line1 || !city || !state || !pincode) {
      return json({ error: 'Missing required fields' }, 400)
    }
    if (!/^\d{6}$/.test(String(pincode))) return json({ error: 'PIN must be 6 digits' }, 400)
    if (!/^\d{10}$/.test(String(phone))) return json({ error: 'Phone must be 10 digits' }, 400)

    if (isDefault) {
      await db.customerAddress.updateMany({
        where: { customerId: user!.id, isDefault: true },
        data: { isDefault: false },
      })
    }
    const addr = await db.customerAddress.create({
      data: {
        customerId: user!.id,
        fullName: String(fullName),
        phone: String(phone),
        line1: String(line1),
        line2: line2 ? String(line2) : null,
        landmark: landmark ? String(landmark) : null,
        city: String(city),
        state: String(state),
        pincode: String(pincode),
        isDefault: !!isDefault,
      },
    })
    return json({ address: addr }, 201)
  } catch (e) {
    console.error('addresses POST error', e)
    return json({ error: 'Failed to save address' }, 500)
  }
}
