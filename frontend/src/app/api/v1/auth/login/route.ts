import { db } from '@/lib/db'
import { verifyPassword, setSessionCookie, json } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return json({ error: 'Email and password are required' }, 400)

    const user = await db.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    })
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return json({ error: 'Invalid email or password' }, 401)
    }
    if (!user.isActive) return json({ error: 'Your account has been deactivated. Contact support.' }, 403)

    await setSessionCookie(user.id)
    return json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (e) {
    console.error('login error', e)
    return json({ error: 'Login failed. Please try again.' }, 500)
  }
}
