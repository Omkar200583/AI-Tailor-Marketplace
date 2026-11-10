'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { AuthFrame } from '@/components/shared/auth/auth-frame'
import { LoginForm } from '@/components/shared/auth/login-form'

export function UserLogin({ next }: { next?: string | null }) {
  return (
    <AuthFrame
      icon={ShoppingBag}
      brandLine="Stitch your imagination"
      headline="Design with words. Wear it made-to-measure."
      points={['Generate outfit designs with AI and try them on virtually', 'Order from verified local tailors near you', 'Save your measurements once — perfect fit every time']}
      title="Welcome back"
      subtitle="Sign in to your customer account."
      footer={
        <div className="space-y-2">
          <div>New here? <Link href="/register" className="font-semibold text-wine-700 hover:underline">Create an account</Link></div>
          <div className="text-xs">Are you a tailor? <Link href="/seller/login" className="font-semibold text-wine-700 hover:underline">Seller login</Link></div>
        </div>
      }
    >
      <LoginForm portal="user" next={next} demo={{ label: 'Use demo customer account', email: 'customer@aitailor.in', password: 'customer123' }} />
    </AuthFrame>
  )
}
