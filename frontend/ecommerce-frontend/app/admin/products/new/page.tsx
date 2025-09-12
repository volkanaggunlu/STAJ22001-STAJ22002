'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
  Settings
} from 'lucide-react'
import { useCreateProduct } from '@/lib/hooks/useAdminProducts'
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
  isNew: boolean
  isBestseller: boolean
  isFeatured: boolean
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
  images: File[]
  specifications: Array<{ key: string; value: string }>
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
  
  // Flatten with hierarchy - show both parent and full path for children
  const flattenWithHierarchy = (categories: Category[], level = 0, parentPath = ''): Array<{value: string, label: string, level: number}> => {
    const result: Array<{value: string, label: string, level: number}> = []
    
    categories.forEach(cat => {
      const id = cat._id || cat.id || ''
      
      // For root categories, show just the name
      if (level === 0) {
        result.push({
          value: id,
          label: cat.name,
          level
        })
      } else {
        // For child categories, show full path
        const fullPath = parentPath ? `${parentPath} → ${cat.name}` : cat.name
        result.push({
          value: id,
          label: fullPath,
          level
        })
      }
      
      // Recursively add children
      if (cat.children && cat.children.length > 0) {
        const currentPath = level === 0 ? cat.name : (parentPath ? `${parentPath} → ${cat.name}` : cat.name)
        result.push(...flattenWithHierarchy(cat.children, level + 1, currentPath))
      }
    })
    
    return result
  }
  
  return flattenWithHierarchy(rootCategories)
}

//
const productSchema = z.object({
  name: z.string().min(3, "Ürün adı en az 3 karakter olmalıdır"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  shortDescription: z.string().optional(),
  sku: z.string().min(1, "SKU zorunludur"),
  price: z.number().min(1, "Fiyat 0'dan büyük olmalı"),
  originalPrice: z.number().optional(),
  category: z.string().min(1, "Kategori seçimi zorunludur"),
  subcategory: z.string().optional(),
  brand: z.string().min(1, "Marka zorunludur"),
  status: z.enum(["active", "inactive", "draft"]),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false)
})
type productFormData = z.infer< typeof productSchema>

export default function NewProductPage() {
  const router = useRouter()
  const createProductMutation = useCreateProduct()

    const form = useForm<productFormData>({
      
      resolver: zodResolver(productSchema),
      defaultValues: {
      name: '',
      description: "",
      sku: "",
      price: 0,
      category: "",
      brand: "",
      status: "draft",
      isNew: false,
      isFeatured: false,
      isBestseller: false,

      },
    })
  
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
    isNew: false,
    isBestseller: false,
    isFeatured: false,
    originalPrice: 0,
    category: '',
    subcategory: '',
    brand: '',
    tags: [],
    status: 'draft',
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
    specifications: []
  })

  const [currentTag, setCurrentTag] = useState('')
  const [currentSpec, setCurrentSpec] = useState({ key: '', value: '' })
  const [imagePreview, setImagePreview] = useState<string[]>([])

  // Process categories for hierarchical display
  const categories = categoriesData?.categories || []
  const hierarchicalCategories = buildHierarchicalCategories(categories)

  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Raw categories data:', categories)
    console.log('🔍 Hierarchical categories:', hierarchicalCategories)
  }

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
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-6)
    const prefix = formData.category ? formData.category.slice(0, 3).toUpperCase() : 'PRD'
    return `${prefix}-${timestamp}`
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (value: string) => {
    handleInputChange('name', value)
  /* if (!formData.seo.metaTitle) {
      handleInputChange('seo.metaTitle', value)
    }
     if (!formData.seo.slug) {
      handleInputChange('seo.slug', generateSlug(value))
    } */
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
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
      
      // Create previews
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
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
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

    // Upload images first if any
    let imageUrls: string[] = []
    if (formData.images.length > 0) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('📸 Resimler yükleniyor:', formData.images.length, 'adet')
        }
        
        const fileList = new DataTransfer()
        formData.images.forEach(file => fileList.items.add(file))
        
        const uploadResult = await adminApi.uploadProductImages(fileList.files)
        
        if (Array.isArray(uploadResult)) {
          imageUrls = uploadResult
        } else if (uploadResult && typeof uploadResult === 'object') {
          if (Array.isArray((uploadResult as any).uploadedFiles)) {
            imageUrls = (uploadResult as any).uploadedFiles.map((f: any) => f.url)
          } else if (Array.isArray((uploadResult as any).urls)) {
            imageUrls = (uploadResult as any).urls
          } else if (Array.isArray((uploadResult as any).images)) {
            imageUrls = (uploadResult as any).images.map((img: any) => img.url || img)
          } else {
            imageUrls = []
          }
        } else {
          imageUrls = []
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Resimler yüklendi:', imageUrls)
        }
      } catch (uploadError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Resim yükleme hatası:', uploadError)
        }
        toast.error('Resimler yüklenirken hata oluştu')
        return
      }
    }

    const submitData = {
      ...formData,
      status,
      sku: formData.sku || generateSKU(),
      images: imageUrls.map((url, index) => {
        let normalizedUrl = url
        if (typeof url === 'string' && url.includes('/uploads/')) {
          normalizedUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}${url}`
        }
        return {
          url: normalizedUrl,
          alt: formData.name,
          isPrimary: index === 0
        }
      }),
      // Only include originalPrice if it's a valid number and greater than 0
      originalPrice: formData.originalPrice && formData.originalPrice > 0 ? formData.originalPrice : undefined
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Ürün gönderimi başlatılıyor:', submitData)
      console.log('📝 Seçilen kategori:', {
          categoryId: formData.category,
          categoryName: hierarchicalCategories.find(c => c.value === formData.category)?.label
        })
    }

    await createProductMutation.mutateAsync(submitData)
    toast.success(`Ürün ${status === 'draft' ? 'taslak olarak kaydedildi' : 'yayınlandı'}`)
    router.push('/admin/products')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Ürün ekleme hatası:', error)
    }
    toast.error('Ürün kaydedilirken hata oluştu')
  }
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
            <h1 className="text-3xl font-bold">Yeni Ürün Ekle</h1>
            <p className="text-muted-foreground">Ürün bilgilerini doldurun ve kaydedin</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleSubmit('draft')} 
            disabled={createProductMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {createProductMutation.isPending ? 'Kaydediliyor...' : 'Taslak Kaydet'}
          </Button>
          <Button 
            onClick={() => handleSubmit('active')} 
            disabled={createProductMutation.isPending}
          >
            <Eye className="h-4 w-4 mr-2" />
            {createProductMutation.isPending ? 'Yayınlanıyor...' : 'Yayınla'}
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
                  <div className="flex space-x-2">
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="Otomatik oluşturulacak"
                    />
                    <Button variant="outline" size="sm" onClick={() => handleInputChange('sku', generateSKU())}>
                      Oluştur
                    </Button>
                  </div>
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
                        ? `En az ${10 - formData.description.length} karakter daha yazın`
                        : '✓ Açıklama geçerli'
                    }
                  </span>
                  <span className="text-muted-foreground">
                    {formData.description.length} karakter
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
                Fiyatlandırma
              </CardTitle>
              <CardDescription>Ürün fiyatları ve indirim bilgileri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Satış Fiyatı (₺) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price > 0 ? formData.price : ''}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Eski Fiyat (₺)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={(formData.originalPrice ?? 0) > 0 ? formData.originalPrice : ''}
                    onChange={(e) =>
                      handleInputChange('originalPrice', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground">
                    İndirim göstermek için eski fiyatı girin (isteğe bağlı)
                  </p>
                </div>
              </div>
              {/* Smart discount/price comparison display */}
              {(formData.originalPrice ?? 0 )> 0 && formData.price > 0 && (
                <div className="space-y-2">
                  {(formData.originalPrice ?? 0) > formData.price ? (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                      ✅ <strong>İndirim:</strong>{' '}
                      %{Math.round((((formData.originalPrice ?? 0) - formData.price) /(formData.originalPrice ?? 0)) *100
                      )}
                      <br />
                    <span className="text-xs">Müşteri{' '} {((formData.originalPrice ?? 0) - formData.price).toFixed(2)}₺ tasarruf edecek</span>
                    </div>
                  ) : formData.originalPrice === formData.price ? (
                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                      ℹ️ Eski fiyat ile satış fiyatı aynı (indirim yok)
                    </div>
                  ) : (
                    <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded-md border border-orange-200">
                      ⚠️ Satış fiyatı eski fiyattan yüksek (fiyat artışı)
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="h-5 w-5 mr-2" />
                Ürün Görselleri
              </CardTitle>
              <CardDescription>Ürün fotoğraflarını yükleyin (en fazla 10 adet)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <label className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center h-32">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Görsel Ekle</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Product Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Teknik Özellikler</CardTitle>
              <CardDescription>Ürün özelliklerini ekleyin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Özellik adı"
                  value={currentSpec.key}
                  onChange={(e) => setCurrentSpec(prev => ({ ...prev, key: e.target.value }))}
                />
                <Input
                  placeholder="Değer"
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
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{spec.key}:</span> {spec.value}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeSpecification(index)}>
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
          {/* Görünüm Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Görünüm Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Öne Çıkan</Label>
                  <p className="text-sm text-muted-foreground">
                    Anasayfada öne çıkar
                  </p>
                </div>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Yeni Ürün</Label>
                  <p className="text-sm text-muted-foreground">
                    Yeni ürün olarak işaretle
                  </p>
                </div>
                <Switch
                  checked={formData.isNew}
                  onCheckedChange={(checked) => handleInputChange('isNew', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Çok Satan</Label>
                  <p className="text-sm text-muted-foreground">
                    Çok satan ürün olarak işaretle
                  </p>
                </div>
                <Switch
                  checked={formData.isBestseller}
                  onCheckedChange={(checked) => handleInputChange('isBestseller', checked)}
                />
              </div>
            </CardContent>
        </Card> 
    </div>
  </div>
</div>
  )
} 