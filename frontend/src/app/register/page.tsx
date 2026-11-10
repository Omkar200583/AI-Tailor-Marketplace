import { redirectIfSignedIn } from '@/lib/guards'
import { UserRegister } from '@/components/user/auth/user-register'

export default async function RegisterPage() {
  await redirectIfSignedIn()

  return <UserRegister />
}
