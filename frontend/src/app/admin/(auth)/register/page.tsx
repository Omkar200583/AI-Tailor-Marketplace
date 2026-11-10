import { redirectIfSignedIn } from '@/lib/guards'
import { AdminRegister } from '@/components/admin/auth/admin-register'

export default async function AdminRegisterPage() {
  await redirectIfSignedIn()

  return <AdminRegister />
}
