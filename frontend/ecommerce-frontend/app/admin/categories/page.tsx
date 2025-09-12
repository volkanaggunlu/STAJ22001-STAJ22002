'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Settings,
  SearchCheck,
  RefreshCw,
  TreePine,
  Home,
  Layers,
  Tag
} from 'lucide-react'
import { Fragment } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'

import { 
  useAdminCategoryTree, 
  useDeleteCategory, 
  useUpdateCategoryStatus,
  useBulkCategoryActions
} from '@/lib/hooks/useAdminCategories'
import { Category } from '@/lib/api/types'
import { toast } from 'sonner'

interface CategoryTreeItem extends Category {
  children?: CategoryTreeItem[]
  expanded?: boolean
  // Frontend'te oluşturulan extra fields (API'den gelmiyor)
  parentName?: string  // Parent ObjectId'sinden category adı lookup yapılarak oluşturuluyor
  breadcrumb?: string[] // Hiyerarşik yapı için parent chain
}

interface CategoryRowProps {
  category: CategoryTreeItem
  level: number
  onToggleExpand: (categoryId: string) => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onToggleStatus: (category: Category) => void
  selectedCategories: string[]
  onToggleSelect: (categoryId: string) => void
}

interface FilterState {
  search: string
  status: string
  level: string
  parent: string
}

const CategoryRow = ({
  category,
  level,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleStatus,
  selectedCategories,
  onToggleSelect
}: CategoryRowProps) => {
  const hasChildren = category.children && category.children.length > 0
  const isSelected = selectedCategories.includes(category.id || '')
  
  // ID geçerliliği kontrolü
  const hasValidId = category.id && 
    !category.id.startsWith('temp-id-') && 
    /^[0-9a-fA-F]{24}$/.test(category.id)
  
  // Güvenli key generation
  const fragmentKey = category.id ? `category-${category.id}` : `category-${category.name || 'unnamed'}-${level}`
  
  // Tam hiyerarşik yol oluştur
  const getFullHierarchyPath = (cat: CategoryTreeItem): string => {
    const path: string[] = []
    
    // Parent chain'i oluştur
    if (cat.parent) {
      // Parent'ın da parent'ı olabilir, recursive olarak git
      const buildParentChain = (parent: Category): string[] => {
        const chain: string[] = []
        if (parent.parent) {
          chain.push(...buildParentChain(parent.parent))
        }
        chain.push(parent.name)
        return chain
      }
      path.push(...buildParentChain(cat.parent))
    }
    
    // En son bu kategorinin adını ekle
    path.push(cat.name)
    
    return path.join(' > ')
  }
  
  const hierarchyPath = getFullHierarchyPath(category)
  
  return (
    <Fragment key={fragmentKey}>
      <TableRow className="hover:bg-gray-50 group">
        {/* Selection */}
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => category.id && onToggleSelect(category.id)}
            disabled={!hasValidId}
          />
        </TableCell>

        {/* Kategori Adı ve Hiyerarşi */}
        <TableCell>
          <div className="space-y-1">
            {/* Ana kategori gösterimi */}
            <div 
              className="flex items-center gap-2" 
              style={{ paddingLeft: `${level * 20}px` }}
            >
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => category.id && onToggleExpand(category.id)}
                >
                  {category.expanded ? (
                    <ChevronRight className="h-4 w-4 rotate-90 transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform" />
                  )}
                </Button>
              ) : (
                <div className="w-6" />
              )}
              
              {/* Kategori ikonu */}
              {hasChildren ? (
                category.expanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-500" />
                )
              ) : (
                <Tag className="h-4 w-4 text-gray-400" />
              )}
              
              <div className="flex-1">
                {/* Tam hiyerarşik yol */}
                <div className="font-medium text-gray-900">
                  {hierarchyPath || 'İsimsiz Kategori'}
                </div>
                <div className="text-sm text-gray-500">/{category.slug || '—'}</div>
              </div>
            </div>
            
            {/* Level indicator - sadece visual reference için */}
            {level > 0 && (
              <div className="flex items-center text-xs text-gray-400 ml-8">
                <Badge variant="outline" className="text-xs">
                  Seviye {level + 1}
                </Badge>
              </div>
            )}
          </div>
        </TableCell>

        {/* Parent Kategori */}
        <TableCell>
          {category.parent && category.parent !== null ? (
            <Badge variant="outline" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              {category.parent.name}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <TreePine className="h-3 w-3 mr-1" />
              Ana Kategori
            </Badge>
          )}
        </TableCell>

        {/* Açıklama */}
        <TableCell className="max-w-[200px]">
          <p className="text-sm text-gray-600 truncate">
            {category.description || '—'}
          </p>
        </TableCell>

        {/* Ürün Sayısı */}
        <TableCell>
          <Badge variant="secondary" className="text-xs">
            {(category.stats?.productCount ?? category.productCount) || 0} ürün
          </Badge>
        </TableCell>

        {/* Resim */}
        <TableCell>
          {category.image?.url ? (
            <img 
              src={category.image.url} 
              alt={category.image.alt}
              className="w-10 h-10 rounded-lg object-cover border"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border">
              <ImageIcon className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </TableCell>

        {/* Level */}
        <TableCell>
          <Badge variant="outline" className="text-xs">
            L{category.level || level}
          </Badge>
        </TableCell>

        {/* Durum */}
        <TableCell>
          <Badge variant={category.isActive ? 'default' : 'secondary'} className="text-xs">
            {category.isActive ? 'Aktif' : 'Pasif'}
          </Badge>
        </TableCell>

        {/* İşlemler */}
        <TableCell>
          {!hasValidId && (
            <Badge variant="destructive" className="text-xs mb-2">
              Geçersiz ID
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0"
                disabled={!hasValidId}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => onEdit(category)}
                disabled={!hasValidId}
              >
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onToggleStatus(category)}
                disabled={!hasValidId}
              >
                {category.isActive ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Deaktifleştir
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Aktifleştir
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(category)}
                className="text-red-600"
                disabled={!hasValidId}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Alt kategoriler */}
      {hasChildren && category.expanded && category.children?.map((child, childIndex) => {
        // Child kategoriler için güvenli key - parent ID + child ID + index
        const childKey = child.id 
          ? `child-${category.id}-${child.id}-${childIndex}` 
          : `child-${category.id || category.name}-${childIndex}-fallback`
        
        return (
          <CategoryRow
            key={childKey}
            category={child}
            level={level + 1}
            onToggleExpand={onToggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            selectedCategories={selectedCategories}
            onToggleSelect={onToggleSelect}
          />
        )
      })}
    </Fragment>
  )
}

export default function CategoriesPage() {
  // State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Filter states - temp values for form
  const [tempFilters, setTempFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    level: 'all',
    parent: 'all'
  })

  // Applied filters - actual values used for filtering
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    level: 'all',
    parent: 'all'
  })

  // API Hooks
  const { data: categoriesData, isLoading, error, refetch } = useAdminCategoryTree()
  const deleteCategory = useDeleteCategory()
  const updateCategoryStatus = useUpdateCategoryStatus()
  const bulkCategoryActions = useBulkCategoryActions()

  // Debug API data
  if (process.env.NODE_ENV === 'development' && categoriesData) {
    console.log('🔍 Categories API Data:', categoriesData)
    console.log('📊 Categories structure:', categoriesData.categories)
  }

  // Transform data to tree with expand state and breadcrumb
  const categoriesTree = useMemo(() => {
    if (!categoriesData?.categories) return []
    
    // API'den flat array geliyor, tree yapısına çevirmemiz gerek
    const flatCategories = categoriesData.categories
    
    // Önce tüm kategorileri map'e al
    const categoryMap = new Map<string, Category>()
    const processedIds = new Set<string>()
    
    flatCategories.forEach((category: Category, index: number) => {
      // MongoDB _id'yi id olarak map et
      const realId = category.id || (category as any)._id
      
      if (!realId || typeof realId !== 'string') {
        console.warn('⚠️ Invalid category ID:', category)
        return
      }
      
      // MongoDB ObjectID format kontrolü
      if (!/^[0-9a-fA-F]{24}$/.test(realId)) {
        console.warn('⚠️ Invalid ObjectID format:', realId)
        return
      }
      
      // Duplicate kontrolü
      if (processedIds.has(realId)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🔄 Duplicate category ID skipped:', {
            id: realId,
            name: category.name
          })
        }
        return
      }
      
      processedIds.add(realId)
      
      // Parent ID'yi doğru şekilde al
      let parentId = null
      if (category.parent) {
        if (typeof category.parent === 'string') {
          parentId = category.parent
        } else if (typeof category.parent === 'object' && category.parent.id) {
          parentId = category.parent.id
        } else if (typeof category.parent === 'object' && (category.parent as any)._id) {
          parentId = (category.parent as any)._id
        }
      }
      
      categoryMap.set(realId, {
        ...category,
        id: realId,
        parent: category.parent // Orijinal parent object'ini koru
      })
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Processed category "${category.name}":`, {
          id: realId,
          parentId: parentId,
          parentType: typeof category.parent,
          parentData: category.parent,
          level: category.level
        })
      }
    })
    
    // Tree yapısını oluştur - sadece root kategorilerden başla
    const buildTree = (parentId: string | null = null): CategoryTreeItem[] => {
      const children: CategoryTreeItem[] = []
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌳 Building tree for parentId: ${parentId || 'ROOT'}`)
      }
      
      categoryMap.forEach((category) => {
        // Parent ID'yi doğru şekilde al
        let categoryParentId = null
        if (category.parent) {
          if (typeof category.parent === 'string') {
            categoryParentId = category.parent
          } else if (typeof category.parent === 'object' && category.parent.id) {
            categoryParentId = category.parent.id
          } else if (typeof category.parent === 'object' && (category.parent as any)._id) {
            categoryParentId = (category.parent as any)._id
          }
        }
        
        const isRootCategory = !categoryParentId || categoryParentId === null
        const isChildOfParent = categoryParentId === parentId
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Checking category "${category.name}":`, {
            categoryId: category.id,
            categoryParentId,
            parentId,
            isRootCategory,
            isChildOfParent,
            shouldInclude: (parentId === null && isRootCategory) || (parentId !== null && isChildOfParent)
          })
        }
        
        if ((parentId === null && isRootCategory) || (parentId !== null && isChildOfParent)) {
          // Recursive olarak children'ları al
          const categoryChildren = buildTree(category.id)
          
          children.push({
            ...category,
            expanded: expandedCategories.has(category.id),
            children: categoryChildren.length > 0 ? categoryChildren : undefined
          })
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🌳 Added to tree: "${category.name}" (parent: ${parentId || 'root'}, children: ${categoryChildren.length})`)
          }
        }
      })
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌳 Tree level ${parentId || 'ROOT'} complete. Found ${children.length} categories.`)
      }
      
      return children
    }
    
    const tree = buildTree(null)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🌳 Final tree structure:', tree)
      console.log('📊 Tree stats:', {
        totalCategories: categoryMap.size,
        rootCategories: tree.length,
        duplicatesSkipped: flatCategories.length - processedIds.size
      })
    }
    
    return tree
  }, [categoriesData, expandedCategories])

  // Filtered categories - sadece ana kategorileri göster, alt kategoriler expanded state'e göre render edilir
  const filteredCategories = useMemo(() => {
    if (!categoriesTree || categoriesTree.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Filtered categories: Empty categoriesTree')
      }
      return []
    }
    
    const filterTree = (categories: CategoryTreeItem[], isRoot = true): CategoryTreeItem[] => {
      return categories.filter(category => {
        // Güvenlik kontrolü
        if (!category || !category.name) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Invalid category in filter:', category)
          }
          return false
        }
        
        // Root level'da sadece ana kategorileri göster (parent olmayan)
        if (isRoot) {
          const isRootCategory = !category.parent || category.parent === null
          if (!isRootCategory) {
            return false // Ana kategori değilse gösterme
          }
        }
        
        // Search filter
        const matchesSearch = appliedFilters.search === '' || 
          category.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
          (category.slug && category.slug.toLowerCase().includes(appliedFilters.search.toLowerCase()))
        
        // Status filter
        const matchesStatus = appliedFilters.status === 'all' ||
          (appliedFilters.status === 'active' && category.isActive) ||
          (appliedFilters.status === 'inactive' && !category.isActive)
        
        // Level filter - root level'da Level 0 filtresi otomatik uygulanır
        let matchesLevel = true
        
        if (appliedFilters.level !== 'all') {
          if (appliedFilters.level === '0') {
            // Ana kategoriler zaten filtrelendi
            matchesLevel = true
          } else if (appliedFilters.level === '1') {
            // Alt kategoriler için - sadece search yapılırsa göster
            matchesLevel = isRoot ? true : (category.level === 1 || (!!category.parent && (category.level || 0) <= 1))
          } else if (appliedFilters.level === '2+') {
            // Derin kategoriler için - sadece search yapılırsa göster  
            matchesLevel = isRoot ? true : ((category.level || 0) >= 2)
          }
        }
        
        // Parent filter - root level'da ana kategoriler gösterilir
        let matchesParent = true
        
        if (appliedFilters.parent !== 'all') {
          if (appliedFilters.parent === 'root') {
            // Zaten ana kategoriler gösteriliyor
            matchesParent = true
          } else {
            // Belirli parent'ın kategorileri - sadece o parent'ı göster
            matchesParent = isRoot ? (category.id === appliedFilters.parent) : (category.parent?.id === appliedFilters.parent)
          }
        }
        
        return matchesSearch && matchesStatus && matchesLevel && matchesParent
      }).map(category => ({
        ...category,
        // Children'ı her zaman sakla ama render edilmesi expand state'e bağlı
        children: category.children ? filterTree(category.children, false) : undefined
      }))
    }
    
    // Eğer search yapılıyorsa, tüm ağacı göster (flatten)
    if (appliedFilters.search && appliedFilters.search.trim() !== '') {
      const flattenAndFilter = (categories: CategoryTreeItem[]): CategoryTreeItem[] => {
        let result: CategoryTreeItem[] = []
        
        categories.forEach(category => {
          // Search matches kontrolü
          const matchesSearch = category.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
            (category.slug && category.slug.toLowerCase().includes(appliedFilters.search.toLowerCase()))
          
          if (matchesSearch) {
            result.push({
              ...category,
              children: category.children ? flattenAndFilter(category.children) : undefined
            })
          }
          
          // Children'da arama yap
          if (category.children && category.children.length > 0) {
            const matchingChildren = flattenAndFilter(category.children)
            if (matchingChildren.length > 0) {
              // Parent'ı da ekle çünkü child'ı match etti
              if (!result.find(r => r.id === category.id)) {
                result.push({
                  ...category,
                  expanded: true, // Arama sırasında otomatik aç
                  children: matchingChildren
                })
              }
            }
          }
        })
        
        return result
      }
      
      const result = flattenAndFilter(categoriesTree)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Search filtered categories:', result)
      }
      
      return result
    }
    
    // Normal durum: sadece ana kategorileri göster
    const result = filterTree(categoriesTree, true)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Root categories only:', result)
      console.log('📊 Total root categories:', result.length)
    }
    
    return result
  }, [categoriesTree, appliedFilters])

  // Get all parent categories for filter dropdown
  const parentCategories = useMemo(() => {
    const getParents = (categories: CategoryTreeItem[]): CategoryTreeItem[] => {
      let parents: CategoryTreeItem[] = []
      
      const collectParents = (cats: CategoryTreeItem[]) => {
        cats.forEach(category => {
          // ID kontrolü
          if (!category.id) {
            return // Geçersiz ID'yi atla
          }
          
          // Eğer bu kategori parent ise (children'ı varsa) listeye ekle
          if (category.children && category.children.length > 0) {
            parents.push(category)
            
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Added parent category:', {
                id: category.id,
                name: category.name,
                childrenCount: category.children.length
              })
            }
            
            // Recursive olarak children'ları kontrol et
            collectParents(category.children)
          }
        })
      }
      
      collectParents(categories)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Parent categories summary:', {
          totalParents: parents.length,
          parentNames: parents.map(p => p.name)
        })
      }
      
      return parents
    }
    
    return getParents(categoriesTree)
  }, [categoriesTree])

  // Check if filters have been applied
  const hasActiveFilters = appliedFilters.search || 
    appliedFilters.status !== 'all' || 
    appliedFilters.level !== 'all' ||
    appliedFilters.parent !== 'all'

  // Check if temp filters are different from applied
  const hasUnappliedChanges = JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters)

  // Handlers
  const handleTempFilterChange = (field: keyof FilterState, value: string) => {
    setTempFilters(prev => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    setAppliedFilters({ ...tempFilters })
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      status: 'all',
      level: 'all',
      parent: 'all'
    }
    setTempFilters(clearedFilters)
    setAppliedFilters(clearedFilters)
  }

  const handleToggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleEdit = (category: Category) => {
    // Temporary ID kontrolü
    if (!category.id || category.id.startsWith('temp-id-')) {
      toast.error('Bu kategori geçici bir ID\'ye sahip ve düzenlenemez. Sayfayı yenileyin.')
      console.warn('⚠️ Attempted to edit category with temporary ID:', category)
      return
    }
    
    // MongoDB ObjectID formatı kontrolü
    if (!/^[0-9a-fA-F]{24}$/.test(category.id)) {
      toast.error('Geçersiz kategori ID formatı. Sayfayı yenileyin.')
      console.warn('⚠️ Invalid category ID format:', category.id)
      return
    }
    
    window.location.href = `/admin/categories/${category.id}/edit`
  }

  const handleDelete = (category: Category) => {
    // Temporary ID kontrolü - gerçek MongoDB ID'si olmayanları engelle
    if (!category.id || category.id.startsWith('temp-id-')) {
      toast.error('Bu kategori geçici bir ID\'ye sahip ve silinemez. Sayfayı yenileyin.')
      console.warn('⚠️ Attempted to delete category with temporary ID:', category)
      return
    }
    
    // MongoDB ObjectID formatı kontrolü (24 karakter hex string)
    if (!/^[0-9a-fA-F]{24}$/.test(category.id)) {
      toast.error('Geçersiz kategori ID formatı. Sayfayı yenileyin.')
      console.warn('⚠️ Invalid category ID format:', category.id)
      return
    }
    
    setCategoryToDelete(category)
  }

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      // Son bir güvenlik kontrolü
      if (!categoryToDelete.id || categoryToDelete.id.startsWith('temp-id-')) {
        toast.error('Geçersiz kategori ID\'si. İşlem iptal edildi.')
        setCategoryToDelete(null)
        return
      }
      
      console.log('🗑️ Deleting category:', {
        id: categoryToDelete.id,
        name: categoryToDelete.name
      })
      
      deleteCategory.mutate(categoryToDelete.id, {
        onSuccess: () => {
          toast.success('Kategori başarıyla silindi')
          setCategoryToDelete(null)
        },
        onError: (error) => {
          console.error('❌ Delete category error:', error)
          const apiError = error as any
          
          if (apiError?.response?.status === 500) {
            toast.error('Sunucu hatası. Kategori silinemedi.')
          } else if (apiError?.response?.status === 404) {
            toast.error('Kategori bulunamadı. Sayfa yenileniyor...')
            // Sayfa yenile çünkü kategori zaten silinmiş olabilir
            setTimeout(() => window.location.reload(), 1500)
          } else if (apiError?.response?.data?.error) {
            toast.error(apiError.response.data.error)
          } else {
            toast.error('Kategori silinirken bir hata oluştu')
          }
          
          setCategoryToDelete(null)
        }
      })
    }
  }

  const handleToggleStatus = (category: Category) => {
    // Temporary ID kontrolü
    if (!category.id || category.id.startsWith('temp-id-')) {
      toast.error('Bu kategori geçici bir ID\'ye sahip, durumu değiştirilemez. Sayfayı yenileyin.')
      console.warn('⚠️ Attempted to toggle status of category with temporary ID:', category)
      return
    }
    
    // MongoDB ObjectID formatı kontrolü
    if (!/^[0-9a-fA-F]{24}$/.test(category.id)) {
      toast.error('Geçersiz kategori ID formatı. Sayfayı yenileyin.')
      console.warn('⚠️ Invalid category ID format:', category.id)
      return
    }
    
    updateCategoryStatus.mutate({
      id: category.id,
      isActive: !category.isActive
    }, {
      onSuccess: () => {
        toast.success(`Kategori ${category.isActive ? 'deaktifleştirildi' : 'aktifleştirildi'}`)
      },
      onError: (error) => {
        console.error('❌ Toggle status error:', error)
        const apiError = error as any
        
        if (apiError?.response?.status === 500) {
          toast.error('Sunucu hatası. Kategori durumu değiştirilemedi.')
        } else if (apiError?.response?.status === 404) {
          toast.error('Kategori bulunamadı. Sayfa yenileniyor...')
          setTimeout(() => window.location.reload(), 1500)
        } else {
          toast.error('Kategori durumu değiştirilirken hata oluştu')
        }
      }
    })
  }

  const handleToggleSelect = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([])
    } else {
      const getAllCategoryIds = (categories: CategoryTreeItem[]): string[] => {
        let ids: string[] = []
        categories.forEach(category => {
          ids.push(category.id)
          if (category.children) {
            ids = [...ids, ...getAllCategoryIds(category.children)]
          }
        })
        return ids
      }
      setSelectedCategories(getAllCategoryIds(filteredCategories))
    }
  }

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedCategories.length === 0) return
    
    // Temporary ID'leri filtrele
    const validCategoryIds = selectedCategories.filter(id => {
      const isValid = id && !id.startsWith('temp-id-') && /^[0-9a-fA-F]{24}$/.test(id)
      if (!isValid) {
        console.warn('⚠️ Filtered out invalid category ID from bulk action:', id)
      }
      return isValid
    })
    
    if (validCategoryIds.length === 0) {
      toast.error('Seçilen kategorilerin geçersiz ID\'leri var. Sayfayı yenileyin.')
      setSelectedCategories([]) // Seçimleri temizle
      return
    }
    
    if (validCategoryIds.length < selectedCategories.length) {
      toast.warning(`${selectedCategories.length - validCategoryIds.length} kategori geçersiz ID nedeniyle işlemden çıkarıldı`)
    }
    
    console.log(`🔄 Bulk ${action} operation for ${validCategoryIds.length} categories`)
    
    bulkCategoryActions.mutate({
      action,
      categoryIds: validCategoryIds
    }, {
      onSuccess: () => {
        const actionText = action === 'activate' ? 'aktifleştirildi' : 
                          action === 'deactivate' ? 'deaktifleştirildi' : 'silindi'
        toast.success(`${validCategoryIds.length} kategori ${actionText}`)
        setSelectedCategories([])
      },
      onError: (error) => {
        console.error(`❌ Bulk ${action} error:`, error)
        const apiError = error as any
        
        if (apiError?.response?.status === 500) {
          toast.error('Sunucu hatası. Toplu işlem başarısız.')
        } else if (apiError?.response?.data?.error) {
          toast.error(apiError.response.data.error)
        } else {
          toast.error('Toplu işlem sırasında hata oluştu')
        }
        
        setSelectedCategories([])
      }
    })
  }

  const handleExpandAll = () => {
    const getAllCategoryIds = (categories: CategoryTreeItem[]): string[] => {
      let ids: string[] = []
      categories.forEach(category => {
        if (category.children && category.children.length > 0) {
          ids.push(category.id)
          ids = [...ids, ...getAllCategoryIds(category.children)]
        }
      })
      return ids
    }
    setExpandedCategories(new Set(getAllCategoryIds(categoriesTree)))
  }

  const handleCollapseAll = () => {
    setExpandedCategories(new Set())
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Kategori Yönetimi</h1>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-2">Kategoriler yüklenirken hata oluştu</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Kategori Yönetimi</h1>
          <p className="text-muted-foreground">
            Ürün kategorilerini yönetin ve düzenleyin
            {hasActiveFilters && ' • Filtreler uygulandı'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            İçe Aktar
          </Button>
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kategori
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtreler ve Arama
          </CardTitle>
          <CardDescription>
            Kategorileri filtrelemek için aşağıdaki alanları kullanın
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
                placeholder="Kategori ara..."
                value={tempFilters.search}
                onChange={(e) => handleTempFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={tempFilters.status} onValueChange={(value) => handleTempFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Pasif</SelectItem>
              </SelectContent>
            </Select>

            {/* Level Filter */}
            <Select value={tempFilters.level} onValueChange={(value) => handleTempFilterChange('level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Level seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Seviyeler</SelectItem>
                <SelectItem value="0">Ana Kategoriler (L0)</SelectItem>
                <SelectItem value="1">Alt Kategoriler (L1)</SelectItem>
                <SelectItem value="2+">Derin Kategoriler (L2+)</SelectItem>
              </SelectContent>
            </Select>

            {/* Parent Filter */}
            <Select value={tempFilters.parent} onValueChange={(value) => handleTempFilterChange('parent', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Parent seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                <SelectItem value="root">Sadece Ana Kategoriler</SelectItem>
                {parentCategories.map((category) => {
                  return (
                    <SelectItem key={`parent-${category.id}`} value={category.id}>
                      {category.name}
                    </SelectItem>
                  )
                })}
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
          
          {/* Tree Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExpandAll}>
                <TreePine className="h-4 w-4 mr-2" />
                Tümünü Aç
              </Button>
              <Button variant="outline" size="sm" onClick={handleCollapseAll}>
                <Folder className="h-4 w-4 mr-2" />
                Tümünü Kapat
              </Button>
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
                {appliedFilters.status !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Durum: {appliedFilters.status === 'active' ? 'Aktif' : 'Pasif'}
                  </Badge>
                )}
                {appliedFilters.level !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Level: {appliedFilters.level}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedCategories.length} kategori seçildi
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Aktifleştir
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Deaktifleştir
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Kategori Hiyerarşisi</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Ürün Sayısı</TableHead>
                  <TableHead>Resim</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-16">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`loading-row-${i}`}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      {categoriesData ? 'Kategori bulunamadı.' : 'Kategoriler yükleniyor...'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category, index) => {
                    // Güvenli key generation
                    const safeKey = category.id ? `main-category-${category.id}` : `main-category-index-${index}`
                    
                    return (
                      <CategoryRow
                        key={safeKey}
                        category={category}
                        level={0}
                        onToggleExpand={handleToggleExpand}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        selectedCategories={selectedCategories}
                        onToggleSelect={handleToggleSelect}
                      />
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{categoryToDelete?.name}" kategorisini silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz.
              {categoryToDelete?.children && categoryToDelete.children.length > 0 && (
                <><br /><br />
                <strong>Uyarı:</strong> Bu kategorinin alt kategorileri var. 
                Silme işlemi alt kategorileri de etkileyebilir.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 
