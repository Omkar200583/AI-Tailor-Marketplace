import type { Metadata } from 'next'
import { TestimonialsPage } from './testimonials-content'

// ═══════════════ SEO Metadata ═══════════════
export const metadata: Metadata = {
  title: 'Testimonials — Real Customer Stories | AI Tailor Marketplace',
  description:
    'Read authentic reviews from verified customers of AI Tailor Marketplace. Discover real stories of custom-tailored outfits, AI design experiences, and perfect fits. Share your own experience!',
  keywords: [
    'AI Tailor testimonials',
    'custom tailoring reviews',
    'customer stories',
    'verified reviews',
    'fashion marketplace reviews',
    'tailor shop reviews India',
  ],
  openGraph: {
    title: 'Real Stories. Real Experiences. | AI Tailor Marketplace',
    description:
      'Discover what our customers say about their AI Tailor experience — from the first design to the final stitch.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'AI Tailor Marketplace',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Testimonials — AI Tailor Marketplace',
    description: 'Real customer stories from the AI Tailor Marketplace.',
  },
  alternates: {
    canonical: '/testimonials',
  },
}

export default function Page() {
  return <TestimonialsPage />
}
