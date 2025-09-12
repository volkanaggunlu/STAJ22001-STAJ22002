'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  X, 
  Plus,
  Image as ImageIcon,
  Package,
  DollarSign,
  Tag,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useProduct } from '@/lib/hooks/useProducts'
import { useUpdateProduct } from '@/lib/hooks/useAdminProducts'
import { adminApi } from '@/lib/api/services/admin'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import Link from 'next/link'

// Form data interface
interface ProductFormData {
  name: string
  description: string
  shortDescription: string
  sku: string
  price: number
  originalPrice?: number
  category: string
  subcategory?: string
  brand: string
  tags: string[]
  status: 'active' | 'inactive' | 'draft'
  stock: {
    quantity: number
    lowStockThreshold: number
    trackStock: boolean
  }
  seo: {
    metaTitle: string
    metaDescription: string
    slug: string
  }
  images: string[] // URLs for existing images, Files for new ones
  newImages: File[] // Newly uploaded images
  specifications: Array<{ key: string; value: string }>
}

// API response interfaces
interface UploadedFile {
  filename: string
  mimetype: string
  originalName: string
  size: number
  uploadedAt: string
  url: string
}

interface UploadResponse {
  uploadedFiles: UploadedFile[]
}

// Category interface for hierarchical display
interface Category {
  _id: string
  id?: string
  name: string
  slug: string
  parent?: string | { _id: string; id?: string }
  children?: Category[]
  level?: number
}

// Helper function to build hierarchical category list
const buildHierarchicalCategories = (categories: Category[]): Array<{value: string, label: string, level: number}> => {
  const categoryMap = new Map<string, Category>()
  const rootCategories: Category[] = []
  
  // Build category map and find root categories
  categories.forEach(cat => {
    const id = cat._id || cat.id || ''
    categoryMap.set(id, { ...cat, children: [] })
    if (!cat.parent) {
      rootCategories.push(categoryMap.get(id)!)
    }
  })
  
  // Build tree structure
  categories.forEach(cat => {
    // Handle parent as both object and string
    const parentId = typeof cat.parent === 'object' && cat.parent !== null 
      ? cat.parent._id || cat.parent.id 
      : cat.parent
      
    if (parentId && categoryMap.has(parentId)) {
      const parent = categoryMap.get(parentId)!
      const child = categoryMap.get(cat._id || cat.id || '')!
      parent.children!.push(child)
    }
  })
  
  // Flatten with hierarchy
  const flattenWithHierarchy = (categories: Category[], level = 0, parentPath = ''): Array<{value: string, label: string, level: number}> => {
    const result: Array<{value: string, label: string, level: number}> = []
    
    categories.forEach(cat => {
      const id = cat._id || cat.id || ''
      
      if (level === 0) {
        result.push({
          value: id,
          label: cat.name,
          level
        })
      } else {
        const fullPath = parentPath ? `${parentPath} → ${cat.name}` : cat.name
        result.push({
          value: id,
          label: fullPath,
          level
        })
      }
      
      if (cat.children && cat.children.length > 0) {
        const currentPath = level === 0 ? cat.name : (parentPath ? `${parentPath} → ${cat.name}` : cat.name)
        result.push(...flattenWithHierarchy(cat.children, level + 1, currentPath))
      }
    })
    
    return result
  }
  
  return flattenWithHierarchy(rootCategories)
}

interface ProductEditPageProps {
  params: Promise<{ id: string }>
}

export default function ProductEditPage({ params }: ProductEditPageProps) {
  const router = useRouter()
  
  // Next.js 15 - Unwrap params Promise
  const { id: productId } = use(params)
  
  // Fetch existing product data
  const { data: product, isLoading: productLoading, error: productError } = useProduct(productId)
  
  // Update mutation
  const updateProductMutation = useUpdateProduct()
  
  // Categories API call
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
  
  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    shortDescription: '',
    sku: '',
    price: 0,
    originalPrice: 0,
    category: '',
    subcategory: '',
    brand: '',
    tags: [],
    status: 'active',
    stock: {
      quantity: 0,
      lowStockThreshold: 10,
      trackStock: true
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      slug: ''
    },
    images: [],
    newImages: [],
    specifications: []
  })

  const [currentTag, setCurrentTag] = useState('')
  const [currentSpec, setCurrentSpec] = useState({ key: '', value: '' })
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [isFormLoaded, setIsFormLoaded] = useState(false)

  // Load product data into form when available
  useEffect(() => {
    if (product && !isFormLoaded) {
      // TanStack Query returns the data part: { product: Product }
      const productData = (product as any).product || product
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 Loading product data:', productData)
      }
      
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        shortDescription: productData.shortDescription || '',
        sku: productData.sku || '',
        price: productData.price || 0,
        originalPrice: productData.originalPrice || 0,
        category: productData.category?.id || productData.categoryId || '',
        subcategory: '',
        brand: productData.brand || '',
        tags: productData.keywords || productData.tags || [],
        status: productData.status === 'discontinued' ? 'inactive' : (productData.status || 'active'),
        stock: {
          quantity: productData.stock?.quantity || 0,
          lowStockThreshold: productData.stock?.lowStockThreshold || 10,
          trackStock: productData.stock?.trackStock !== false
        },
        seo: {
          metaTitle: productData.seo?.title || productData.title || '',
          metaDescription: productData.seo?.description || '',
          slug: productData.slug || ''
        },
        images: Array.isArray(productData.images) 
          ? productData.images.map((img: any) => typeof img === 'string' ? img : img.url || img.src)
          : [],
        newImages: [],
        specifications: productData.specifications || []
      })
      
      // Set image previews for existing images  
      const imageUrls = Array.isArray(productData.images) 
        ? productData.images.map((img: any) => typeof img === 'string' ? img : img.url || img.src)
        : []
      setImagePreview(imageUrls)
      setIsFormLoaded(true)
    }
  }, [product, isFormLoaded])

  // Process categories for hierarchical display
  const categories = categoriesData?.categories || []
  const hierarchicalCategories = buildHierarchicalCategories(categories)

  // Form handlers
  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ProductFormData] as any),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      seo: {
        ...prev.seo,
        metaTitle: prev.seo.metaTitle || value,
        slug: prev.seo.slug || generateSlug(value)
      }
    }))
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addSpecification = () => {
    if (currentSpec.key.trim() && currentSpec.value.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: [...prev.specifications, { ...currentSpec }]
      }))
      setCurrentSpec({ key: '', value: '' })
    }
  }

  const removeSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setFormData(prev => ({
        ...prev,
        newImages: [...prev.newImages, ...files]
      }))
      
      // Add previews for new images
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreview(prev => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    const totalExistingImages = formData.images.length
    
    if (index < totalExistingImages) {
      // Removing existing image
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }))
    } else {
      // Removing new image
      const newImageIndex = index - totalExistingImages
      setFormData(prev => ({
        ...prev,
        newImages: prev.newImages.filter((_, i) => i !== newImageIndex)
      }))
    }
    
    setImagePreview(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (status: 'draft' | 'active') => {
    try {
      // Basic validation
      if (!formData.name.trim()) {
        toast.error('Ürün adı zorunludur')
        return
      }
      
      if (!formData.description.trim()) {
        toast.error('Ürün açıklaması zorunludur')
        return
      }
      
      if (formData.description.trim().length < 10) {
        toast.error('Ürün açıklaması en az 10 karakter olmalıdır')
        return
      }
      
      if (!formData.category) {
        toast.error('Kategori seçimi zorunludur')
        return
      }
      
      if (formData.price <= 0) {
        toast.error('Fiyat 0\'dan büyük olmalıdır')
        return
      }

      // Upload new images if any
      let newImageUrls: string[] = []
      if (formData.newImages.length > 0) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('📸 Yeni resimler yükleniyor:', formData.newImages.length, 'adet')
            console.log('📸 Yüklenen resim detayları:', formData.newImages.map(f => ({
              name: f.name,
              size: f.size,
              type: f.type
            })))
          }
          
          // FileList oluştur
          const fileList = new DataTransfer()
          formData.newImages.forEach(file => {
            if (file instanceof File) {
              fileList.items.add(file)
            }
          })
          
          if (fileList.files.length === 0) {
            throw new Error('Geçerli resim dosyası bulunamadı')
          }
          
          // API'ye gönder
          const uploadResult = await adminApi.uploadProductImages(fileList.files, productId)
          
          if (process.env.NODE_ENV === 'development') {
            console.log('📸 Upload API yanıtı:', uploadResult)
          }
          
          // API yanıtını kontrol et ve URL'leri al
          if (Array.isArray(uploadResult)) {
            newImageUrls = uploadResult
          } else if (uploadResult && typeof uploadResult === 'object') {
            if (Array.isArray(uploadResult.uploadedFiles)) {
              newImageUrls = uploadResult.uploadedFiles.map((file: any) => file.url)
            } else if (Array.isArray(uploadResult.urls)) {
              newImageUrls = uploadResult.urls
            } else if (Array.isArray(uploadResult.images)) {
              newImageUrls = uploadResult.images.map((img: any) => img.url || img)
            }
          }
          
          if (newImageUrls.length === 0) {
            throw new Error('Resim URL\'leri alınamadı')
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Yeni resim URL\'leri:', newImageUrls)
          }
        } catch (uploadError) {
          console.error('❌ Resim yükleme hatası:', uploadError)
          toast.error('Resimler yüklenirken hata oluştu: ' + (uploadError instanceof Error ? uploadError.message : 'Bilinmeyen hata'))
          return
        }
      }

      // Mevcut resimleri filtrele (boş, undefined veya null değerleri temizle)
      const existingImages = Array.isArray(formData.images) 
        ? formData.images.filter(url => typeof url === 'string' && url.trim() !== '')
        : []

      const submitData = {
        ...formData,
        status,
        // Temel bilgiler
        name: formData.name.trim(),
        description: formData.description.trim(),
        shortDescription: formData.shortDescription.trim(),
        sku: formData.sku.trim().toUpperCase(),
        // Fiyat bilgileri
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        // Kategori bilgileri
        category: formData.category, // MongoDB ObjectId olarak gönder
        // Marka
        brand: formData.brand.trim(),
        // Resimler - backend formatına uygun şekilde dönüştür
        images: [...existingImages, ...newImageUrls].map(url => {
          // URL'yi normalize et
          let normalizedUrl = url
          if (url.includes('/uploads/')) {
            // Relative URL'yi absolute URL'ye çevir
            normalizedUrl = `${process.env.NEXT_PUBLIC_API_URL}${url}`
          }
          
          return {
            url: normalizedUrl,
            alt: formData.name,
            isPrimary: false
          }
        }),
        // Stok bilgileri
        stock: {
          quantity: Number(formData.stock.quantity),
          lowStockThreshold: Number(formData.stock.lowStockThreshold),
          trackStock: Boolean(formData.stock.trackStock)
        },
        // Özellikler
        specifications: formData.specifications.map(spec => ({
          key: spec.key.trim(),
          value: spec.value.trim()
        })),
        // SEO bilgileri
        seo: {
          title: formData.seo.metaTitle.trim(),
          description: formData.seo.metaDescription.trim(),
          keywords: formData.tags
        },
        // Varsayılan değerler
        type: 'product',
        slug: formData.seo.slug.trim() || generateSlug(formData.name),
        // Sistem alanları
        lastModified: new Date().toISOString()
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Ürün güncelleme verisi:', {
          ...submitData,
          imageCount: submitData.images.length,
          imageUrls: submitData.images.map(img => img.url),
          requestUrl: `/admin/products/${productId}`,
          method: 'PUT',
          contentType: 'application/json'
        })
      }

      // Remove unnecessary fields
      delete (submitData as any).newImages
      delete (submitData as any).subcategory
      delete (submitData as any).categoryId
      delete (submitData as any).subcategoryId

      try {
        await updateProductMutation.mutateAsync({ id: productId, data: submitData })
        toast.success(`Ürün başarıyla güncellendi`)
        router.push('/admin/products')
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Ürün güncelleme hatası:', error)
          console.error('📝 Hata detayları:', {
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
            message: error?.message,
            validation: error?.response?.data?.errors
          })
        }
        
        // Validasyon hatalarını göster
        if (error?.response?.data?.errors) {
          const validationErrors = error.response.data.errors;
          Object.keys(validationErrors).forEach(field => {
            toast.error(`${field}: ${validationErrors[field].message}`)
          })
        } else {
          toast.error(error?.response?.data?.error || 'Ürün güncellenirken hata oluştu')
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Ürün güncelleme hatası:', error)
      }
      toast.error('Ürün güncellenirken hata oluştu')
    }
  }

  // Loading state
  if (productLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ürün Listesi
            </Link>
          </Button>
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (productError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ürün Listesi
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ürün yüklenirken hata oluştu</h3>
            <p className="text-muted-foreground mb-4">Ürün bulunamadı veya yetkiniz bulunmayabilir.</p>
            <Button onClick={() => router.push('/admin/products')}>
              Ürün Listesine Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ürün Listesi
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Ürün Düzenle</h1>
            <p className="text-muted-foreground">
              {formData.name || 'Ürün'} bilgilerini güncelleyin
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit('draft')} 
            disabled={updateProductMutation.isPending}
          >
            {updateProductMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Taslak Kaydet
          </Button>
          <Button 
            onClick={() => handleSubmit('active')} 
            disabled={updateProductMutation.isPending}
          >
            {updateProductMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Güncelle & Yayınla
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Temel Bilgiler
              </CardTitle>
              <CardDescription>Ürünün temel bilgileri ve açıklamaları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Ürün Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ürün adını girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU Kodu</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="SKU kodu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Kısa Açıklama</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Ürünün kısa açıklaması"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detaylı Açıklama *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Ürünün detaylı açıklaması (en az 10 karakter)"
                  rows={6}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className={`${
                    formData.description.length === 0 
                      ? 'text-muted-foreground'
                      : formData.description.length < 10 
                        ? 'text-destructive' 
                        : 'text-green-600'
                  }`}>
                    {formData.description.length === 0 
                      ? 'Açıklama zorunludur'
                      : formData.description.length < 10 
                        ? `Minimum 10 karakter gerekli (${formData.description.length}/10)`
                        : `${formData.description.length} karakter`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Fiyat Bilgileri
              </CardTitle>
              <CardDescription>Ürün fiyatları ve indirim ayarları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Satış Fiyatı *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Orijinal Fiyat</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice || ''}
                    onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {formData.originalPrice && formData.originalPrice > formData.price && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-medium">
                      %{Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)} indirim
                    </span>
                    <span className="text-green-600">
                      • {(formData.originalPrice - formData.price).toFixed(2)} TL tasarruf
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="h-5 w-5 mr-2" />
                Ürün Resimleri
              </CardTitle>
              <CardDescription>Ürün görselleri (maksimum 10 resim)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Images */}
              {imagePreview.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreview.map((src, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={src}
                        alt={`Ürün resmi ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {index < formData.images.length && (
                        <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs">
                          Mevcut
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload New Images */}
              <div className="space-y-2">
                <Label htmlFor="images">Yeni Resim Ekle</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Yükle
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF formatlarında yükleyebilirsiniz. Maksimum 5MB.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Teknik Özellikler</CardTitle>
              <CardDescription>Ürünün teknik detayları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Özellik adı"
                  value={currentSpec.key}
                  onChange={(e) => setCurrentSpec(prev => ({ ...prev, key: e.target.value }))}
                />
                <Input
                  placeholder="Özellik değeri"
                  value={currentSpec.value}
                  onChange={(e) => setCurrentSpec(prev => ({ ...prev, value: e.target.value }))}
                />
                <Button onClick={addSpecification}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.specifications.length > 0 && (
                <div className="space-y-2">
                  {formData.specifications.map((spec, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        <strong>{spec.key}:</strong> {spec.value}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSpecification(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Yayın Durumu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Kategoriler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Ana Kategori *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesLoading ? "Kategoriler yükleniyor..." : "Kategori seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <div className="flex items-center justify-center py-4 px-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm text-muted-foreground">Yükleniyor...</span>
                      </div>
                    ) : hierarchicalCategories.length > 0 ? (
                      hierarchicalCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center w-full">
                            {cat.level > 0 && (
                              <span className="text-muted-foreground mr-2" style={{ marginLeft: `${(cat.level - 1) * 8}px` }}>
                                {'└─ '}
                              </span>
                            )}
                            <span className={cat.level === 0 ? "font-medium" : "text-sm"}>
                              {cat.label}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="flex items-center justify-center py-4 px-2">
                        <span className="text-sm text-muted-foreground">Kategori bulunamadı</span>
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {formData.category && !categoriesLoading && (
                  <div className="text-xs text-muted-foreground">
                    Seçilen: {hierarchicalCategories.find(c => c.value === formData.category)?.label || 'Kategori'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marka</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="Marka adı"
                />
              </div>

              <div className="space-y-2">
                <Label>Etiketler</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Etiket ekle"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Stok Yönetimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.stock.trackStock}
                  onCheckedChange={(checked) => handleInputChange('stock.trackStock', checked)}
                />
                <Label>Stok takibi yap</Label>
              </div>

              {formData.stock.trackStock && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Stok Miktarı</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.stock.quantity}
                      onChange={(e) => handleInputChange('stock.quantity', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lowStock">Kritik Stok Seviyesi</Label>
                    <Input
                      id="lowStock"
                      type="number"
                      value={formData.stock.lowStockThreshold}
                      onChange={(e) => handleInputChange('stock.lowStockThreshold', parseInt(e.target.value) || 0)}
                      placeholder="10"
                      min="0"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Ayarları</CardTitle>
              <CardDescription>Arama motoru optimizasyonu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Başlık</Label>
                <Input
                  id="metaTitle"
                  value={formData.seo.metaTitle}
                  onChange={(e) => handleInputChange('seo.metaTitle', e.target.value)}
                  placeholder="SEO başlığı"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Açıklama</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.seo.metaDescription}
                  onChange={(e) => handleInputChange('seo.metaDescription', e.target.value)}
                  placeholder="SEO açıklaması"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.seo.slug}
                  onChange={(e) => handleInputChange('seo.slug', e.target.value)}
                  placeholder="urun-url-slug"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 