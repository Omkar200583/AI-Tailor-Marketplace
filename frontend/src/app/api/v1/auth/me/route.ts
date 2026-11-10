import { getSessionUser, json } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return json({ user: null }, 200)

  const [cartCount, unreadNotifications] = await Promise.all([
    db.cartItem.count({ where: { userId: user.id } }),
    db.notification.count({ where: { userId: user.id, isRead: false } }),
  ])

 let seller: {
  id: string
  shopName: string
  verificationStatus: string
} | null = null
  if (user.role === 'SELLER') {
    const sp = await db.sellerProfile.findUnique({ where: { userId: user.id } })
    seller = sp ? { id: sp.id, shopName: sp.shopName, verificationStatus: sp.verificationStatus } : null
  }

  return json({ user: { ...user, cartCount, unreadNotifications, seller } })
}
