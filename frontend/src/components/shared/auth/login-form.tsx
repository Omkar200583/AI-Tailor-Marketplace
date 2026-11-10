'use client'

import { useState } from 'react'
import { Loader2, Lock, Mail, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormError, PasswordField, TextField } from './fields'
import { validateEmail, validateLoginPassword } from './validation'
import { useAuthFlow } from './use-auth-flow'
import type { PortalId } from '@/lib/portals'

export interface DemoAccount { label: string; email: string; password: string }

/** Shared email + password form. Each portal's login page wraps it with its own frame and copy. */
export function LoginForm({ portal, next, demo, submitLabel = 'Sign in' }: { portal: PortalId; next?: string | null; demo?: DemoAccount; submitLabel?: string }) {
  const { login, loading, error, setError } = useAuthFlow(portal, next)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)

  const emailErr = touched ? validateEmail(email) : null
  const pwErr = touched ? validateLoginPassword(password) : null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (validateEmail(email) || validateLoginPassword(password)) return
    await login(email, password)
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormError message={error} />
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" icon={Mail} placeholder="you@example.com" value={email} error={emailErr}
        onChange={(e) => { setEmail(e.target.value); setError(null) }} />
      <PasswordField label="Password" autoComplete="current-password" icon={Lock} placeholder="••••••••" value={password} error={pwErr}
        onChange={(e) => { setPassword(e.target.value); setError(null) }} />
      <Button type="submit" disabled={loading} className="w-full h-11 bg-wine-700 hover:bg-wine-800 text-white rounded-xl font-semibold gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : submitLabel}
      </Button>
      {demo && process.env.NEXT_PUBLIC_DEMO_LOGINS !== 'off' && (
        <button type="button" onClick={() => { setEmail(demo.email); setPassword(demo.password); setError(null) }}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-wine-700 hover:text-wine-900 border border-dashed border-wine-300 rounded-xl py-2.5 transition-colors">
          <Wand2 className="w-3.5 h-3.5" /> {demo.label}
        </button>
      )}
    </form>
  )
}
