import { db } from '@/lib/db'

export async function notify({
  userId,
  type = 'INFO',
  title,
  body,
  refId,
}: {
  userId: string
  type?: 'INFO' | 'ORDER' | 'MESSAGE' | 'PAYMENT' | 'AI'
  title: string
  body: string
  refId?: string
}) {
  try {
    const n = await db.notification.create({
      data: { userId, type, title, body, refId },
    })
    return n
  } catch (e) {
    console.error('notify failed', e)
    return null
  }
}
