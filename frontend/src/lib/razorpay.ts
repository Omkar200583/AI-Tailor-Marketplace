// lib/razorpay.ts
import Razorpay from 'razorpay'

let instance: Razorpay | null = null

export function razorpay(): Razorpay {
  if (instance) return instance

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env')
  }

  instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })

  return instance
}

export const RAZORPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ''
