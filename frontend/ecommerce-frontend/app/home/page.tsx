"use client"

import { useState, useEffect } from "react"
import { useCategories } from "@/hooks/useCategories"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ShoppingCart,
  Star,
  Truck,
  Shield,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Package,
  Zap,
  TrendingUp,
} from "lucide-react"
import ProductCard from "../components/ProductCard"
import { useFeaturedProducts, useBestsellers, useNewProducts, useBundles } from "@/lib/hooks/useProducts"
import { useAuthStore } from '@/lib/store/authStore'
const categories = [
  {
    name: "Elektronik Komponentler",
    description: "Dirençler, kapasitörler, sensörler ve daha fazlası",
    image: "/placeholder.svg?height=200&width=300",
    href: "/kategori/elektronik",
    count: "500+ Ürün",
  },
  {
    name: "Geliştirme Kitleri",
    description: "Arduino, Raspberry Pi ve öğrenme kitleri",
    image: "/placeholder.svg?height=200&width=300",
    href: "/kategori/kitler",
    count: "150+ Kit",
  },
  {
    name: "Hobi Malzemeleri",
    description: "Maker projeleri için gerekli tüm malzemeler",
    image: "/placeholder.svg?height=200&width=300",
    href: "/kategori/hobi",
    count: "300+ Ürün",
  },
  {
    name: "3D Baskı",
    description: "3D yazıcılar, filamentler ve aksesuarlar",
    image: "/placeholder.svg?height=200&width=300",
    href: "/kategori/3d-baski",
    count: "200+ Ürün",
  },
  {
    name: "Hediyelik Ürünler",
    description: "Teknoloji severlere özel hediye fikirleri",
    image: "/placeholder.svg?height=200&width=300",
    href: "/kategori/hediye",
    count: "100+ Hediye",
  },
  {
    name: "Set ve Paketler",
    description: "Özel olarak hazırlanmış ürün setleri",
    image: "/placeholder.svg?height=200&width=300",
    href: "/kategori/setler",
    count: "50+ Set",
  },
]

// Hero images array'ini ekle
const heroImages = [
  {
    src: "/hero/arduino.jpg",
    alt: "Arduino ve Elektronik Komponentler",
    title: "Arduino Dünyası",
  },
  {
    src: "/hero/3d-baski.jpg",
    alt: "3D Yazıcı ve Filamentler",
    title: "3D Baskı Teknolojisi",
  },
  {
    src: "/hero/raspberry-pi.jpeg",
    alt: "Raspberry Pi Projeleri",
    title: "Raspberry Pi Ekosistemi",
  },
  {
    src: "/hero/maker.jpg",
    alt: "Hobi ve Maker Projeleri",
    title: "Maker Projeleri",
  },
]

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { user, isAuthenticated } = useAuthStore()
  // Data fetching with hooks
  const { data: featuredData, isLoading: featuredLoading } = useFeaturedProducts()
  const { data: bestsellersData, isLoading: bestsellersLoading } = useBestsellers(8)
  const { data: newProductsData, isLoading: newProductsLoading } = useNewProducts(8)
  const { data: bundlesData, isLoading: bundlesLoading } = useBundles(8)
  // Auto-slide effect

  const {categories, loading, error} = useCategories('/categories?level=0')

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1))
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index)
  }

  const goToPrevious = () => {
    setCurrentImageIndex(currentImageIndex === 0 ? heroImages.length - 1 : currentImageIndex - 1)
  }

  const goToNext = () => {
    setCurrentImageIndex(currentImageIndex === heroImages.length - 1 ? 0 : currentImageIndex + 1)
  }

  // Loading skeleton component
  const ProductSkeleton = () => (
    <Card>
      <CardContent className="p-0">
        <Skeleton className="aspect-square rounded-t-lg" />
        <div className="p-4">
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-4 mb-2 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[320px] md:h-[420px] lg:h-[480px] w-full overflow-hidden">
        {/* Slide görseli */}
        <Image
          src={heroImages[currentImageIndex].src}
          alt={heroImages[currentImageIndex].alt}
          fill
          priority
          className="object-cover"
        />
        {/* Karartma overlay */}
        <div className="absolute inset-0 bg-black/40" />
        {/* İçerik */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl text-white space-y-5">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">
              Türkiye'nin En Yenilikçi 
                <span className="block text-primary">Teknoloji Mağazası</span>
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-white/90">
                Arduino, Raspberry Pi, 3D baskı ve daha fazlası. Projelerini bugün başlat.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-primary text-primary-foreground hover:opacity-90" asChild>
                  <Link href="/urunler">
                  <ShoppingCart className="mr-2 h-5 w-5 text-black" /> 
                    <span className="text-black">Ürünleri Keşfet</span>
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" className="bg-white/90 text-gray-900 hover:bg-white" asChild>
                  <Link href="/kategori/kitler">
                    <Package className="mr-2 h-5 w-5" /> Öğrenme Kitleri
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Başlık etiketi */}
        <div className="absolute bottom-4 left-4 text-white/90 text-sm md:text-base">
          {heroImages[currentImageIndex].title}
        </div>
        {/* Oklar */}
        <button
          aria-label="Önceki"
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          aria-label="Sonraki"
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition"
          onClick={goToNext}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        {/* Noktalar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              aria-label={`Slide ${index+1}`}
              className={`w-2.5 h-2.5 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/60'} hover:bg-white transition`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </section>

      {/* Öne Çıkan Ürünler Bölümü */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Öne Çıkan Ürünler</h2>
            <p className="text-gray-600 text-lg">En popüler ve kaliteli ürünlerimizi keşfedin</p>
          </div>

          <Tabs defaultValue="featured" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="featured">Öne Çıkanlar</TabsTrigger>
              <TabsTrigger value="bestsellers">En Çok Satanlar</TabsTrigger>
              <TabsTrigger value="new">Yeni Ürünler</TabsTrigger>
              <TabsTrigger value="bundles">Set ve Paketler</TabsTrigger>
            </TabsList>

            <TabsContent value="featured">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredLoading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <ProductSkeleton key={index} />
                  ))
                ) : featuredData?.data?.products?.length ? (
                  featuredData.data.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="grid"
                      showQuickView={true}
                      isFavorite={user?.favorites && user.favorites.some(favProduct => favProduct.id === product.id) || false}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Öne çıkan ürün bulunamadı</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bestsellers">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestsellersLoading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <ProductSkeleton key={index} />
                  ))
                ) : bestsellersData?.data?.products?.length ? (
                  bestsellersData.data.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="grid"
                      showQuickView={true}
                      isFavorite={user?.favorites && user.favorites.some(favProduct => favProduct.id === product.id) || false}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">En çok satan ürün bulunamadı</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="new">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {newProductsLoading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <ProductSkeleton key={index} />
                  ))
                ) : newProductsData?.data?.products?.length ? (
                  newProductsData.data.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="grid"
                      showQuickView={true}
                      isFavorite={user?.favorites && user.favorites.some(favProduct => favProduct.id === product.id) || false}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Yeni ürün bulunamadı</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bundles">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {bundlesLoading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <ProductSkeleton key={index} />
                  ))
                ) : bundlesData?.data?.products?.length ? (
                  bundlesData.data.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="grid"
                      showQuickView={true}
                      isFavorite={user?.favorites && user.favorites.some(favProduct => favProduct.id === product.id) || false}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">Set ve paket bulunamadı</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/urunler">
                Tüm Ürünleri Görüntüle
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Kategoriler */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Kategoriler</h2>
              <p className="text-gray-600 text-lg">İhtiyacınıza uygun kategorileri keşfedin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="h-[300px] animate-pulse bg-gray-100" />
                ))
              ) : error ? (
                <div className="col-span-full text-center text-red-500">
                  {error}
                </div>
              ) : categories.length ? (
                categories.map((category: any, index: number) => (
                  <Card
                    key={category._id || index}
                    className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <CardHeader className="p-0">
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={category.image?.url ? category.image?.url : '/placeholder.svg'}
                          alt={category.image?.alt || category.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 text-white">
                          <Badge variant="secondary" className="mb-2">
                            {category.stats?.productCount || 0}
                          </Badge>
                          <h3 className="text-xl font-semibold">{category.name}</h3>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-gray-600 mb-4">{category.description}</p>
                      <Button asChild className="w-full">
                        <Link href={`/kategori/${category.slug}`}>
                          Kategoriye Git
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">Hiç kategori bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )

      {/* Özellikler/Avantajlar */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Neden Açık Atölye?</h2>
            <p className="text-gray-600 text-lg">Size en iyi hizmeti sunmak için buradayız</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Hızlı Kargo</h3>
              <p className="text-gray-600">50₺ üzeri alışverişlerde ücretsiz kargo. Aynı gün kargo seçeneği.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Kalite Garantisi</h3>
              <p className="text-gray-600">Tüm ürünlerimiz orijinal ve kaliteli. 30 gün iade garantisi.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">7/24 Destek</h3>
              <p className="text-gray-600">Teknik destek ve müşteri hizmetlerimiz her zaman yanınızda.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 