import { redirectIfSignedIn } from '@/lib/guards'
import { AdminLogin } from '@/components/admin/auth/admin-login'

export default async function AdminLoginPage() {
  await redirectIfSignedIn()
  return <AdminLogin />
}
