import crypto from 'crypto'

import { db } from '@/lib/db'
import { hashPassword, json } from '@/lib/auth'

function verifyRegistrationKey(
  provided: string,
  expected: string
): boolean {
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)

  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(
    providedBuffer,
    expectedBuffer
  )
}

export async function POST(req: Request) {
  try {
    const registrationKey = process.env.ADMIN_REGISTRATION_KEY

    if (!registrationKey || registrationKey.length < 32) {
      console.error('ADMIN_REGISTRATION_KEY is missing or too short')

      return json({
        error: 'Admin registration is not configured.',
      }, 503)
    }

    const body = await req.json()

    const {
      name,
      email,
      password,
      secretKey,
    } = body || {}

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof secretKey !== 'string'
    ) {
      return json({
        error: 'Invalid registration details.',
      }, 400)
    }

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return json({
        error: 'Name must contain between 2 and 100 characters.',
      }, 400)
    }

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)
    ) {
      return json({
        error: 'Please enter a valid email address.',
      }, 400)
    }

    if (password.length < 8 || password.length > 128) {
      return json({
        error: 'Password must contain between 8 and 128 characters.',
      }, 400)
    }

    if (!secretKey || secretKey.length > 512) {
      return json({
        error: 'Invalid registration key.',
      }, 403)
    }

    if (!verifyRegistrationKey(secretKey, registrationKey)) {
      return json({
        error: 'Invalid registration key.',
      }, 403)
    }

    const existing = await db.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (existing) {
      return json({
        error: 'An account with this email already exists.',
      }, 409)
    }

    const avatarColors = [
      '#7C2D3E',
      '#B45309',
      '#166534',
      '#7E22CE',
    ]

    const avatarColor =
      avatarColors[
        crypto.randomInt(0, avatarColors.length)
      ]

    const user = await db.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        role: 'ADMIN',
        city: 'Pune',
        avatarColor,
        isVerified: true,
        isActive: true,
      },
    })

    return json({
      success: true,
      message: 'Administrator account created successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }, 201)

  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return json({
        error: 'An account with this email already exists.',
      }, 409)
    }

    console.error('Admin registration error:', error)

    return json({
      error: 'Registration failed. Please try again.',
    }, 500)
  }
}
