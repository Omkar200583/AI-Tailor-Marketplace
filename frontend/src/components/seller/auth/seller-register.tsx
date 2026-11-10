'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Lock, Mail, Phone, Scissors, Store, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthFrame } from '@/components/shared/auth/auth-frame'
import { FormError, PasswordField, TextField } from '@/components/shared/auth/fields'
import { validateEmail, validateName, validateNewPassword, validateOptionalPhone } from '@/components/shared/auth/validation'
import { useAuthFlow } from '@/components/shared/auth/use-auth-flow'

export function SellerRegister() {
  const { register, loading, error, setError } = useAuthFlow('seller')
  const [f, setF] = useState({ name: '', shopName: '', email: '', phone: '', city: 'Pune', password: '' })
  const [touched, setTouched] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => { setF({ ...f, [k]: e.target.value }); setError(null) }

  const errs = {
    name: touched ? validateName(f.name) : null,
    shopName: touched && f.shopName.trim().length < 2 ? 'Enter your shop name' : null,
    email: touched ? validateEmail(f.email) : null,
    phone: touched ? validateOptionalPhone(f.phone) : null,
    password: touched ? validateNewPassword(f.password) : null,
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (validateName(f.name) || f.shopName.trim().length < 2 || validateEmail(f.email) || validateOptionalPhone(f.phone) || validateNewPassword(f.password)) return
    await register({ name: f.name, email: f.email, password: f.password, phone: f.phone || undefined, role: 'SELLER', shopName: f.shopName.trim(), city: f.city.trim() || 'Pune' })
  }

  return (
    <AuthFrame
      themeClass="theme-seller"
      icon={Scissors}
      brandLine="Seller studio"
      headline="List your shop. Get orders."
      points={['Free to join — commission only on completed orders', 'Verified shops rank higher in nearby search', 'Your shop profile is ready in minutes']}
      title="Register your shop"
      subtitle="Create a seller account. An admin reviews every new shop."
      footer={<>Already a seller? <Link href="/seller/login" className="font-semibold text-wine-700 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormError message={error} />
        <TextField label="Your name" icon={User} autoComplete="name" placeholder="Sai Deshmukh" value={f.name} error={errs.name} onChange={set('name')} />
        <TextField label="Shop name" icon={Store} placeholder="Sai Fashion Tailors" value={f.shopName} error={errs.shopName} onChange={set('shopName')} />
        <TextField label="Email" type="email" icon={Mail} autoComplete="email" placeholder="shop@example.com" value={f.email} error={errs.email} onChange={set('email')} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Phone" type="tel" icon={Phone} autoComplete="tel" placeholder="98765 43210" value={f.phone} error={errs.phone} onChange={set('phone')} />
          <TextField label="City" autoComplete="address-level2" value={f.city} onChange={set('city')} />
        </div>
        <PasswordField label="Password" icon={Lock} autoComplete="new-password" placeholder="Minimum 6 characters" value={f.password} error={errs.password} onChange={set('password')} />
        <Button type="submit" disabled={loading} className="w-full h-11 bg-wine-700 hover:bg-wine-800 text-white rounded-xl font-semibold gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating shop…</> : 'Create seller account'}
        </Button>
      </form>
    </AuthFrame>
  )
}
