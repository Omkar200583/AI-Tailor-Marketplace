import { requirePortalUser } from '@/lib/guards'
import { SellerShell } from '@/components/seller/layout/seller-shell'

// Server-side gate: guests → /seller/login, customers/admins → their own dashboard.
export default async function SellerPortalLayout({ children }: { children: React.ReactNode }) {
  await requirePortalUser('seller')
  return <SellerShell>{children}</SellerShell>
}
