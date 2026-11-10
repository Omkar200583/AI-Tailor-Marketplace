import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'

// PATCH /api/v1/admin/sellers/:id — verify / reject seller
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['ADMIN'])
  if (denied) return denied

  try {
    const { id } = await params
    const { verificationStatus } = await req.json()
    if (!['PENDING', 'VERIFIED', 'REJECTED'].includes(verificationStatus)) {
      return json({ error: 'Invalid verification status' }, 400)
    }

    const seller = await db.sellerProfile.findUnique({ where: { id }, include: { user: true } })
    if (!seller) return json({ error: 'Seller not found' }, 404)

    const updated = await db.sellerProfile.update({
      where: { id },
      data: { verificationStatus },
    })
    await db.user.update({ where: { id: seller.userId }, data: { isVerified: verificationStatus === 'VERIFIED' } })

    await db.notification.create({
      data: {
        userId: seller.userId,
        title: verificationStatus === 'VERIFIED' ? 'Shop Verified ✅' : verificationStatus === 'REJECTED' ? 'Verification Rejected' : 'Verification Reset',
        body: verificationStatus === 'VERIFIED'
          ? `${seller.shopName} is now a verified tailor on AI Tailor. Orders will flow in!`
          : `Your shop verification status changed to ${verificationStatus}.`,
        type: 'INFO',
      },
    })

    return json({ seller: updated })
  } catch (e) {
    console.error('admin sellers PATCH error', e)
    return json({ error: 'Failed to update seller verification' }, 500)
  }
}
