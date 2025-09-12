# 📝 Forms & Validation (Form Yönetimi ve Doğrulama)

## 📋 Genel Bakış

Açık Atölye projesi **React Hook Form** + **Zod** kombinasyonu ile güçlü form yönetimi ve validasyon sistemi kullanır. Type-safe, performanslı ve kullanıcı dostu form deneyimi sağlar.

## 🏗️ Form Architecture

### Teknoloji Stack
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: RHF + Zod integration
- **ShadCN/UI Form**: UI components

### Form Yapısı
```
forms/
├── schemas/              # Zod validation schemas
├── components/           # Form components
├── hooks/               # Custom form hooks
└── utils/               # Form utilities
```

## 🔧 Validation Schemas

### Product Form Schema
```typescript
// lib/validations/product.ts
import { z } from 'zod'

export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Ürün adı en az 3 karakter olmalıdır')
    .max(100, 'Ürün adı en fazla 100 karakter olmalıdır')
    .regex(/^[a-zA-ZığüşöçİĞÜŞÖÇ0-9\s\-.,()]+$/, 'Geçersiz karakter kullanıldı'),
    
  description: z
    .string()
    .min(10, 'Açıklama en az 10 karakter olmalıdır')
    .max(5000, 'Açıklama en fazla 5000 karakter olmalıdır'),
    
  shortDescription: z
    .string()
    .max(200, 'Kısa açıklama en fazla 200 karakter olmalıdır')
    .optional(),
    
  price: z
    .number()
    .min(0.01, 'Fiyat 0\'dan büyük olmalıdır')
    .max(999999.99, 'Fiyat çok yüksek'),
    
  originalPrice: z
    .number()
    .min(0, 'Orijinal fiyat 0 veya daha büyük olmalıdır')
    .optional()
    .refine((val, ctx) => {
      const price = ctx.parent.price
      return !val || val >= price
    }, 'Orijinal fiyat, satış fiyatından düşük olamaz'),
    
  sku: z
    .string()
    .min(3, 'SKU en az 3 karakter olmalıdır')
    .max(50, 'SKU en fazla 50 karakter olmalıdır')
    .regex(/^[A-Z0-9\-]+$/, 'SKU sadece büyük harf, rakam ve tire içerebilir'),
    
  stock: z
    .number()
    .int('Stok miktarı tam sayı olmalıdır')
    .min(0, 'Stok miktarı negatif olamaz')
    .max(10000, 'Stok miktarı çok yüksek'),
    
  categoryId: z
    .string()
    .min(1, 'Kategori seçiniz'),
    
  brandId: z
    .string()
    .optional(),
    
  images: z
    .array(z.string().url('Geçerli bir URL olmalıdır'))
    .min(1, 'En az bir resim ekleyin')
    .max(10, 'En fazla 10 resim ekleyebilirsiniz'),
    
  tags: z
    .array(z.string())
    .max(10, 'En fazla 10 etiket ekleyebilirsiniz'),
    
  specifications: z
    .array(z.object({
      key: z.string().min(1, 'Özellik adı boş olamaz'),
      value: z.string().min(1, 'Özellik değeri boş olamaz')
    }))
    .optional(),
    
  metaTitle: z
    .string()
    .max(60, 'Meta title en fazla 60 karakter olmalıdır')
    .optional(),
    
  metaDescription: z
    .string()
    .max(160, 'Meta description en fazla 160 karakter olmalıdır')
    .optional(),
    
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

export type ProductFormData = z.infer<typeof productSchema>
```

### Auth Form Schemas
```typescript
// lib/validations/auth.ts
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email adresi gereklidir')
    .email('Geçerli bir email adresi giriniz'),
    
  password: z
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır'),
    
  rememberMe: z.boolean().optional(),
})

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(50, 'Ad en fazla 50 karakter olmalıdır')
    .regex(/^[a-zA-ZığüşöçİĞÜŞÖÇ\s]+$/, 'Ad sadece harf içerebilir'),
    
  email: z
    .string()
    .min(1, 'Email adresi gereklidir')
    .email('Geçerli bir email adresi giriniz'),
    
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/[A-Z]/, 'En az bir büyük harf içermelidir')
    .regex(/[a-z]/, 'En az bir küçük harf içermelidir')
    .regex(/[0-9]/, 'En az bir rakam içermelidir')
    .regex(/[^A-Za-z0-9]/, 'En az bir özel karakter içermelidir'),
    
  confirmPassword: z.string(),
  
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'Kullanım şartlarını kabul etmelisiniz'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email adresi gereklidir')
    .email('Geçerli bir email adresi giriniz'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
```

### Category Form Schema
```typescript
// lib/validations/category.ts
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'Kategori adı en az 2 karakter olmalıdır')
    .max(50, 'Kategori adı en fazla 50 karakter olmalıdır'),
    
  description: z
    .string()
    .max(500, 'Açıklama en fazla 500 karakter olmalıdır')
    .optional(),
    
  parentId: z
    .string()
    .optional(),
    
  image: z
    .string()
    .url('Geçerli bir URL olmalıdır')
    .optional(),
    
  icon: z
    .string()
    .optional(),
    
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  
  seo: z.object({
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    slug: z.string().regex(/^[a-z0-9\-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir').optional(),
  }).optional(),
})

export type CategoryFormData = z.infer<typeof categorySchema>
```

## 📱 Form Components

### Product Form Component
```typescript
// components/forms/ProductForm.tsx
interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => void
  isLoading?: boolean
}

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      shortDescription: '',
      price: 0,
      originalPrice: 0,
      sku: '',
      stock: 0,
      categoryId: '',
      brandId: '',
      images: [],
      tags: [],
      specifications: [],
      isActive: true,
      isFeatured: false,
      ...initialData,
    },
  })

  // Watch for price changes to auto-calculate discount
  const price = form.watch('price')
  const originalPrice = form.watch('originalPrice')
  
  const handleSubmit = (data: ProductFormData) => {
    // Auto-generate slug if not provided
    if (!data.metaTitle) {
      data.metaTitle = data.name
    }
    
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Temel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ürün Adı *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ürün adını giriniz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="PROD-001" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Ürün stok kodu (büyük harf, rakam ve tire)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ürün açıklamasını giriniz"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Ürünün detaylı açıklaması (min 10 karakter)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Kısa Açıklama</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ürünün kısa açıklaması"
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Ürün kartlarında gösterilecek kısa açıklama
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Fiyat Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Satış Fiyatı *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="originalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orijinal Fiyat</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    İndirim hesabı için kullanılır
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {originalPrice > price && originalPrice > 0 && (
                  <div>
                    <span className="text-green-600 font-medium">
                      %{Math.round(((originalPrice - price) / originalPrice) * 100)} indirim
                    </span>
                    <div className="text-xs">
                      {formatPrice(originalPrice - price)} tasarruf
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category & Brand */}
        <Card>
          <CardHeader>
            <CardTitle>Kategori ve Marka</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategorySelect 
              control={form.control}
              name="categoryId"
            />
            
            <BrandSelect 
              control={form.control}
              name="brandId"
            />
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Ürün Resimleri</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload 
              control={form.control}
              name="images"
              maxImages={10}
            />
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Teknik Özellikler</CardTitle>
          </CardHeader>
          <CardContent>
            <SpecificationsInput 
              control={form.control}
              name="specifications"
            />
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Başlık</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="SEO başlığı"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Google arama sonuçlarında görünecek başlık (max 60 karakter)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Açıklama</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="SEO açıklaması"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Google arama sonuçlarında görünecek açıklama (max 160 karakter)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Ürün Ayarları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Aktif</FormLabel>
                    <FormDescription>
                      Ürün web sitesinde görünür olsun
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
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Öne Çıkarılmış</FormLabel>
                    <FormDescription>
                      Ürün ana sayfada öne çıkarılsın
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

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline">
            İptal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              'Kaydet'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

## 🧩 Custom Form Components

### Category Select Component
```typescript
// components/forms/CategorySelect.tsx
interface CategorySelectProps {
  control: Control<any>
  name: string
}

export function CategorySelect({ control, name }: CategorySelectProps) {
  const { data: categoriesData, isLoading } = useCategories()
  
  const categories = categoriesData?.data?.categories || []
  
  // Build hierarchical options
  const buildCategoryOptions = (categories: Category[], level = 0): SelectOption[] => {
    return categories.reduce((acc: SelectOption[], category) => {
      acc.push({
        value: category.id,
        label: '  '.repeat(level) + category.name,
        disabled: false,
      })
      
      if (category.children?.length) {
        acc.push(...buildCategoryOptions(category.children, level + 1))
      }
      
      return acc
    }, [])
  }
  
  const categoryOptions = buildCategoryOptions(categories)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Kategori *</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçiniz" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  Yükleniyor...
                </SelectItem>
              ) : (
                categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
```

### Image Upload Component
```typescript
// components/forms/ImageUpload.tsx
interface ImageUploadProps {
  control: Control<any>
  name: string
  maxImages?: number
}

export function ImageUpload({ control, name, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('image', file)
        
        const response = await apiClient.post('/admin/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        return response.data.data.url
      })
      
      const urls = await Promise.all(uploadPromises)
      
      const currentImages = control._getWatch(name) || []
      control._setValue(name, [...currentImages, ...urls])
      
      toast.success(`${urls.length} resim yüklendi`)
    } catch (error) {
      toast.error('Resim yükleme hatası')
    } finally {
      setUploading(false)
    }
  }, [control, name])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: maxImages,
    disabled: uploading,
  })

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Ürün Resimleri *</FormLabel>
          <FormControl>
            <div className="space-y-4">
              {/* Current Images */}
              {field.value?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {field.value.map((url: string, index: number) => (
                    <div key={index} className="relative group">
                      <Image
                        src={url}
                        alt={`Ürün resmi ${index + 1}`}
                        width={200}
                        height={200}
                        className="object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newImages = field.value.filter((_: string, i: number) => i !== index)
                          field.onChange(newImages)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Area */}
              {(!field.value || field.value.length < maxImages) && (
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
                    uploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  {uploading ? (
                    <p className="text-sm text-gray-600">
                      <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                      Yükleniyor...
                    </p>
                  ) : isDragActive ? (
                    <p className="text-sm text-gray-600">Resimleri buraya bırakın...</p>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">Resim yüklemek için tıklayın veya sürükleyin</p>
                      <p className="text-xs">PNG, JPG, GIF, WebP (max 5MB)</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormControl>
          <FormDescription>
            En az 1, en fazla {maxImages} resim yükleyebilirsiniz
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
```

## 🪝 Custom Form Hooks

### Form State Hook
```typescript
// lib/hooks/useFormState.ts
export function useFormState<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  defaultValues?: Partial<T>
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  })
  
  const handleSubmit = async (
    onSubmit: (data: T) => Promise<void> | void,
    onError?: (error: any) => void
  ) => {
    return form.handleSubmit(async (data) => {
      setIsSubmitting(true)
      setErrors({})
      
      try {
        await onSubmit(data)
      } catch (error: any) {
        if (error.response?.data?.errors) {
          // Server validation errors
          const serverErrors = error.response.data.errors
          Object.keys(serverErrors).forEach(key => {
            form.setError(key as any, {
              message: serverErrors[key][0]
            })
          })
        } else {
          onError?.(error)
        }
      } finally {
        setIsSubmitting(false)
      }
    })
  }
  
  return {
    form,
    isSubmitting,
    errors,
    handleSubmit,
  }
}
```

### Auto-save Hook
```typescript
// lib/hooks/useAutoSave.ts
export function useAutoSave<T>(
  form: UseFormReturn<T>,
  onSave: (data: T) => Promise<void>,
  delay = 2000
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const debouncedSave = useMemo(
    () => debounce(async (data: T) => {
      setIsSaving(true)
      try {
        await onSave(data)
        setLastSaved(new Date())
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }, delay),
    [onSave, delay]
  )
  
  const formData = form.watch()
  
  useEffect(() => {
    if (form.formState.isValid && !form.formState.isSubmitting) {
      debouncedSave(formData)
    }
  }, [formData, form.formState.isValid, form.formState.isSubmitting, debouncedSave])
  
  useEffect(() => {
    return () => {
      debouncedSave.cancel()
    }
  }, [debouncedSave])
  
  return {
    isSaving,
    lastSaved,
  }
}
```

## 🔧 Form Utilities

### Validation Helpers
```typescript
// lib/utils/validation.ts
export const validationHelpers = {
  // Turkish phone number validation
  phoneNumber: (value: string) => {
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/
    return phoneRegex.test(value.replace(/\s/g, ''))
  },
  
  // Turkish ID number validation
  tcNumber: (value: string) => {
    if (!/^[0-9]{11}$/.test(value)) return false
    
    const digits = value.split('').map(Number)
    const checksum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7
    const checksum2 = digits[1] + digits[3] + digits[5] + digits[7]
    const checksum = (checksum1 - checksum2) % 10
    
    return checksum === digits[9] && (digits.reduce((sum, digit) => sum + digit, 0) % 10) === digits[10]
  },
  
  // File size validation
  fileSize: (file: File, maxSizeMB: number) => {
    return file.size <= maxSizeMB * 1024 * 1024
  },
  
  // Image validation
  imageFile: (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    return validTypes.includes(file.type)
  },
  
  // Strong password validation
  strongPassword: (password: string) => {
    const minLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)
    
    return {
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
      checks: { minLength, hasUpper, hasLower, hasNumber, hasSpecial }
    }
  }
}
```

### Form Formatters
```typescript
// lib/utils/formatters.ts
export const formatters = {
  // Currency input formatting
  currency: (value: string) => {
    const number = parseFloat(value.replace(/[^0-9.]/g, ''))
    return isNaN(number) ? '' : number.toFixed(2)
  },
  
  // Phone number formatting
  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
    if (cleaned.length <= 8) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`
  },
  
  // SKU formatting
  sku: (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9\-]/g, '')
  },
  
  // Slug formatting
  slug: (value: string) => {
    return value
      .toLowerCase()
      .replace(/[ğĞıİöÖüÜşŞçÇ]/g, (char) => {
        const map: Record<string, string> = {
          'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'İ': 'i',
          'ö': 'o', 'Ö': 'o', 'ü': 'u', 'Ü': 'u',
          'ş': 's', 'Ş': 's', 'ç': 'c', 'Ç': 'c'
        }
        return map[char] || char
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
```

## 🧪 Form Testing

### Form Validation Tests
```typescript
// __tests__/validation/productSchema.test.ts
import { productSchema } from '@/lib/validations/product'

describe('Product Schema Validation', () => {
  it('should validate valid product data', () => {
    const validData = {
      name: 'Test Product',
      description: 'This is a test product description',
      price: 99.99,
      sku: 'TEST-001',
      stock: 10,
      categoryId: 'cat-1',
      images: ['https://example.com/image.jpg'],
      tags: ['test'],
      isActive: true,
      isFeatured: false,
    }
    
    const result = productSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
  
  it('should reject invalid product data', () => {
    const invalidData = {
      name: 'Te', // Too short
      description: 'Short', // Too short
      price: -10, // Negative
      sku: 'invalid sku', // Invalid format
      stock: -5, // Negative
      categoryId: '', // Empty
      images: [], // Empty array
    }
    
    const result = productSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      expect(result.error.issues).toHaveLength(7)
    }
  })
})
```

### Form Component Tests
```typescript
// __tests__/components/ProductForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductForm } from '@/components/forms/ProductForm'

describe('ProductForm', () => {
  const mockOnSubmit = jest.fn()
  
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })
  
  it('should render all form fields', () => {
    render(<ProductForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText(/ürün adı/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sku/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/açıklama/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/satış fiyatı/i)).toBeInTheDocument()
  })
  
  it('should show validation errors for invalid input', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /kaydet/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/ürün adı en az 3 karakter/i)).toBeInTheDocument()
      expect(screen.getByText(/açıklama en az 10 karakter/i)).toBeInTheDocument()
    })
  })
  
  it('should submit form with valid data', async () => {
    render(<ProductForm onSubmit={mockOnSubmit} />)
    
    fireEvent.change(screen.getByLabelText(/ürün adı/i), {
      target: { value: 'Test Product' }
    })
    fireEvent.change(screen.getByLabelText(/açıklama/i), {
      target: { value: 'This is a test product description' }
    })
    
    const submitButton = screen.getByRole('button', { name: /kaydet/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Product',
          description: 'This is a test product description'
        })
      )
    })
  })
})
```

---

**Son Güncelleme**: Aralık 2024  
**Doküman Versiyonu**: 1.0 