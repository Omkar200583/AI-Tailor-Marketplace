import { redirectIfSignedIn } from '@/lib/guards'
import { SellerRegister } from '@/components/seller/auth/seller-register'

export default async function SellerRegisterPage() {
  await redirectIfSignedIn()
  return <SellerRegister />
}
