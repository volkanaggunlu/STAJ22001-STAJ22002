'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight, ChevronLeft, ListFilter } from 'lucide-react'
import ProductCard from '@/app/components/ProductCard'
import { useProductsByCategory } from '@/lib/hooks/useProducts'
import type { ProductFilters } from '@/lib/api/types'
import { apiClient } from '@/lib/api/client'
import { categoriesApi } from '@/lib/api/services/categories'
import { useUserFavorites } from '@/hooks/useUserFavorites'
import { AuthStorage } from '@/lib/api/client'

interface Props {
	slug: string
	initial: {
		page: number
		limit: number
		sort: string
		inStock: boolean
		minPrice: string
		maxPrice: string
	}
}

interface CategoryInfo {
	name: string
	slug: string
	description?: string
	image?: { url?: string; alt?: string }
	stats?: { productCount?: number }
}

export default function CategoryPageClient({ slug, initial }: Props) {
	const router = useRouter()
	const [page, setPage] = useState<number>(initial.page)
	const [limit, setLimit] = useState<number>(initial.limit)
	const [sort, setSort] = useState<ProductFilters['sort']>(initial.sort as ProductFilters['sort'])
	const [inStockOnly, setInStockOnly] = useState<boolean>(initial.inStock)
	const [minPrice, setMinPrice] = useState<string>(initial.minPrice)
	const [maxPrice, setMaxPrice] = useState<string>(initial.maxPrice)

	const { data, isLoading, refetch } = useProductsByCategory(slug, {
		page,
		limit,
		sort,
		inStock: inStockOnly,
		minPrice: minPrice ? Number(minPrice) : undefined,
		maxPrice: maxPrice ? Number(maxPrice) : undefined,
	})

	const [categoryInfo, setCategoryInfo] = useState<CategoryInfo | null>(null)
	const [allCategories, setAllCategories] = useState<Array<{ slug: string; name: string; level: number; label: string; count?: number }>>([])
	const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(slug)
	const [categorySearch, setCategorySearch] = useState<string>('')

	// Persisted favorites: ensure hearts remain filled after reload
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
	useEffect(() => {
		setIsAuthenticated(Boolean(AuthStorage.getToken()))
	}, [])
	const { favorites: userFavorites } = useUserFavorites(isAuthenticated)
	const favoriteIdSet = new Set((userFavorites || []).map((p: any) => p._id || p.id || p.productId))
	const favoriteSlugSet = new Set((userFavorites || []).map((p: any) => p.slug))

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const res = await apiClient.get(`/categories/slug/${slug}`)
				const cat = res.data?.data?.category || res.data?.category || null
				if (mounted) setCategoryInfo(cat)
			} catch (e) {
				if (mounted) setCategoryInfo(null)
			}
		})()
		return () => { mounted = false }
	}, [slug])

	useEffect(() => {
		let mounted = true
		;(async () => {
			try {
				const response = await categoriesApi.getCategoryTree()
				const categories = response?.data?.categories || []
				const flatten = (cats: any[], level = 0, parentPath = ''): Array<{ slug: string; name: string; level: number; label: string; count?: number }> => {
					const result: Array<{ slug: string; name: string; level: number; label: string; count?: number }> = []
					cats.forEach((c: any) => {
						const label = level === 0 ? c.name : `${parentPath ? parentPath + ' → ' : ''}${c.name}`
						result.push({ slug: c.slug, name: c.name, level, label, count: c?.stats?.productCount ?? c?.productCount })
						if (Array.isArray(c.children) && c.children.length > 0) {
							result.push(...flatten(c.children, level + 1, label))
						}
					})
					return result
				}
				if (mounted) setAllCategories(flatten(categories))
			} catch (e) {
				if (mounted) setAllCategories([])
			}
		})()
		return () => { mounted = false }
	}, [slug])

	useEffect(() => {
		setSelectedCategorySlug(slug)
		setPage(1)
	}, [slug])

	const handleChangeCategory = (newSlug: string) => {
		setSelectedCategorySlug(newSlug)
		// Filtreleri mümkün olduğunca koruyarak yeni kategoriye git
		const sp = new URLSearchParams()
		sp.set('page', '1')
		sp.set('limit', String(limit))
		sp.set('sort', (sort ?? 'newest'))
		if (inStockOnly) sp.set('inStock', 'true')
		if (minPrice) sp.set('minPrice', minPrice)
		if (maxPrice) sp.set('maxPrice', maxPrice)
		router.push(`/kategori/${newSlug}?${sp.toString()}`)
		router.refresh()
	}

	const apiData = (data as any)?.data || data
	const products = apiData?.products || []
	const pagination = apiData?.pagination || { total: 0, totalPages: 0, page, limit }

	const filteredCategories = allCategories.filter(c =>
		!categorySearch.trim() || c.name.toLowerCase().includes(categorySearch.trim().toLowerCase())
	)

	const handleApplyFilters = () => {
		setPage(1)
		const sp = new URLSearchParams()
		sp.set('page', '1')
		sp.set('limit', String(limit))
		sp.set('sort', (sort ?? 'newest'))
		if (inStockOnly) sp.set('inStock', 'true')
		if (minPrice) sp.set('minPrice', minPrice)
		if (maxPrice) sp.set('maxPrice', maxPrice)
		router.push(`/kategori/${slug}?${sp.toString()}`)
		router.refresh()
		refetch()
	}

	return (
		<div className="min-h-screen">
			<section className="relative h-[220px] md:h-[280px] w-full overflow-hidden">
				{categoryInfo?.image?.url ? (
					<Image src={categoryInfo.image.url} alt={categoryInfo.image.alt || categoryInfo.name} fill className="object-cover" />
				) : (
					<div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-primary/5" />
				)}
				<div className="absolute inset-0 bg-black/40" />
				<div className="absolute inset-0 flex items-center">
					<div className="container mx-auto px-4">
						<div className="text-white space-y-2">
							<div className="text-sm text-white/80 flex items-center gap-2">
								<Link href="/">Ana Sayfa</Link>
								<ChevronRight className="h-4 w-4" />
								<span>Kategori</span>
								<ChevronRight className="h-4 w-4" />
								<strong className="truncate">{categoryInfo?.name || slug}</strong>
							</div>
							<h1 className="text-2xl md:text-4xl font-bold">{categoryInfo?.name ?? slug}</h1>
							{categoryInfo?.description && (
								<p className="text-white/80 max-w-2xl">{categoryInfo.description}</p>
							)}
						</div>
					</div>
				</div>
			</section>

			<section className="py-10">
				<div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
					<aside className="lg:col-span-3 space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2"><ListFilter className="h-5 w-5" /> Filtreler</CardTitle>
								<CardDescription>Aramanızı daraltın</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Categories list */}
								<div className="space-y-2">
									<label className="text-sm font-medium">Kategoriler</label>
									<Input
										placeholder="Kategori ara..."
										value={categorySearch}
										onChange={(e) => setCategorySearch(e.target.value)}
									/>
									<div className="max-h-60 overflow-auto space-y-1 rounded-md border p-1">
										{filteredCategories.map((c) => {
											const selected = selectedCategorySlug === c.slug
											return (
												<button
													key={c.slug}
													onClick={() => handleChangeCategory(c.slug)}
													type="button"
													className={`w-full flex items-center justify-between gap-2 rounded-md px-2 py-2 text-left transition ${selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
												>
													<span className="flex-1 truncate" style={{ paddingLeft: `${c.level * 10}px` }}>
														{c.level > 0 ? '└ ' : ''}{c.name}
													</span>
													{typeof c.count === 'number' && (
														<Badge variant={selected ? 'default' : 'secondary'}>{c.count}</Badge>
													)}
												</button>
											)
										})}
										{filteredCategories.length === 0 && (
											<div className="text-xs text-muted-foreground px-2 py-3">Eşleşen kategori yok</div>
										)}
									</div>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Sıralama</label>
									<Select value={sort ?? 'newest'} onValueChange={(v) => setSort(v as ProductFilters['sort'])}>
										<SelectTrigger>
											<SelectValue placeholder="Sırala" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="newest">En Yeni</SelectItem>
											<SelectItem value="price_asc">Fiyat Artan</SelectItem>
											<SelectItem value="price_desc">Fiyat Azalan</SelectItem>
											<SelectItem value="popular">Popüler</SelectItem>
											<SelectItem value="rating">En Çok Beğenilen</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium">Fiyat Aralığı</label>
									<div className="flex gap-2">
										<Input placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
										<Input placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
									</div>
								</div>

								<div className="flex items-center gap-2">
									<Checkbox id="inStock" checked={inStockOnly} onCheckedChange={(v) => setInStockOnly(Boolean(v))} />
									<label htmlFor="inStock" className="text-sm">Stoktakiler</label>
								</div>

								<div className="flex items-center gap-2">
									<Button className="flex-1" onClick={handleApplyFilters}>Uygula</Button>
									<Button variant="outline" onClick={() => { setMinPrice(''); setMaxPrice(''); setInStockOnly(false); setSort('newest'); setPage(1); router.push(`/kategori/${slug}`); refetch(); }}>Temizle</Button>
								</div>
							</CardContent>
						</Card>
					</aside>

					<div className="lg:col-span-9 space-y-4">
						<div className="flex items-center justify-between">
							<p className="text-sm text-muted-foreground">Toplam {pagination.total} ürün</p>
							<div className="flex items-center gap-2">
								<Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
									<SelectTrigger className="w-28"><SelectValue placeholder="Sayfa boyutu" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="12">12</SelectItem>
										<SelectItem value="24">24</SelectItem>
										<SelectItem value="48">48</SelectItem>
									</SelectContent>
								</Select>
								<Button variant="outline" size="sm" onClick={() => refetch()}>Yenile</Button>
							</div>
						</div>

						{isLoading ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
								{Array.from({ length: 9 }).map((_, i) => (
									<Card key={i}><CardContent className="p-0"><Skeleton className="aspect-square" /><div className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-6 w-1/3" /></div></CardContent></Card>
								))}
							</div>
						) : products.length ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
								{products.map((product: any) => {
									const isFav = favoriteIdSet.has(product.id || product._id) || favoriteSlugSet.has(product.slug)
									return (
										<ProductCard key={product.id || product._id} product={product} variant="grid" showQuickView={true} isFavorite={isFav} />
									)
								})}
							</div>
						) : (
							<Card>
								<CardContent className="py-16 text-center text-muted-foreground">Bu kategoride ürün bulunamadı.</CardContent>
							</Card>
						)}

						{pagination.totalPages > 1 && (
							<div className="flex items-center justify-between pt-4">
								<Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4 mr-1" /> Önceki</Button>
								<div className="text-sm text-muted-foreground">Sayfa {pagination.page}/{pagination.totalPages}</div>
								<Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}>Sonraki <ChevronRight className="h-4 w-4 ml-1" /></Button>
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	)
} 