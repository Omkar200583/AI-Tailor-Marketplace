import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'

// PATCH /api/v1/admin/users/:id — activate/deactivate users
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['ADMIN'])
  if (denied) return denied

  try {
    const { id } = await params
    const { isActive } = await req.json()
    if (id === user!.id) return json({ error: 'You cannot deactivate yourself' }, 400)

    const target = await db.user.findUnique({ where: { id } })
    if (!target) return json({ error: 'User not found' }, 404)

    const updated = await db.user.update({
      where: { id },
      data: { isActive: isActive !== undefined ? !!isActive : !target.isActive },
    })
    return json({ user: { id: updated.id, isActive: updated.isActive } })
  } catch (e) {
    console.error('admin users PATCH error', e)
    return json({ error: 'Failed to update user' }, 500)
  }
}
