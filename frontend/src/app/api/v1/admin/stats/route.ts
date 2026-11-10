import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { parseJson } from '@/lib/helpers'

// GET /api/v1/admin/stats — platform overview
export async function GET() {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['ADMIN'])
  if (denied) return denied

  try {
    const [totalUsers, totalSellers, pendingVerifications, totalProducts, totalOrders, activeOrders, paidAgg, commissionAgg, aiDesigns, tryonSessions, recentOrders, sellers, users, categories] = await Promise.all([
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.sellerProfile.count(),
      db.sellerProfile.count({ where: { verificationStatus: 'PENDING' } }),
      db.product.count(),
      db.order.count(),
      db.order.count({ where: { status: { in: ['REQUESTED', 'ACCEPTED', 'CONFIRMED', 'IN_PRODUCTION', 'READY'] } } }),
      db.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalAmount: true } }),
      db.commissionLog.aggregate({ _sum: { amount: true } }),
      db.design.count(),
      db.tryonSession.count(),
      db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { items: true, customer: { select: { id: true, name: true, avatarColor: true } }, seller: { include: { user: { select: { name: true, avatarColor: true } } } } } }),
      db.sellerProfile.findMany({ include: { user: { select: { id: true, name: true, email: true, avatarColor: true, isVerified: true, isActive: true } }, _count: { select: { products: true } } }, orderBy: { createdAt: 'desc' } }),
      db.user.findMany({ where: { role: { in: ['CUSTOMER', 'DESIGNER'] } }, orderBy: { createdAt: 'desc' }, take: 30, include: { _count: { select: { orders: true } } } }),
      db.category.findMany({ include: { _count: { select: { products: true } } } }),
    ])

    return json({
      totalUsers,
      totalSellers,
      pendingVerifications,
      totalProducts,
      totalOrders,
      activeOrders,
      totalRevenue: paidAgg._sum.totalAmount || 0,
      totalCommission: commissionAgg._sum.amount || 0,
      aiDesigns,
      tryonSessions,
      recentOrders,
      sellers: sellers.map((s) => ({ ...s, services: parseJson<string[]>(s.services, []), productCount: s._count.products })),
      users: users.map((u) => ({ ...u, orderCount: u._count.orders })),
      categoryBreakdown: categories.map((c) => ({ name: c.name, count: c._count.products })),
    })
  } catch (e) {
    console.error('admin stats error', e)
    return json({ error: 'Failed to load admin stats' }, 500)
  }
}
