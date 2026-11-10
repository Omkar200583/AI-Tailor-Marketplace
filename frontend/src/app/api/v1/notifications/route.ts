import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const notifications = await db.notification.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return json({ notifications })
}

export async function PATCH(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const { id, all } = await req.json().catch(() => ({}) as { id?: string; all?: boolean })
  if (all) {
    await db.notification.updateMany({ where: { userId: user!.id }, data: { isRead: true } })
  } else if (id) {
    await db.notification.updateMany({ where: { id, userId: user!.id }, data: { isRead: true } })
  }
  return json({ ok: true })
}
