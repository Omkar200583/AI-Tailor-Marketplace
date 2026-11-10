'use client'

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

import { AuthFrame } from '@/components/shared/auth/auth-frame'
import { LoginForm } from '@/components/shared/auth/login-form'

export function AdminLogin() {
  return (
    <AuthFrame
      themeClass="theme-admin"
      icon={ShieldCheck}
      brandLine="Admin console"
      headline="Platform administration"
      points={[
        'Verify and approve tailor shops',
        'Monitor users, orders and commission',
        'Keep an eye on AI usage across the platform',
      ]}
      title="Administrator sign in"
      subtitle="Authorized personnel only."
      footer={
        <div className="space-y-3">
          <p className="text-xs">
            Secure access for authorized administrators.
          </p>

          <Link
            href="/admin/register"
            className="font-semibold text-wine-700 hover:text-wine-900"
          >
            Register a new administrator
          </Link>
        </div>
      }
    >
      <LoginForm
        portal="admin"
        submitLabel="Sign in to console"
      />
    </AuthFrame>
  )
}
