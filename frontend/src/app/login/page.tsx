import { redirectIfSignedIn } from '@/lib/guards'
import { UserLogin } from '@/components/user/auth/user-login'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  await redirectIfSignedIn()

  const { next } = await searchParams

  return <UserLogin next={next} />
}
