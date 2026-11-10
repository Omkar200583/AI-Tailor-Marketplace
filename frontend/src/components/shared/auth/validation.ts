// Tiny client-side validators shared by the role auth forms.
// The server (/api/v1/auth/*) remains the source of truth.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Email is required'
  return EMAIL_RE.test(v.trim()) ? null : 'Enter a valid email address'
}

export function validateLoginPassword(v: string): string | null {
  return v ? null : 'Password is required'
}

/** Mirrors the register API rule: at least 6 characters. */
export function validateNewPassword(v: string): string | null {
  if (!v) return 'Password is required'
  return v.length >= 6 ? null : 'Password must be at least 6 characters'
}

export function validateName(v: string): string | null {
  return v.trim().length >= 2 ? null : 'Please enter your full name'
}

export function validateOptionalPhone(v: string): string | null {
  if (!v.trim()) return null
  const digits = v.replace(/[\s()+-]/g, '')
  return /^\d{10,13}$/.test(digits) ? null : 'Enter a valid phone number'
}
