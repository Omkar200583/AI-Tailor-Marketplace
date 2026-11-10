import { redirectIfSignedIn } from '@/lib/guards'
import { UserRegister } from '@/components/user/auth/user-register'

export default async function UserRegisterPage() {
  await redirectIfSignedIn()
  return <UserRegister />
}
