'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { AIAssistant } from '@/components/ai/views'

// Immersive pages hide the footer (same behaviour as the old single-page app).
const IMMERSIVE = [/^\/user\/product\//, /^\/user\/tailors\/[^/]+/, /^\/user\/try-on/]

/** Public storefront chrome: customer navbar + footer + floating AI assistant. */
export function ShopFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const immersive = IMMERSIVE.some((r) => r.test(pathname))
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!immersive && <Footer />}
      <AIAssistant />
    </div>
  )
}
