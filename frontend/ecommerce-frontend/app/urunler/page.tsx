'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Grid, List, Filter, ChevronDown, Search, X, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ProductCard from '@/app/components/ProductCard'
import { useProducts, useCategories } from '@/lib/hooks/useProducts'
import { ProductFilters, Product, Category } from '@/lib/api/types'
import { useAuthStore } from '@/lib/store/authStore'

const SORT_OPTIONS = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'popular', label: 'En Popüler' },
  { value: 'price_asc', label: 'Fiyat (Düşük → Yüksek)' },
  { value: 'price_desc', label: 'Fiyat (Yüksek → Düşük)' },
  { value: 'rating', label: 'En Çok Beğenilen' },
]

// Not using static brand list anymore; brands are fetched dynamically from API

function UrunlerPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  // Filters from URL
  const [filters, setFilters] = useState<ProductFilters>({
    page: parseInt(searchParams.get('page') || '1'),
    limit: 24,
    sort: (searchParams.get('sort') as any) || 'newest',
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
    search: searchParams.get('q') || undefined,
    inStock: searchParams.get('inStock') === 'true' || undefined,
  })

  // Price range state - using controlled inputs like CategoryPageClient
  const [minPriceInput, setMinPriceInput] = useState<string>('')
  const [maxPriceInput, setMaxPriceInput] = useState<string>('')

  // Selected brands state
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    filters.brand ? [filters.brand] : []
  )

  // Data fetching
  const { data: productsData, isLoading, error } = useProducts(filters)
  const { data: categoriesData } = useCategories()
  const brandsList: string[] = (productsData?.data?.filters?.brands || []) as string[]
  const { user } = useAuthStore()

  // Initialize price inputs from URL only on mount
  useEffect(() => {
    const searchFromUrl = searchParams.get('q')
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl)
    }
    
    const minPriceFromUrl = searchParams.get('minPrice')
    const maxPriceFromUrl = searchParams.get('maxPrice')
    
    if (minPriceFromUrl) {
      setMinPriceInput(minPriceFromUrl)
    }
    if (maxPriceFromUrl) {
      setMaxPriceInput(maxPriceFromUrl)
    }
  }, []) // Only run once on mount

  // Update URL when filters change (searchQuery removed from dependencies)
  useEffect(() => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString())
      }
    })

    router.push(`/urunler?${params.toString()}`, { scroll: false })
  }, [filters, router]) // searchQuery removed from dependencies

  // Update filters
  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 24,
      sort: 'newest'
    })
    setSearchQuery('')
    setMinPriceInput('')
    setMaxPriceInput('')
    setSelectedBrands([])
    
    // URL'yi temizle
    router.push('/urunler', { scroll: false })
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const searchValue = formData.get('search-input') as string
    const trimmedValue = searchValue?.trim()
    
    if (trimmedValue) {
      updateFilters({ search: trimmedValue })
    } else {
      updateFilters({ search: undefined })
    }
  }

  // Handle price range change
  const handlePriceRangeApply = () => {
    const minPrice = minPriceInput ? parseInt(minPriceInput) : undefined
    const maxPrice = maxPriceInput ? parseInt(maxPriceInput) : undefined
    
    // Validasyon
    if (minPrice && maxPrice && minPrice > maxPrice) {
      alert('Minimum fiyat maksimum fiyattan büyük olamaz!')
      return
    }
    
    updateFilters({
      minPrice: minPrice && minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice && maxPrice > 0 ? maxPrice : undefined
    })
  }

  // Handle brand toggle
  const handleBrandToggle = (brand: string) => {
    const newBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand]
    
    setSelectedBrands(newBrands)
    updateFilters({ brand: newBrands.length > 0 ? newBrands[0] : undefined })
  }

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.category) count++
    if (filters.brand) count++
    if (filters.minPrice || filters.maxPrice) count++
    if (filters.search) count++
    if (filters.inStock) count++
    return count
  }

  // Filter sidebar content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label htmlFor="search-input" className="text-sm font-medium mb-2 block">Ürün Ara</Label>
        <form onSubmit={handleSearch} className="flex space-x-2">
          <label htmlFor="search-input" className="sr-only">Ürün ara</label>
          <input
            id="search-input"
            name="search-input"
            type="text"
            placeholder="Ürün adı, marka..."
            defaultValue={filters.search || ''}
            autoComplete="off"
            aria-label="Ürün ara"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button type="submit" size="sm">
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Categories */}
      {categoriesData?.data?.categories && (
      <div>
          <h3 className="text-sm font-medium mb-3">Kategoriler</h3>
          <div className="space-y-2">
            <button
              onClick={() => updateFilters({ category: undefined })}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                !filters.category 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Tümü ({productsData?.data?.pagination?.total || 0})
            </button>
            {categoriesData.data.categories?.map((category: Category) => (
              <button
                key={category.id}
                onClick={() => updateFilters({ category: category.slug })}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  filters.category === category.slug 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {category.name} ({category.productCount})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-medium mb-3">Fiyat Aralığı</h3>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1">
              <label htmlFor="minPrice" className="sr-only">Minimum Fiyat</label>
              <input
                id="minPrice"
                name="minPrice"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Min"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value.replace(/[^0-9]/g, ''))}
                min="0"
                autoComplete="off"
                aria-label="Minimum fiyat"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="maxPrice" className="sr-only">Maksimum Fiyat</label>
              <input
                id="maxPrice"
                name="maxPrice"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Max"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value.replace(/[^0-9]/g, ''))}
                min="0"
                autoComplete="off"
                aria-label="Maksimum fiyat"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          <Button 
            onClick={handlePriceRangeApply} 
            size="sm" 
            className="w-full"
            variant="outline"
          >
            Uygula
          </Button>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-sm font-medium mb-3">Markalar</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brandsList.map((brand, index) => {
            const safeId = `brand-${brand.toLowerCase().replace(/[^a-z0-9_-]/gi, '-')}-${index}`
            return (
              <div key={safeId} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={safeId}
                  name={safeId}
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                />
                <Label htmlFor={safeId} className="text-sm cursor-pointer">
                  {brand}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stock Filter */}
      <div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="inStock"
            checked={filters.inStock || false}
            onCheckedChange={(checked) => {
              const isChecked = checked === true
              updateFilters({ inStock: isChecked ? true : undefined })
            }}
          />
          <Label htmlFor="inStock" className="text-sm cursor-pointer">
            Sadece stokta olanlar
          </Label>
        </div>
      </div>

      {/* Clear Filters */}
      {getActiveFiltersCount() > 0 && (
        <Button
          onClick={clearFilters}
          variant="outline"
          className="w-full"
        >
          Filtreleri Temizle
        </Button>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-8">
            <h2 className="text-lg font-semibold mb-6">Filtreler</h2>
            <FilterContent />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Ürünler</h1>
            <p className="text-gray-600">
              Elektronik ve robotik projeleriniz için ihtiyacınız olan tüm ürünler
            </p>
          </div>

          {/* Mobile Filters & Controls */}
          <div className="lg:hidden mb-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtreler ({getActiveFiltersCount()})
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtreler</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* Mobile Filters Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filtreler
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filtreler</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                {isLoading ? (
                  <Skeleton className="w-20 h-4" />
                ) : (
                  <span>
                    {productsData?.data?.pagination?.total || 0} ürün bulundu
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Sort */}
              <Select
                value={filters.sort}
                onValueChange={(value) => updateFilters({ sort: value as any })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {getActiveFiltersCount() > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Arama: "{filters.search}"
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => updateFilters({ search: undefined })}
                  />
                  </Badge>
                )}
              {filters.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Kategori: {filters.category}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => updateFilters({ category: undefined })}
                  />
                  </Badge>
                )}
              {filters.brand && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Marka: {filters.brand}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => updateFilters({ brand: undefined })}
                  />
                  </Badge>
                )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Fiyat: {filters.minPrice || 0}₺ - {filters.maxPrice || 10000}₺
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => updateFilters({ minPrice: undefined, maxPrice: undefined })}
                  />
                  </Badge>
                )}
            </div>
          )}

          {/* Products Grid/List */}
          {isLoading ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {Array.from({ length: 12 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <Skeleton className="aspect-square mb-4" />
                    <Skeleton className="h-4 mb-2" />
                    <Skeleton className="h-4 mb-2 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Ürünler yüklenirken hata oluştu</p>
              <Button onClick={() => window.location.reload()}>
                Tekrar Dene
              </Button>
            </div>
          ) : !productsData?.data?.products?.length ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Aradığınız kriterlere uygun ürün bulunamadı</p>
              <Button onClick={clearFilters} variant="outline">
                Filtreleri Temizle
              </Button>
            </div>
          ) : (
            <>
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {productsData?.data?.products?.map((product: Product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant={viewMode}
                    showQuickView={true}
                    isFavorite={
                      !!(user?.favorites && user.favorites.some((fav: any) => fav.id === product.id))
                    }
                  />
                ))}
              </div>

          {/* Pagination */}
              {productsData?.data?.pagination?.totalPages > 1 && (
                <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                      disabled={filters.page === 1}
                      onClick={() => updateFilters({ page: (filters.page || 1) - 1 })}
                >
                  Önceki
                </Button>

                    {Array.from({ length: Math.min(5, productsData?.data?.pagination?.totalPages || 1) }).map((_, index) => {
                      const page = index + 1
                      return (
                        <Button
                          key={page}
                          variant={filters.page === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateFilters({ page })}
                        >
                          {page}
                        </Button>
                      )
                    })}

                    <Button
                      variant="outline"
                      disabled={filters.page === (productsData?.data?.pagination?.totalPages || 1)}
                      onClick={() => updateFilters({ page: (filters.page || 1) + 1 })}
                    >
                      Sonraki
                    </Button>
              </div>
            </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UrunlerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <UrunlerPageContent />
    </Suspense>
  )
}