import { redirectIfSignedIn } from '@/lib/guards'
import { SellerLogin } from '@/components/seller/auth/seller-login'

export default async function SellerLoginPage() {
  await redirectIfSignedIn()
  return <SellerLogin />
}
