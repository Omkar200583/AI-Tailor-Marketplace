import { db } from '@/lib/db'
import { hashPassword, setSessionCookie, json } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, phone, role, shopName, city } = body || {}

    if (!name || !email || !password) {
      return json({ error: 'Name, email and password are required' }, 400)
    }
    if (String(password).length < 6) {
      return json({ error: 'Password must be at least 6 characters' }, 400)
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) return json({ error: 'An account with this email already exists' }, 409)

    const allowedRoles = ['CUSTOMER', 'SELLER', 'DESIGNER']
    const finalRole = allowedRoles.includes(role) ? role : 'CUSTOMER'
    const avatarColors = ['#7C2D3E', '#B45309', '#166534', '#7E22CE', '#0F766E', '#BE123C']
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)]

    const user = await db.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        phone: phone ? String(phone) : null,
        passwordHash: hashPassword(String(password)),
        role: finalRole,
        city: city ? String(city) : 'Pune',
        avatarColor,
        isVerified: finalRole === 'CUSTOMER',
      },
    })

    if (finalRole === 'SELLER') {
      await db.sellerProfile.create({
        data: {
          userId: user.id,
          shopName: shopName ? String(shopName).trim() : `${user.name}'s Tailor Studio`,
          city: city ? String(city) : 'Pune',
          contactNumber: phone ? String(phone) : null,
          whatsappNumber: phone ? String(phone) : null,
          description: 'New tailor shop on AI Tailor. Custom stitching for ethnic and modern wear.',
          services: JSON.stringify(['Custom Stitching', 'Alterations']),
        },
      })
    }

    if (finalRole === 'DESIGNER') {
      await db.designerProfile.create({
        data: { userId: user.id, title: 'Fashion Designer', city: city ? String(city) : 'Pune' },
      })
    }

    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to AI Tailor 🎉',
        body:
          finalRole === 'CUSTOMER'
            ? 'Complete your body profile for perfect-fitting custom outfits.'
            : 'Set up your shop profile and start receiving orders.',
        type: 'INFO',
      },
    })

    await setSessionCookie(user.id)
    return json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, 201)
  } catch (e) {
    console.error('register error', e)
    return json({ error: 'Registration failed. Please try again.' }, 500)
  }
}
