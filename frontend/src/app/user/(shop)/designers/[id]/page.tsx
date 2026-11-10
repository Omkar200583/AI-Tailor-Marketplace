import { DesignerProfileView } from '@/components/marketplace/designers'

export default async function DesignerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DesignerProfileView designerId={id} />
}
