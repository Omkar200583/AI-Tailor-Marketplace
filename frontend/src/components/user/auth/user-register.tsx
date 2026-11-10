'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Lock, Mail, Palette, Phone, ShoppingBag, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthFrame } from '@/components/shared/auth/auth-frame'
import { FormError, PasswordField, TextField } from '@/components/shared/auth/fields'
import { validateEmail, validateName, validateNewPassword, validateOptionalPhone } from '@/components/shared/auth/validation'
import { useAuthFlow } from '@/components/shared/auth/use-auth-flow'
import { cn } from '@/lib/utils'

const ROLES = [
  { role: 'CUSTOMER' as const, label: 'Customer', hint: 'Shop & order', icon: ShoppingBag },
  { role: 'DESIGNER' as const, label: 'Designer', hint: 'Showcase work', icon: Palette },
]

export function UserRegister() {
  const { register, loading, error, setError } = useAuthFlow('user')
  const [role, setRole] = useState<'CUSTOMER' | 'DESIGNER'>('CUSTOMER')
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' })
  const [touched, setTouched] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); setError(null) }

  const errs = {
    name: touched ? validateName(f.name) : null,
    email: touched ? validateEmail(f.email) : null,
    phone: touched ? validateOptionalPhone(f.phone) : null,
    password: touched ? validateNewPassword(f.password) : null,
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (validateName(f.name) || validateEmail(f.email) || validateOptionalPhone(f.phone) || validateNewPassword(f.password)) return
    await register({ name: f.name, email: f.email, password: f.password, phone: f.phone || undefined, role })
  }

  return (
    <AuthFrame
      icon={ShoppingBag}
      brandLine="Stitch your imagination"
      headline="Your wardrobe, designed by you."
      points={['Free to start — no card needed', 'AI Studio, virtual try-on and smart recommendations', 'Pay only after your tailor accepts the order']}
      title="Create your account"
      subtitle="Join as a customer or as a fashion designer."
      footer={<>Already registered? <Link href="/login" className="font-semibold text-wine-700 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormError message={error} />
        <fieldset>
          <legend className="text-sm font-medium mb-1.5">I am a</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {ROLES.map((r) => (
              <button key={r.role} type="button" onClick={() => setRole(r.role)} aria-pressed={role === r.role}
                className={cn('rounded-xl border-2 p-3 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring', role === r.role ? 'border-wine-700 bg-wine-50 shadow-md' : 'border-wine-100 bg-cream hover:border-wine-300')}>
                <r.icon className={cn('w-5 h-5 mx-auto', role === r.role ? 'text-wine-700' : 'text-muted-foreground')} />
                <div className="text-xs font-bold mt-1">{r.label}</div>
                <div className="text-[10px] text-muted-foreground">{r.hint}</div>
              </button>
            ))}
          </div>
        </fieldset>
        <TextField label="Full name" icon={User} autoComplete="name" placeholder="Priya Sharma" value={f.name} error={errs.name} onChange={set('name')} />
        <TextField label="Email" type="email" icon={Mail} autoComplete="email" placeholder="you@example.com" value={f.email} error={errs.email} onChange={set('email')} />
        <TextField label="Phone (optional)" type="tel" icon={Phone} autoComplete="tel" placeholder="98765 43210" value={f.phone} error={errs.phone} onChange={set('phone')} />
        <PasswordField label="Password" icon={Lock} autoComplete="new-password" placeholder="Minimum 6 characters" value={f.password} error={errs.password} onChange={set('password')} />
        <Button type="submit" disabled={loading} className="w-full h-11 bg-wine-700 hover:bg-wine-800 text-white rounded-xl font-semibold gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create account'}
        </Button>
      </form>
    </AuthFrame>
  )
}
