'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  KeyRound,
  Loader2,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react'

import { AuthFrame } from '@/components/shared/auth/auth-frame'
import {
  TextField,
  PasswordField,
  FormError,
} from '@/components/shared/auth/fields'

import { Button } from '@/components/ui/button'

export function AdminRegister() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretKey: '',
  })

  const update = (field: keyof typeof form) =>
    (value: string) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setError(null)

    if (form.name.trim().length < 2) {
      setError('Please enter your full name.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!form.secretKey.trim()) {
      setError('Admin registration key is required.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/v1/admin/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          secretKey: form.secretKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.')
      }

      setSuccess(true)

      setTimeout(() => {
        router.push('/admin/login')
      }, 1800)

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      themeClass="theme-admin"
      icon={ShieldCheck}
      brandLine="Admin registration"
      headline="Secure platform administration"
      points={[
        'Create authorized administrator accounts',
        'Manage sellers, customers and orders',
        'Monitor the AI Tailor platform',
      ]}
      title="Create administrator"
      subtitle="Register an authorized platform administrator."
      footer={
        <div className="space-y-3">
          <p className="text-xs">
            Administrator registration requires a valid
            platform registration key.
          </p>

          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 font-semibold text-wine-700 hover:text-wine-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Login
          </Link>
        </div>
      }
    >
      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
          <ShieldCheck className="w-10 h-10 text-green-600 mx-auto" />

          <h3 className="font-bold text-green-800 mt-3">
            Administrator created!
          </h3>

          <p className="text-sm text-green-700 mt-1">
            Your account has been created successfully.
            Redirecting to Admin Login...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="flex items-center gap-2 rounded-xl bg-wine-50 border border-wine-100 p-3">
            <ShieldAlert className="w-5 h-5 text-wine-700 shrink-0" />

            <p className="text-xs text-wine-800">
              Restricted registration. Only authorized
              administrators can create accounts.
            </p>
          </div>

          <TextField
            label="Full name"
            icon={User}
            placeholder="Your full name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => update('name')(e.target.value)}
          />

          <TextField
            label="Email address"
            type="email"
            icon={Mail}
            placeholder="admin@example.com"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update('email')(e.target.value)}
          />

          <PasswordField
            label="Password"
            icon={Lock}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update('password')(e.target.value)}
          />

          <PasswordField
            label="Confirm password"
            icon={Lock}
            placeholder="Enter password again"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => update('confirmPassword')(e.target.value)}
          />

          <PasswordField
            label="Secret registration key"
            icon={KeyRound}
            placeholder="Enter authorized registration key"
            autoComplete="off"
            value={form.secretKey}
            onChange={(e) => update('secretKey')(e.target.value)}
          />

          <FormError message={error} />

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-wine-700 hover:bg-wine-800 text-white rounded-xl font-semibold gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating administrator...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Create Admin Account
              </>
            )}
          </Button>

        </form>
      )}
    </AuthFrame>
  )
}
