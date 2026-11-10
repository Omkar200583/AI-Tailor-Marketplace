import { TailorProfileView } from '@/components/marketplace/tailor-profile'

export default async function TailorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TailorProfileView tailorId={id} />
}
