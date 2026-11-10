import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { id } = await params
    const existing = await db.customerAddress.findUnique({ where: { id } })
    if (!existing || existing.customerId !== user!.id) return json({ error: 'Address not found' }, 404)

    const body = await req.json()
    const { fullName, phone, line1, line2, landmark, city, state, pincode, isDefault } = body

    if (isDefault && !existing.isDefault) {
      await db.customerAddress.updateMany({
        where: { customerId: user!.id, isDefault: true },
        data: { isDefault: false },
      })
    }
    const addr = await db.customerAddress.update({
      where: { id },
      data: {
        fullName: fullName ?? existing.fullName,
        phone: phone ?? existing.phone,
        line1: line1 ?? existing.line1,
        line2: line2 !== undefined ? line2 : existing.line2,
        landmark: landmark !== undefined ? landmark : existing.landmark,
        city: city ?? existing.city,
        state: state ?? existing.state,
        pincode: pincode ?? existing.pincode,
        isDefault: isDefault ?? existing.isDefault,
      },
    })
    return json({ address: addr })
  } catch (e) {
    return json({ error: 'Failed to update address' }, 500)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const { id } = await params
  const existing = await db.customerAddress.findUnique({ where: { id } })
  if (!existing || existing.customerId !== user!.id) return json({ error: 'Address not found' }, 404)
  await db.customerAddress.delete({ where: { id } })
  return json({ ok: true })
}
