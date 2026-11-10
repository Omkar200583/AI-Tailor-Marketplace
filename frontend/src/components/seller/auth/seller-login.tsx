'use client'

import Link from 'next/link'
import { Scissors } from 'lucide-react'
import { AuthFrame } from '@/components/shared/auth/auth-frame'
import { LoginForm } from '@/components/shared/auth/login-form'

export function SellerLogin() {
  return (
    <AuthFrame
      themeClass="theme-seller"
      icon={Scissors}
      brandLine="Seller studio"
      headline="Run your tailoring business on AI Tailor."
      points={['Receive custom order requests from customers nearby', 'Set your own prices and accept only what fits your workload', 'Track earnings, reviews and your verification status']}
      title="Seller sign in"
      subtitle="Access your shop dashboard, orders and earnings."
      footer={
        <div className="space-y-2">
          <div>New tailor? <Link href="/seller/register" className="font-semibold text-wine-700 hover:underline">Register your shop</Link></div>
          <div className="text-xs">Looking to buy? <Link href="/login" className="font-semibold text-wine-700 hover:underline">Customer login</Link></div>
        </div>
      }
    >
      <LoginForm portal="seller" demo={{ label: 'Use demo tailor account', email: 'seller@aitailor.in', password: 'seller123' }} submitLabel="Sign in to my shop" />
    </AuthFrame>
  )
}
