'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Settings, Image as ImageIcon, X, Folder } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAdminCategory, useAdminCategoryTree, useUpdateCategory, useUploadCategoryImage } from '@/lib/hooks/useAdminCategories'
import { AdminGuard } from '@/app/components/ProtectedRoute'

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  parent: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  showInMenu: z.boolean().default(true),
  showInFooter: z.boolean().default(false),
  sortOrder: z.number().min(0).default(0),
  icon: z.string().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

export default function CategoryEditClient({ categoryId }: { categoryId: string }) {
  const router = useRouter()
  const { data, isLoading, error } = useAdminCategory(categoryId)
  const { data: categoryTree } = useAdminCategoryTree()
  const updateCategory = useUpdateCategory()
  const uploadImage = useUploadCategoryImage()

  const [uploadedImage, setUploadedImage] = useState<{ url: string; alt: string } | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '', slug: '', description: '', parent: undefined,
      isActive: true, isVisible: true, isFeatured: false,
      showInMenu: true, showInFooter: false, sortOrder: 0,
      icon: '', seoTitle: '', seoDescription: '', seoKeywords: ''
    }
  })

  useEffect(() => {
    const category = ((data as any)?.data || data) ?? null
    if (!category) return
    console.log("category", category)
    setUploadedImage(category.image || null)
    form.reset({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description ?? '',
      parent: typeof category.parent === 'string' ? category.parent : category.parent?._id || category.parent?.id || undefined,
      isActive: !!category.isActive,
      isVisible: category.isVisible ?? true,
      isFeatured: category.isFeatured ?? false,
      showInMenu: category.showInMenu ?? true,
      showInFooter: category.showInFooter ?? false,
      sortOrder: Number(category.sortOrder ?? 0),
      icon: category.icon ?? '',
      seoTitle: category.seo?.title ?? '',
      seoDescription: category.seo?.description ?? '',
      seoKeywords: Array.isArray(category.seo?.keywords) ? category.seo.keywords.join(', ') : '',
    })
  }, [data])

  const parents = useMemo(() => {
    const list: Array<{ id: string; name: string; hierarchyPath: string; level: number }> = []
    const flatten = (cats: any[], path: string[] = []) => {
      cats?.forEach((c) => {
        const id = c.id || c._id
        if (!id) return
        const nextPath = [...path, c.name]
        list.push({ id, name: c.name, hierarchyPath: nextPath.join(' > '), level: nextPath.length - 1 })
        if (c.children?.length) flatten(c.children, nextPath)
      })
    }
    flatten((categoryTree as any)?.categories || [])
    // Dedupe by id to avoid duplicate SelectItem values
    const uniq = new Map<string, { id: string; name: string; hierarchyPath: string; level: number }>()
    list.forEach(item => { if (!uniq.has(item.id)) uniq.set(item.id, item) })
    return Array.from(uniq.values())
  }, [categoryTree])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Sadece resim dosyaları kabul edilir')
    if (file.size > 5 * 1024 * 1024) return toast.error('Resim boyutu en fazla 5MB olabilir')
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage({ url: event.target.result as string, alt: file.name })
      }
    }
    reader.readAsDataURL(file)
  }

  const onSubmit = async (values: CategoryFormData) => {
    try {
      let imageData = uploadedImage
      if (imageFile) {
        const uploadResult = await uploadImage.mutateAsync({ file: imageFile, categoryId })
        imageData = { url: uploadResult.url, alt: values.name }
      }
      await updateCategory.mutateAsync({
        id: categoryId,
        data: {
          name: values.name,
          slug: values.slug,
          description: values.description || undefined,
          parent: values.parent || undefined,
          isActive: values.isActive,
          isVisible: values.isVisible,
          isFeatured: values.isFeatured,
          showInMenu: values.showInMenu,
          showInFooter: values.showInFooter,
          sortOrder: values.sortOrder,
          icon: values.icon || undefined,
          image: imageData || undefined,
          seo: {
            title: values.seoTitle || undefined,
            description: values.seoDescription || undefined,
            keywords: values.seoKeywords ? values.seoKeywords.split(',').map(k => k.trim()).filter(k => k) : undefined,
          }
        }
      })
      toast.success('Kategori güncellendi')
      router.push('/admin/categories')
    } catch (err) {
      console.error(err)
      toast.error('Güncelleme sırasında hata oluştu')
    }
  }

  const goBack = () => router.push('/admin/categories')

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Geri
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Kategori Düzenle</h1>
              <p className="text-muted-foreground">Kategori bilgilerini güncelleyin</p>
            </div>
          </div>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={updateCategory.isPending}>
            <Save className="h-4 w-4 mr-2" /> {updateCategory.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Temel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori Adı *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>Küçük harf, rakam ve tire içermelidir</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="icon" render={({ field }) => (
                    <FormItem>
                      <FormLabel>İkon</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: fa-laptop, mdi-cpu-64-bit" {...field} />
                      </FormControl>
                      <FormDescription>
                        FontAwesome, Material Design veya diğer ikon kütüphanelerinden ikon adı
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="seoTitle" render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO Başlığı</FormLabel>
                      <FormControl>
                        <Input maxLength={60} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="seoDescription" render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO Açıklaması</FormLabel>
                      <FormControl>
                        <Textarea maxLength={160} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="seoKeywords" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anahtar Kelimeler</FormLabel>
                      <FormControl>
                        <Input placeholder="virgülle ayrılmış" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Durum ve Hiyerarşi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="isActive" render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Aktif Durum</FormLabel>
                        <FormDescription>Kategoriyi sitede aktif yap</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="isVisible" render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Görünür</FormLabel>
                        <FormDescription>Kategoriyi kullanıcılara göster</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="sortOrder" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sıralama</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="parent" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Üst Kategori</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === 'none' ? undefined : v)} value={field.value || 'none'}>
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
                          {parents.map((p, idx) => (
                            <SelectItem key={`${p.id}-${idx}`} value={p.id} className="py-3">
                              <div className="flex items-start w-full">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 leading-tight">
                                    {p.hierarchyPath}
                                  </div>
                                  <div className="flex items-center mt-1 space-x-2">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Level {p.level}</span>
                                    {p.level > 0 ? (
                                      <span className="text-xs text-gray-500">Alt kategori</span>
                                    ) : (
                                      <span className="text-xs text-blue-600">Ana kategori</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Görünüm Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="isFeatured" render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Öne Çıkan</FormLabel>
                        <FormDescription>Anasayfada öne çıkar</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="showInMenu" render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Menüde Göster</FormLabel>
                        <FormDescription>Ana navigasyon menüsünde görünür</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="showInFooter" render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Footer'da Göster</FormLabel>
                        <FormDescription>Sayfa altında görünür</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Görsel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {uploadedImage ? (
                    <div className="relative">
                      <img src={uploadedImage.url} alt={uploadedImage.alt} className="w-full h-32 object-cover rounded-lg" />
                      <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => { setUploadedImage(null); setImageFile(null) }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-500">Resim yükle</div>
                          <div className="text-xs text-gray-500">PNG, JPG, GIF (maks. 5MB)</div>
                        </Label>
                        <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>
      </div>
    </AdminGuard>
  )
} 