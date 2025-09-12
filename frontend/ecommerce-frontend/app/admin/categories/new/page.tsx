'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import slugify from 'slugify'
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  Image as ImageIcon, 
  Upload,
  X,
  Folder,
  Eye,
  Settings
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

import { 
  useCreateCategory, 
  useAdminCategoryTree, 
  useUploadCategoryImage 
} from '@/lib/hooks/useAdminCategories'
import { Category } from '@/lib/api/types'

// Validation Schema
const categorySchema = z.object({
  name: z.string()
    .min(2, 'Kategori adı en az 2 karakter olmalıdır')
    .max(100, 'Kategori adı en fazla 100 karakter olabilir'),
  slug: z.string()
    .min(2, 'Slug en az 2 karakter olmalıdır')
    .max(100, 'Slug en fazla 100 karakter olabilir')
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string()
    .max(500, 'Açıklama en fazla 500 karakter olabilir')
    .optional(),
  parent: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  // Görünüm ayarları
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  showInMenu: z.boolean().default(true),
  showInFooter: z.boolean().default(false),
  // Sıralama
  sortOrder: z.number().min(0).default(0),
  // Icon
  icon: z.string().optional(),
  // SEO fields
  seoTitle: z.string().max(60, 'SEO başlığı en fazla 60 karakter olabilir').optional(),
  seoDescription: z.string().max(160, 'SEO açıklaması en fazla 160 karakter olabilir').optional(),
  seoKeywords: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

export default function NewCategoryPage() {
  const router = useRouter()
  const [uploadedImage, setUploadedImage] = useState<{url: string, alt: string} | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // API Hooks
  const createCategory = useCreateCategory()
  const uploadImage = useUploadCategoryImage()
  const { data: categoriesData } = useAdminCategoryTree()

  // Form
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      parent: undefined,
      isActive: true,
      isVisible: true,
      isFeatured: false,
      showInMenu: true,
      showInFooter: false,
      sortOrder: 0,
      icon: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    },
  })

  const { watch, setValue, handleSubmit, formState: { isSubmitting, errors } } = form
  const watchedName = watch('name')
  const watchedSlug = watch('slug')

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setValue('name', name)
    /* 
    if (name && !watchedSlug) {
      const generatedSlug = slugify(name, {
        lower: true,
        strict: true,
        locale: 'tr'
      })
      setValue('slug', generatedSlug)
    }

    // Auto-generate SEO title if empty
    const seoTitle = watch('seoTitle')
    if (name && !seoTitle) {
      setValue('seoTitle', name)
    }*/
  }

  // Get parent categories for selection with full hierarchy path
  const parentCategories = useMemo(() => {
    if (!categoriesData?.categories) {
      return []
    }
    
    // Visited set ile circular reference'ları önle
    const visited = new Set<string>()
    const allCategories = new Map<string, Category>()
    
    const collectAllCategories = (categories: Category[], depth = 0, parentCategory?: Category) => {
      if (depth > 10) { // Max depth protection
        console.warn('⚠️ Maximum recursion depth reached')
        return
      }
      
      categories.forEach(category => {
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
        
        // Circular reference kontrolü
        if (visited.has(realId)) {
          // Artık log yazmıyoruz, sadece skip ediyoruz
          return
        }
        
        // Visited set'e ekle
        visited.add(realId)
        
        // Parent reference'ını doğru şekilde ayarla
        const categoryWithParent = {
          ...category,
          id: realId,
          parent: parentCategory || category.parent // Children'dan geliyorsa parent'ı ayarla
        }
        
        // Map'e ekle (otomatik olarak duplicate'ları önler)
        if (!allCategories.has(realId)) {
          allCategories.set(realId, categoryWithParent)
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Collected category with parent:', {
              id: realId,
              name: category.name,
              depth,
              parentName: parentCategory?.name || 'No parent',
              hasChildren: !!(category.children && category.children.length > 0)
            })
          }
        }
        
        // Children'ları recursive olarak işle (bu kategoriyi parent olarak geç)
        if (category.children && category.children.length > 0) {
          collectAllCategories(category.children, depth + 1, categoryWithParent)
        }
      })
    }
    
    // Tüm kategorileri topla
    collectAllCategories(categoriesData.categories)
    
    // Şimdi parent olabilecek kategorileri filtrele ve hierarchy path oluştur
    const potentialParents: Array<Category & {hierarchyPath: string, displayLevel: number}> = []
    
    // Helper function: Get full hierarchy path (based on working table implementation)
    const getFullHierarchyPath = (cat: Category, visited = new Set<string>()): string => {
      // Circular reference protection
      if (cat.id && visited.has(cat.id)) {
        return cat.name || ''
      }
      
      if (cat.id) {
        visited.add(cat.id)
      }
      
      const path: string[] = []
      
      // Parent chain'i oluştur
      if (cat.parent) {
        if (typeof cat.parent === 'object' && cat.parent.name) {
          // Parent populate edilmiş - recursive olarak git
          const parentPath = getFullHierarchyPath(cat.parent, visited)
          if (parentPath) {
            // Parent path'i split edip tüm parçalarını ekle
            const parentParts = parentPath.split(' > ')
            path.push(...parentParts)
          }
        }
        // Parent sadece ID ise, Map'ten bul
        else if (typeof cat.parent === 'string') {
          const parentCategory = allCategories.get(cat.parent)
          if (parentCategory && parentCategory.name && !visited.has(cat.parent)) {
            const parentPath = getFullHierarchyPath(parentCategory, visited)
            if (parentPath) {
              // Parent path'i split edip tüm parçalarını ekle
              const parentParts = parentPath.split(' > ')
              path.push(...parentParts)
            }
          }
        }
      }
      
      // En son bu kategorinin adını ekle
      if (cat.name) {
        path.push(cat.name)
      }
      
      return path.join(' > ')
    }
    
    allCategories.forEach((category) => {
      const hierarchyPath = getFullHierarchyPath(category)
      const hierarchyParts = hierarchyPath.split(' > ')
      const displayLevel = hierarchyParts.length - 1 // 0 = root level
      
      // Debug: hierarchy path oluşumunu kontrol et
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Building hierarchy for category:', {
          categoryName: category.name,
          categoryId: category.id,
          parentType: typeof category.parent,
          parentData: category.parent,
          finalHierarchyPath: hierarchyPath,
          hierarchyParts,
          displayLevel
        })
      }
      
      if (hierarchyPath && hierarchyPath.trim() !== '') {
        potentialParents.push({
          ...category,
          hierarchyPath,
          displayLevel
        })
      }
    })
    
    // Hierarchy-based sorting: Ana kategoriler önce, sonra alt kategoriler
    potentialParents.sort((a, b) => {
      // Önce level'a göre (0, 1, 2...)
      const levelA = a.level || 0
      const levelB = b.level || 0
      
      if (levelA !== levelB) {
        return levelA - levelB
      }
      
      // Aynı level'da ise, hierarchy path'in ilk kısmına göre grupla
      // Örn: "Elektronik → Arduino" ve "Elektronik → Kartlar" aynı grupta
      const getRoot = (path: string) => path.split(' > ')[0]
      const rootA = getRoot(a.hierarchyPath)
      const rootB = getRoot(b.hierarchyPath)
      
      if (rootA !== rootB) {
        return rootA.localeCompare(rootB)
      }
      
      // Aynı root'ta ise full path'e göre sırala
      return a.hierarchyPath.localeCompare(b.hierarchyPath)
    })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Parent categories processed:', {
        totalCategories: allCategories.size,
        availableParents: potentialParents.length,
        circularReferencesAvoided: visited.size - allCategories.size
      })
    }
    
    // id bazlı dedupe (SelectItem value çakışmalarını önlemek için)
    const uniq = new Map<string, typeof potentialParents[number]>()
    potentialParents.forEach(p => { if (p.id && !uniq.has(p.id)) uniq.set(p.id, p) })
    return Array.from(uniq.values())
  }, [categoriesData])

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları kabul edilir')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resim boyutu en fazla 5MB olabilir')
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage({
          url: event.target.result as string,
          alt: file.name
        })
      }
    }
    reader.readAsDataURL(file)
  }

  // Handle form submission
  const onSubmit = async (data: CategoryFormData) => {
    try {
      let imageData = uploadedImage

      // Upload image if exists
      if (imageFile) {
        try {
          console.log('📤 Uploading image:', imageFile.name)
          const uploadResult = await uploadImage.mutateAsync({ file: imageFile })
          imageData = {
            url: uploadResult.url,
            alt: data.name
          }
          console.log('✅ Image uploaded successfully:', uploadResult.url)
        } catch (imageError) {
          console.error('❌ Image upload failed:', imageError)
          
          // Image upload başarısız oldu ama kategori oluşturmaya devam et
          toast.error('Resim yüklenemedi, kategori resim olmadan oluşturulacak')
          imageData = null // Resim olmadan devam et
        }
      }

      // Create category (with or without image)
      console.log('📝 Creating category:', {
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        parent: data.parent || undefined,
        isActive: data.isActive,
        isVisible: data.isVisible,
        isFeatured: data.isFeatured,
        showInMenu: data.showInMenu,
        showInFooter: data.showInFooter,
        sortOrder: data.sortOrder,
        icon: data.icon || undefined,
        hasImage: !!imageData,
      })

      await createCategory.mutateAsync({
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        parent: data.parent || undefined,
        isActive: data.isActive,
        isVisible: data.isVisible,
        isFeatured: data.isFeatured,
        showInMenu: data.showInMenu,
        showInFooter: data.showInFooter,
        sortOrder: data.sortOrder,
        icon: data.icon || undefined,
        image: imageData || undefined,
        seo: {
          title: data.seoTitle || undefined,
          description: data.seoDescription || undefined,
          keywords: data.seoKeywords ? data.seoKeywords.split(',').map(k => k.trim()).filter(k => k) : undefined,
        }
      })

      toast.success('Kategori başarıyla oluşturuldu')
      router.push('/admin/categories')
    } catch (error) {
      console.error('❌ Category creation error:', error)
      
      // Hata tipine göre mesaj ver
      const apiError = error as any
      if (apiError?.response?.status === 500) {
        toast.error('Sunucu hatası oluştu. Lütfen tekrar deneyin.')
      } else if (apiError?.response?.status === 400) {
        toast.error('Form verileri hatalı. Lütfen kontrol edin.')
      } else if (apiError?.response?.data?.message) {
        toast.error(apiError.response.data.message)
      } else {
        toast.error('Kategori oluşturulurken bir hata oluştu')
      }
    }
  }

  const handleBack = () => {
    router.push('/admin/categories')
  }

  // Preview data
  const previewData = {
    name: watchedName || 'Kategori Adı',
    slug: watchedSlug || 'kategori-adi',
    description: watch('description') || 'Kategori açıklaması...',
    image: uploadedImage,
    isActive: watch('isActive'),
    isVisible: watch('isVisible'),
    isFeatured: watch('isFeatured'),
    showInMenu: watch('showInMenu'),
    showInFooter: watch('showInFooter'),
    sortOrder: watch('sortOrder'),
    icon: watch('icon'),
    parent: watch('parent'),
    seoTitle: watch('seoTitle') || watchedName,
    seoDescription: watch('seoDescription'),
    seoKeywords: watch('seoKeywords'),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yeni Kategori</h1>
            <p className="text-muted-foreground">
              Yeni bir ürün kategorisi oluşturun
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Düzenleme' : 'Önizleme'}
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Kaydediliyor...' : 'Kategori Oluştur'}
          </Button>
        </div>
      </div>

      {isPreviewMode ? (
        // Preview Mode
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kategori Önizlemesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                {previewData.image ? (
                  <img 
                    src={previewData.image.url} 
                    alt={previewData.image.alt}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                    {previewData.icon ? (
                      <span className="text-2xl" title={previewData.icon}>
                        {previewData.icon.startsWith('fa-') ? '🎯' : 
                         previewData.icon.startsWith('mdi-') ? '🔧' : '📂'}
                      </span>
                    ) : (
                      <Folder className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-semibold">{previewData.name}</h3>
                    
                    {/* Status badges */}
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={previewData.isActive ? 'default' : 'secondary'}>
                        {previewData.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                      
                      {previewData.isFeatured && (
                        <Badge variant="default" className="bg-yellow-500">
                          Öne Çıkan
                        </Badge>
                      )}
                      
                      {!previewData.isVisible && (
                        <Badge variant="secondary">
                          Gizli
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    /{previewData.slug}
                    {previewData.sortOrder > 0 && (
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                        Sıralama: {previewData.sortOrder}
                      </span>
                    )}
                  </p>
                  
                  <p className="text-gray-600 mt-1">{previewData.description}</p>
                  
                  {/* Icon bilgisi */}
                  {previewData.icon && (
                    <p className="text-xs text-gray-500 mt-1">
                      İkon: {previewData.icon}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Görünüm ayarları */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: previewData.showInMenu ? '#10b981' : '#ef4444' }}></span>
                    Menüde: {previewData.showInMenu ? 'Evet' : 'Hayır'}
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: previewData.showInFooter ? '#10b981' : '#ef4444' }}></span>
                    Footer'da: {previewData.showInFooter ? 'Evet' : 'Hayır'}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: previewData.isVisible ? '#10b981' : '#ef4444' }}></span>
                    Görünür: {previewData.isVisible ? 'Evet' : 'Hayır'}
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: previewData.isFeatured ? '#10b981' : '#ef4444' }}></span>
                    Öne Çıkan: {previewData.isFeatured ? 'Evet' : 'Hayır'}
                  </div>
                </div>
              </div>
              
              {previewData.parent && (
                <div>
                  <Label className="text-sm font-medium">Üst Kategori</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded border">
                    {(() => {
                      const parentCategory = parentCategories.find(cat => cat.id === previewData.parent)
                      if (!parentCategory) return <span className="text-gray-500">Kategori bulunamadı</span>
                      
                      return (
                        <div className="flex items-center">
                          {/* Level icon */}
                          {parentCategory.displayLevel === 0 ? (
                            <Folder className="h-4 w-4 mr-2 text-blue-500" />
                          ) : parentCategory.displayLevel === 1 ? (
                            <div className="h-4 w-4 mr-2 rounded border-2 border-green-500 bg-green-50"></div>
                          ) : (
                            <div className="h-3 w-3 mr-2 ml-1 rounded-full bg-orange-400"></div>
                          )}
                          
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {parentCategory.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {parentCategory.hierarchyPath}
                            </div>
                          </div>
                          
                          <Badge variant="outline" className="text-xs">
                            L{parentCategory.level || 0}
                          </Badge>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* SEO Preview */}
              <Separator />
              <div>
                <Label className="text-sm font-medium">SEO Önizlemesi</Label>
                <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                  <div className="text-blue-600 text-lg font-medium">
                    {previewData.seoTitle || previewData.name}
                  </div>
                  <div className="text-green-600 text-sm">
                    example.com/kategori/{previewData.slug}
                  </div>
                  <div className="text-gray-700 text-sm mt-1">
                    {previewData.seoDescription || 'SEO açıklaması girilmedi'}
                  </div>
                  
                  {/* Keywords */}
                  {previewData.seoKeywords && previewData.seoKeywords.trim() && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Anahtar Kelimeler:</div>
                      <div className="flex flex-wrap gap-1">
                        {previewData.seoKeywords.split(',').map((keyword, index) => {
                          const trimmedKeyword = keyword.trim()
                          return trimmedKeyword ? (
                            <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {trimmedKeyword}
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Form Mode
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Temel Bilgiler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kategori Adı *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Örn: Elektronik Komponentler"
                              {...field}
                              onChange={(e) => {
                              field.onChange(e); 
                              handleNameChange(e.target.value); 
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Slug *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="elektronik-komponentler"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            URL'de görünecek isim. Otomatik oluşturulur.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Açıklama</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Kategori açıklaması..."
                              className="min-h-[100px]"
                              maxLength={500}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Maksimum 500 karakter
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İkon</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Örn: fa-laptop, mdi-cpu-64-bit"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            FontAwesome, Material Design veya diğer ikon kütüphanelerinden ikon adı
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* SEO Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      SEO Ayarları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="seoTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Başlığı</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Otomatik oluşturulur"
                              maxLength={60}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Arama motorlarında görünecek başlık (maks. 60 karakter)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seoDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Açıklaması</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Kategori hakkında kısa açıklama"
                              maxLength={160}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Arama sonuçlarında görünecek açıklama (maks. 160 karakter)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seoKeywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anahtar Kelimeler</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="elektronik, komponent, arduino"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Virgülle ayrılmış anahtar kelimeler
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status & Hierarchy */}
                <Card>
                  <CardHeader>
                    <CardTitle>Durum ve Hiyerarşi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Aktif Durum</FormLabel>
                            <FormDescription>
                              Kategoriyi sitede aktif yap
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isVisible"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Görünür</FormLabel>
                            <FormDescription>
                              Kategoriyi kullanıcılara göster
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sıralama</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Küçük sayılar önce görünür (0 = en üst)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parent"
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormLabel>Üst Kategori</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} 
                              value={field.value || "none"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Ana kategori (isteğe bağlı)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[300px]">
                                <SelectItem value="none" className="py-3">
                                  <div className="flex items-center">
                                    <Folder className="h-4 w-4 mr-2 text-blue-500" />
                                    <span className="font-medium">Ana Kategori</span>
                                    <span className="ml-2 text-xs text-gray-400">(Üst seviye kategori)</span>
                                  </div>
                                </SelectItem>
                                {parentCategories.map((category, index) => (
                                  <SelectItem key={`${category.id}-${index}`} value={category.id} className="py-3">
                                    <div className="flex items-start w-full">
                                      {/* Level icon */}
                                      <div className="flex-shrink-0 mt-0.5">
                                        {category.displayLevel === 0 ? (
                                          <Folder className="h-4 w-4 mr-3 text-blue-500" />
                                        ) : category.displayLevel === 1 ? (
                                          <div className="h-4 w-4 mr-3 rounded border-2 border-green-500 bg-green-50"></div>
                                        ) : (
                                          <div className="h-3 w-3 mr-3 mt-0.5 rounded-full bg-orange-400"></div>
                                        )}
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        {/* Full hierarchy path */}
                                        <div className="text-sm font-medium text-gray-900 leading-tight">
                                          {category.hierarchyPath}
                                        </div>
                                        
                                        {/* Level indicator and info */}
                                        <div className="flex items-center mt-1 space-x-2">
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                            Level {category.level || 0}
                                          </span>
                                          {category.displayLevel > 0 && (
                                            <span className="text-xs text-gray-500">
                                              Alt kategori
                                            </span>
                                          )}
                                          {category.displayLevel === 0 && (
                                            <span className="text-xs text-blue-600">
                                              Ana kategori
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Bu kategoriyi bir üst kategorinin altına ekleyin. Hiyerarşi: Ana &gt; Alt &gt; Alt-Alt
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )
                      }}
                    />
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
                    <FormField
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Öne Çıkan</FormLabel>
                            <FormDescription>
                              Anasayfada öne çıkar
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showInMenu"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Menüde Göster</FormLabel>
                            <FormDescription>
                              Ana navigasyon menüsünde görünür
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showInFooter"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Footer'da Göster</FormLabel>
                            <FormDescription>
                              Sayfa altında görünür
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Image Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ImageIcon className="h-5 w-5 mr-2" />
                      Kategori Resmi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {uploadedImage ? (
                      <div className="relative">
                        <img 
                          src={uploadedImage.url} 
                          alt={uploadedImage.alt}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setUploadedImage(null)
                            setImageFile(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <div className="text-sm font-medium text-blue-600 hover:text-blue-500">
                              Resim yükle
                            </div>
                            <div className="text-xs text-gray-500">
                              PNG, JPG, GIF (maks. 5MB)
                            </div>
                          </Label>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
} 