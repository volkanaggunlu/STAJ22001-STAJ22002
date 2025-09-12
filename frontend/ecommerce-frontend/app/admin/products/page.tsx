'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Download,
  Upload,
  CheckSquare,
  Square,
  Minus,
  RefreshCw,
  SortAsc,
  SortDesc,
  SearchCheck
} from 'lucide-react'
import { useAdminProducts, useDeleteProduct, useUpdateProductStatus, useBulkProductActions } from '@/lib/hooks/useAdminProducts'
import { adminApi } from '@/lib/api/services/admin'
import { useQuery } from '@tanstack/react-query'
import { formatPrice } from '@/lib/utils/format'

// Types
interface Product {
  [key: string]: any  // Basit çözüm - API response yapısı tam belli olmadığı için
}

interface FilterState {
  search: string
  category: string
  status: string
  type: string
}

export default function AdminProductsPage() {
  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  // Filter states - temp values for form
  const [tempFilters, setTempFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    status: 'all',
    type: 'all'
  })

  // Applied filters - actual values sent to API
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    status: 'all',
    type: 'all'
  })

  const pageSize = 20

  // API Calls
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useAdminProducts({
    page: currentPage,
    limit: pageSize,
    search: appliedFilters.search || undefined,
    category: appliedFilters.category && appliedFilters.category !== 'all' ? appliedFilters.category : undefined,
    status: appliedFilters.status && appliedFilters.status !== 'all' ? appliedFilters.status : undefined,
    type: appliedFilters.type && appliedFilters.type !== 'all' ? appliedFilters.type : undefined,
    sortBy,
    sortOrder
  })

  // Categories API call
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const deleteProductMutation = useDeleteProduct()
  const updateStatusMutation = useUpdateProductStatus()
  const bulkActionsMutation = useBulkProductActions()

  // Data
  const products = data?.products || []
  const pagination = data?.pagination || { 
    total: 0, 
    totalPages: 0, 
    page: currentPage, 
    limit: pageSize 
  }
  const categories = categoriesData?.categories || []

  // Computed
  const allSelected = selectedProducts.length === products.length && products.length > 0
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < products.length
  const noneSelected = selectedProducts.length === 0

  // Check if filters have been applied
  const hasActiveFilters = appliedFilters.search || 
    (appliedFilters.category && appliedFilters.category !== 'all') || 
    (appliedFilters.status && appliedFilters.status !== 'all') ||
    (appliedFilters.type && appliedFilters.type !== 'all')

  // Check if temp filters are different from applied
  const hasUnappliedChanges = JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters)

  // Handlers
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map((p: Product) => p._id || p.id))
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleTempFilterChange = (field: keyof FilterState, value: string) => {
    setTempFilters(prev => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    setAppliedFilters({ ...tempFilters })
    setCurrentPage(1) // Reset to first page
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      category: 'all',
      status: 'all',
      type: 'all'
    }
    setTempFilters(clearedFilters)
    setAppliedFilters(clearedFilters)
    setCurrentPage(1)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProductMutation.mutateAsync(productId)
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleUpdateStatus = async (productId: string, status: 'active' | 'inactive' | 'discontinued') => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Frontend: Status değiştirme başlatılıyor:', { productId, status })
    }
    
    try {
      await updateStatusMutation.mutateAsync({ id: productId, status })
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Frontend: Status değiştirme tamamlandı')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Frontend: Status değiştirme hatası:', error)
      }
      // Error toast zaten hook içinde gösteriliyor
    }
  }

  const handleBulkAction = async (action: 'delete' | 'updateStatus', data?: any) => {
    if (selectedProducts.length === 0) return

    try {
      await bulkActionsMutation.mutateAsync({
        action,
        productIds: selectedProducts,
        data
      })
      setSelectedProducts([])
    } catch (error) {
      console.error('Bulk action error:', error)
    }
  }

  // Status badge helper
  const getStatusBadge = (product: Product) => {
    const status = product.status || 'active'
    const stock = product.stock?.quantity || 0
    const lowStockThreshold = product.stock?.lowStockThreshold || 10

    if (status === 'discontinued') {
      return <Badge variant="destructive">Üretim Durdu</Badge>
    }
    if (status === 'inactive') {
      return <Badge variant="secondary">Pasif</Badge>
    }
    if (stock <= 0) {
      return <Badge variant="destructive">Stokta Yok</Badge>
    }
    if (stock <= lowStockThreshold) {
      return <Badge variant="outline">Az Stok</Badge>
    }
    return <Badge variant="default">Aktif</Badge>
  }

  // Type badge helper
  const getTypeBadge = (product: Product) => {
    const type = product.type || 'product'
    if (type === 'bundle') {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Bundle</Badge>
    }
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Ürün</Badge>
  }

  // Sort icon helper
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-20" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Ürün Yönetimi</h1>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-2">Ürünler yüklenirken hata oluştu</p>
              <p className="text-sm text-muted-foreground mb-4">
                Lütfen tekrar deneyin veya sayfayı yenileyin
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tekrar Dene
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Ürün Yönetimi</h1>
          <p className="text-muted-foreground">
            Toplam {pagination.total} ürün • Sayfa {pagination.page}/{pagination.totalPages}
            {hasActiveFilters && ' • Filtreler uygulandı'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            İçe Aktar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ürün
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtreler ve Arama
          </CardTitle>
          <CardDescription>
            Ürünleri filtrelemek için aşağıdaki alanları kullanın
            {hasUnappliedChanges && (
              <span className="text-orange-600 ml-2">• Değişiklikler henüz uygulanmadı</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Ürün ara..."
                value={tempFilters.search}
                onChange={(e) => handleTempFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={tempFilters.category} onValueChange={(value) => handleTempFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                ) : (
                  categories.map((category: any) => (
                    <SelectItem key={category._id || category.id} value={category._id || category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={tempFilters.type} onValueChange={(value) => handleTempFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                <SelectItem value="product">Ürün</SelectItem>
                <SelectItem value="bundle">Bundle</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={tempFilters.status} onValueChange={(value) => handleTempFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
                <SelectItem value="discontinued">Üretim Durdu</SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button 
                onClick={applyFilters}
                disabled={!hasUnappliedChanges}
                className="flex-1"
              >
                <SearchCheck className="h-4 w-4 mr-2" />
                Uygula
              </Button>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                disabled={!hasActiveFilters && !hasUnappliedChanges}
              >
                Temizle
              </Button>
            </div>
          </div>
          
          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
              {appliedFilters.search && (
                <Badge variant="secondary" className="text-xs">
                  Arama: "{appliedFilters.search}"
                </Badge>
              )}
              {appliedFilters.category && appliedFilters.category !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Kategori: {categories.find((c: any) => (c._id || c.id) === appliedFilters.category)?.name || appliedFilters.category}
                </Badge>
              )}
              {appliedFilters.type && appliedFilters.type !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Tür: {appliedFilters.type === 'product' ? 'Ürün' : 'Bundle'}
                </Badge>
              )}
              {appliedFilters.status && appliedFilters.status !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Durum: {appliedFilters.status}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {selectedProducts.length} ürün seçildi
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Select onValueChange={(value) => handleBulkAction('updateStatus', { status: value })}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Durum değiştir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif Yap</SelectItem>
                    <SelectItem value="inactive">Pasif Yap</SelectItem>
                    <SelectItem value="discontinued">Üretimi Durdur</SelectItem>
                  </SelectContent>
                </Select>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Seçilenleri Sil
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ürünleri Sil</AlertDialogTitle>
                      <AlertDialogDescription>
                        {selectedProducts.length} ürünü silmek istediğinizden emin misiniz? 
                        Bu işlem geri alınamaz.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleBulkAction('delete')}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sil
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ürün Listesi</CardTitle>
          <CardDescription>
            Sayfa {pagination.page}/{pagination.totalPages} • 
            Toplam {pagination.total} ürün
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleSelectAll}
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : someSelected ? (
                      <Minus className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-20">Görsel</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1"
                  >
                    <span>Ürün Adı</span>
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Marka</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('price')}
                    className="flex items-center space-x-1"
                  >
                    <span>Fiyat</span>
                    {getSortIcon('price')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('stock.quantity')}
                    className="flex items-center space-x-1"
                  >
                    <span>Stok</span>
                    {getSortIcon('stock.quantity')}
                  </Button>
                </TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center space-x-1"
                  >
                    <span>Oluşturulma</span>
                    {getSortIcon('createdAt')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: Product) => (
                <TableRow key={product._id || product.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product._id || product.id)}
                      onCheckedChange={() => handleSelectProduct(product._id || product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-16 relative bg-muted rounded-md overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0].url || product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Eye className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {product.sku}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(product)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {product.category?.name || 'Kategori yok'}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.brand || '-'}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {formatPrice(product.price)}
                      </div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{product.stock?.quantity || 0}</div>
                      {product.stock?.quantity <= product.stock?.lowStockThreshold && (
                        <div className="text-xs text-orange-600">Az Stok</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(product)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(product.createdAt || product.publishedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Menüyü aç</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                        
                        <DropdownMenuItem asChild>
                          <Link href={`/urun/${product.slug}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            Görüntüle
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product._id || product.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onSelect={() => {
                            handleUpdateStatus(product._id || product.id, 
                              product.status === 'active' ? 'inactive' : 'active')
                          }}
                        >
                          {product.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{product.name}" ürününü silmek istediğinizden emin misiniz? 
                                Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteProduct(product._id || product.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Empty State */}
          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'Arama kriterlerinize uygun ürün bulunamadı.' 
                  : 'Henüz ürün eklenmemiş.'}
              </div>
              {!hasActiveFilters ? (
                <Button asChild>
                  <Link href="/admin/products/new">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Ürünü Ekle
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={clearFilters}>
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Toplam {pagination.total} ürün, {pageSize} ürün gösteriliyor
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  Önceki
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = Math.max(1, currentPage - 2) + i
                    if (page > pagination.totalPages) return null
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage >= pagination.totalPages}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 