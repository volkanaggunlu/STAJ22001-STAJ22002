import CategoryPageClient from './CategoryPageClient'

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const sp = await searchParams

  const initial = {
    page: Number(sp.page || 1),
    limit: Number(sp.limit || 12),
    sort: String(sp.sort || 'newest'),
    inStock: String(sp.inStock || 'false') === 'true',
    minPrice: String(sp.minPrice || ''),
    maxPrice: String(sp.maxPrice || ''),
  }

  return (
    <CategoryPageClient
      key={slug}
      slug={slug}
      initial={initial}
    />
  )
} 