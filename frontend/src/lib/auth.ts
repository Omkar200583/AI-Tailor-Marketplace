import { cookies } from 'next/headers'
import crypto from 'crypto'
import { db } from '@/lib/db'

const DEV_SECRET = 'ai-tailor-dev-secret-2026'
function secret(): string {
  const s = process.env.AUTH_SECRET
  if (s) return s
  // The dev fallback is public (it is in this repo). Never sign real sessions with it.
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET must be set in production (see .env.example)')
  return DEV_SECRET
}
export const SESSION_COOKIE = 'ait_session'
const SESSION_DAYS = 30

// ---------- Password hashing (scrypt) ----------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 32).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'))
}

// ---------- Session tokens (HMAC signed) ----------
function sign(data: string): string {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url')
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_DAYS * 86400_000 })
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function readSessionToken(token: string): { uid: string } | null {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload)
  if (expected.length !== sig.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (data.exp < Date.now()) return null
    return { uid: data.uid }
  } catch {
    return null
  }
}

// ---------- Session helpers for route handlers ----------
export async function setSessionCookie(userId: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  profileImage: string | null
  avatarColor: string
  city: string | null
  isVerified: boolean
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const parsed = readSessionToken(token)
  if (!parsed) return null
  const user = await db.user.findUnique({ where: { id: parsed.uid } })
  if (!user || !user.isActive) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    profileImage: user.profileImage,
    avatarColor: user.avatarColor,
    city: user.city,
    isVerified: user.isVerified,
  }
}

// ---------- API helpers ----------
export function json(data: unknown, status = 200) {
  return Response.json(data, { status })
}

export function requireAuth(user: SessionUser | null, roles?: string[]) {
  if (!user) return json({ error: 'Please login to continue' }, 401)
  if (roles && !roles.includes(user.role)) return json({ error: 'Not allowed for your role' }, 403)
  return null
}
