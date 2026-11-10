import { ExploreView } from '@/components/marketplace/explore-view'

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category, q } = await searchParams
  return <ExploreView key={`${category || 'all'}-${q || ''}`} initialCategory={category} initialQuery={q} />
}
