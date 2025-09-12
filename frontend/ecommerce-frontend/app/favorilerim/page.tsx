"use client"
import { useState, useEffect} from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart,  ShoppingCart,  Star, Search, Grid, List, Trash2, Share2, Filter, Package, X, ArrowLeft, Zap, Loader2,
} from "lucide-react"
import { AlertCircle } from "lucide-react"
import { useHybridAddToCart } from '@/lib/store/cartStore'
import { useUserFavorites } from '@/hooks/useUserFavorites'
import { apiClient } from '@/lib/api/client'
import { setItemsFromApi } from '@/lib/store/cartStore'
import { toast } from 'sonner'

interface FavoriteProduct {
  id: string | number
  slug?: string
  name: string
  brand: string
  category: string | { name: string }
  type: "bundle" | "kit" | "electronic" | string
  image?: string
  price: number
  originalPrice?: number
  discount: number
  rating: number
  reviews: number
  inStock: boolean
  stockCount: number
  addedDate: string
  itemCount?: number
}

interface CategoryItem {
  value : string
  label : string
}

const sortOptions = [
  { value: "newest", label: "En Yeni Eklenen" },
  { value: "oldest", label: "En Eski Eklenen" },
  { value: "price-low", label: "Fiyat: Düşükten Yükseğe" },
  { value: "price-high", label: "Fiyat: Yüksekten Düşüğe" },
  { value: "rating", label: "En Yüksek Puan" },
  { value: "name", label: "İsme Göre A-Z" },
]

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  
  // Auth kontrol effect'i
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem("token")
        setIsAuthenticated(!!token)
      } else {
        setIsAuthenticated(false)
      }
      setAuthChecking(false)
    }
    checkAuth()
  }, [])
  
  const { favorites: rawFavorites, loading: isLoading, error: hookError } = useUserFavorites(isAuthenticated === true)
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)
  const [showOnlyDiscounted, setShowOnlyDiscounted] = useState(false)
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([{ value: "all", label: "Tüm Kategoriler" }])
  const [addToCartLoading, setAddToCartLoading] = useState<{[key: string]: boolean}>({})
  
  // Favori kaldırma loading states
  const [removingFavoriteId, setRemovingFavoriteId] = useState<string | null>(null)
  const [clearingAllFavorites, setClearingAllFavorites] = useState(false)

  const { hybridAddToCart } = useHybridAddToCart()

  // Hook'tan gelen favorileri işle ve state'e set et
  useEffect(() => {
    if (rawFavorites && rawFavorites.length > 0) {
      const mappedFavorites = rawFavorites.map((p: any) => {
        let imageUrl: string | undefined = undefined
        if (Array.isArray(p.images) && p.images.length > 0) {
          if (typeof p.images[0] === 'string') {
            imageUrl = p.images[0]
          } else {
            const primary = p.images.find((img: any) => img?.isPrimary)
            imageUrl = primary?.url || p.images[0]?.url
          }
        }
        return {
          id: p._id,
          slug: p.slug,
          name: p.name,
          brand: p.brand,
          category: p.category?.name || "Bilinmiyor",
          type: p.type || "electronic",
          image: imageUrl || "/placeholder.svg",
          price: p.price,
          originalPrice: p.originalPrice || null,
          discount: p.discountPercentage || 0,
          rating: p.rating?.average || 0,
          reviews: Array.isArray(p.reviews) ? p.reviews.length : 0,
          inStock: p.stock?.quantity > 0,
          stockCount: p.stock?.quantity || 0,
          addedDate: p.publishedAt || new Date().toISOString(),
          itemCount: p.bundleItems?.length || 0,
        }
      })
      setFavorites(mappedFavorites)
    } else if (rawFavorites && rawFavorites.length === 0) {
      setFavorites([])
    }
  }, [rawFavorites])

  // Hook'tan gelen error'ı işle
  useEffect(() => {
    if (hookError) {
      setError(hookError)
    }
  }, [hookError])

  // Kategorileri fetch et - sadece authenticated kullanıcılar için
  useEffect(() => {
    if (isAuthenticated === false) return
    
    async function fetchCategories() {
      try{
        const res = await fetch("http://localhost:8080/api/categories")
        if(!res.ok) throw new Error("Kategoriler alınamadı");
        const response = await res.json();
        const categories = response.data.categories;
        const mainCategories = categories.filter((c: any) => c.level === 0)
        const mappedCategories = mainCategories.map((c: any) => ({
          value: c.name,
          label: c.name,
        }));

        setCategoryList([{ value: "all" , label: "Tüm Kategoriler"}, ...mappedCategories])
      } catch(err){
        console.error("Kategori fetch hatası:", err)
      }
    }
    fetchCategories();
  }, [isAuthenticated]);

  // Tek ürünü favorilerden kaldır
  const removeFavorite = async (id: number | string) => {
    if (removingFavoriteId || !isAuthenticated) return
    
    setRemovingFavoriteId(id.toString())
    
    try {
      // API çağrısı - favoriyi kaldır
      const response = await apiClient.delete(`/users/favorites/${id}`)
      
      if (response.data?.success !== false) {
        // Başarılı - state'ten kaldır
        setFavorites(favorites.filter((item) => item.id !== id))
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [SUCCESS] Ürün favorilerden kaldırıldı:', id)
        }
      } else {
        throw new Error(response.data?.error?.message || 'Favori kaldırılamadı')
      }
    } catch (error: any) {
      console.error("❌ Favori kaldırma hatası:", error)
      setError(error.message || 'Ürün favorilerden kaldırılamadı')
      
      // 3 saniye sonra error mesajını temizle
      setTimeout(() => setError(""), 3000)
    } finally {
      setRemovingFavoriteId(null)
    }
  }

  // Tüm favorileri temizle
  const clearAllFavorites = async () => {
    if (clearingAllFavorites || !isAuthenticated || favorites.length === 0) return
    
    // Kullanıcıdan onay al
    if (!confirm("Tüm favorilerinizi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      return
    }
    
    setClearingAllFavorites(true)
    
    try {
      // API çağrısı - tüm favorileri temizle
      const response = await apiClient.delete('/users/favorites')
      
      if (response.data?.success !== false) {
        // Başarılı - state'i temizle
        setFavorites([])
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [SUCCESS] Tüm favoriler temizlendi')
        }
      } else {
        throw new Error(response.data?.error?.message || 'Favoriler temizlenemedi')
      }
    } catch (error: any) {
      console.error("❌ Tüm favorileri temizleme hatası:", error)
      setError(error.message || 'Favoriler temizlenemedi')
      
      // 3 saniye sonra error mesajını temizle
      setTimeout(() => setError(""), 3000)
    } finally {
      setClearingAllFavorites(false)
    }
  }

  const addToCart = async (id: number | string) => {
    const product = favorites.find(p => p.id === id)
    if (!product || addToCartLoading[id.toString()]) return

    setAddToCartLoading(prev => ({
      ...prev,
      [id.toString()]: true
    }))

    try {
      // FavoriteProduct'ı Product formatına çevir
      const productForCart = {
        ...product,
        slug: product.id.toString(),
        images: [{ url: product.image || "/placeholder.svg", isPrimary: true }],
        rating: {
          average: product.rating,
          count: product.reviews
        },
        stock: {
          quantity: product.stockCount,
          lowStockThreshold: 5
        }
      }
      
      await hybridAddToCart(productForCart as any, 1)
    } catch (error) {
      console.error("Sepete ekleme hatası:", error)
    } finally {
      setAddToCartLoading(prev => ({
        ...prev,
        [id.toString()]: false
      }))
    }
  }

const addAllToCart = async () => {
  const inStockItems = filteredFavorites.filter(item => item.inStock)
  if (!inStockItems.length) return

  // Loading state
  setAddToCartLoading(prev => ({
    ...prev,
    ...Object.fromEntries(inStockItems.map(item => [item.id, true]))
  }))

  try {
    // Toplu ürün ekleme
    const items = inStockItems.map(item => ({ productId: item.id, quantity: 1 }))
    await apiClient.post('/cart', { items })

    const res = await apiClient.get('/cart')
    if (res.data?.success && res.data?.data?.cart) {
      setItemsFromApi(res.data.data.cart)
    }
    inStockItems.forEach(item => {
      toast.success('Ürün sepete eklendi', { description: item.name })
    })

    console.log('✅ Tüm ürünler sepete eklendi')
  } catch (error) {
    setError('Bazı ürünler sepete eklenemedi')
    setTimeout(() => setError(""), 3000)
  } finally {
    // Tüm loading state'leri temizle
    setAddToCartLoading(prev => {
      const newState = { ...prev }
      inStockItems.forEach(item => delete newState[item.id.toString()])
      return newState
    })
  }
}
  // Filtering and sorting
  const filteredFavorites = favorites
    .filter((item) => {
      const itemCategoryName = item.category;
      const categoryMatch = selectedCategory === "all" || itemCategoryName === selectedCategory

      const searchMatch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase())
      const stockMatch = !showOnlyInStock || item.inStock
      const discountMatch = !showOnlyDiscounted || item.discount > 0

      return categoryMatch && searchMatch && stockMatch && discountMatch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        case "oldest":
          return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime()
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const inStockCount = filteredFavorites.filter((item) => item.inStock).length

  // Auth kontrol edilirken loading göster
  if (authChecking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  // Giriş yapmamış kullanıcı için
  if (isAuthenticated === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Ana Sayfa
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">Favorilerim</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Favorilerim</h1>
            <p className="text-gray-600">
              Favorilerinizi görüntülemek için giriş yapmanız gerekiyor
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ana Sayfaya Dön
              </Link>
            </Button>
          </div>
        </div>

        {/* Login Required State */}
        <Card>
          <CardContent className="p-16 text-center">
            <Heart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              Favorilerinizi görüntülemek için giriş yapın
            </h2>
            <p className="text-gray-600 mb-6">
              Giriş yaparak favorilerinize erişebilir ve beğendiğiniz ürünleri kaydedebilirsiniz
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/login">
                  Giriş Yap
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent">
                <Link href="/register">
                  Hesap Oluştur
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated kullanıcı için - favoriler yüklenirken
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Ana Sayfa
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-500">Favorilerim</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Favorilerim</h1>
            <p className="text-gray-600">Favorileriniz yükleniyor...</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/hesabim">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Hesabıma Dön
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        <Card>
          <CardContent className="p-16 text-center">
            <Loader2 className="h-16 w-16 mx-auto text-blue-600 animate-spin mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Favorileriniz Yükleniyor</h2>
            <p className="text-gray-600">Lütfen bekleyin...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 [DEBUG] Favorilerim sayfasında hata:', error);
    }
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 p-4 bg-red-50 text-red-700 rounded">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              Ana Sayfa
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-500">Favorilerim</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Favorilerim</h1>
          <p className="text-gray-600">
            {favorites.length} ürün listelendi • {inStockCount} ürün stokta
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/hesabim">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Hesabıma Dön
            </Link>
          </Button>
          {favorites.length > 0 && (
            <>
              <Button onClick={addAllToCart} disabled={inStockCount === 0}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Tümünü Sepete Ekle ({inStockCount})
              </Button>
              <Button
                variant="outline"
                onClick={clearAllFavorites}
                disabled={clearingAllFavorites}
                className="text-red-600 hover:text-red-700 bg-transparent"
              >
                {clearingAllFavorites ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {clearingAllFavorites ? "Temizleniyor..." : "Tümünü Temizle"}
              </Button>
            </>
          )}
        </div>
      </div>

      {favorites.length === 0 ? (
        /* Empty Favorites State - Authenticated User */
        <Card>
          <CardContent className="p-16 text-center">
            <Heart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Favori listeniz boş</h2>
            <p className="text-gray-600 mb-6">
              Beğendiğiniz ürünleri favorilere ekleyerek daha sonra kolayca bulabilirsiniz
            </p>
            <Button asChild size="lg">
              <Link href="/urunler">
                <Search className="h-4 w-4 mr-2" />
                Ürünleri Keşfet
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters and Controls */}
          <div className="mb-6">
            <Tabs defaultValue="all" className="mb-6">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 max-w-2xl">
                {categoryList.map((category) => (
                  <TabsTrigger
                    key={category.value}
                    value={category.value}
                    className="text-xs lg:text-sm"
                    onClick={() => setSelectedCategory(category.value)}
                  >
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Favorilerde ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={showOnlyInStock ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOnlyInStock(!showOnlyInStock)}
                    className={!showOnlyInStock ? "bg-transparent" : ""}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Stokta Var
                  </Button>
                  <Button
                    variant={showOnlyDiscounted ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOnlyDiscounted(!showOnlyDiscounted)}
                    className={!showOnlyDiscounted ? "bg-transparent" : ""}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    İndirimli
                  </Button>
                </div>
              </div>

              {/* Sort and View Controls */}
              <div className="flex items-center space-x-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {/* Active Filters */}
            {(selectedCategory !== "all" || searchQuery || showOnlyInStock || showOnlyDiscounted) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Aktif Filtreler:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all")
                      setSearchQuery("")
                      setShowOnlyInStock(false)
                      setShowOnlyDiscounted(false)
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Temizle
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedCategory("all")}>
                      {categoryList.find((c) => c.value === selectedCategory)?.label} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery("")}>
                      "{searchQuery}" <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {showOnlyInStock && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setShowOnlyInStock(false)}>
                      Stokta Var <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {showOnlyDiscounted && (
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => setShowOnlyDiscounted(false)}>
                      İndirimli <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Products Grid/List */}
          {filteredFavorites.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Arama kriterlerinize uygun ürün bulunamadı</h3>
                <p className="text-gray-600 mb-4">Filtrelerinizi değiştirmeyi deneyin</p>
                <Button
                  onClick={() => {
                    setSelectedCategory("all")
                    setSearchQuery("")
                    setShowOnlyInStock(false)
                    setShowOnlyDiscounted(false)
                  }}
                >
                  Filtreleri Temizle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div
              className={viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}
            >
              {filteredFavorites.map((product) => (
                <Card
                  key={product.id}
                  className={`group hover:shadow-lg transition-all duration-300 ${
                    viewMode === "list" ? "flex flex-row" : ""
                  }`}
                >
                  <CardHeader className={`p-0 ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                    <div className="relative">
                      <Image
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        width={300}
                        height={300}
                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                          viewMode === "list" ? "w-48 h-48 rounded-l-lg rounded-t-none" : "w-full h-64 rounded-t-lg"
                        }`}
                      />

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.type === "bundle" && (
                          <Badge className="bg-purple-500">
                            <Package className="h-3 w-3 mr-1" />
                            SET
                          </Badge>
                        )}
                        {product.discount > 0 && <Badge variant="destructive">%{product.discount} İndirim</Badge>}
                      </div>

                      {/* Stock Status */}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg">
                          <Badge variant="secondary">Stokta Yok</Badge>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => removeFavorite(product.id)}
                          disabled={removingFavoriteId === product.id.toString()}
                        >
                          {removingFavoriteId === product.id.toString() ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          )}
                        </Button>
                        <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <div className={viewMode === "list" ? "flex-1 flex flex-col" : ""}>
                    <CardContent className={`${viewMode === "list" ? "flex-1" : ""} p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {typeof product.category === "object"  ? product.category?.name || "Kategori bilgisi yok"  : product.category || "Kategori bilgisi yok"}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {product.brand}
                          </Badge>
                          {product.type === "bundle" && (
                            <Badge variant="secondary" className="text-xs">
                              {product.itemCount} Parça
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardTitle className={`mb-2 line-clamp-2 ${viewMode === "list" ? "text-lg" : "text-base"}`}>
                        <Link href={`/urun/${product.slug}`} className="hover:text-blue-600 transition-colors">
                          {product.name}
                        </Link>
                      </CardTitle>

                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 text-sm font-medium">{product.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500 ml-2">({product.reviews} değerlendirme)</span>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-xl font-bold text-blue-600">₺{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through ml-2">₺{product.originalPrice}</span>
                          )}
                        </div>
                      </div>
                      {product.inStock && <p className="text-xs text-green-600">Stokta {product.stockCount} adet</p>}
                    </CardContent>

                    <CardFooter className="p-4 pt-0 flex gap-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        disabled={!product.inStock || addToCartLoading[product.id.toString()]}
                        onClick={() => addToCart(product.id)}
                      >
                        {addToCartLoading[product.id.toString()] ? (
                          <Zap className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ShoppingCart className="h-4 w-4 mr-2" />
                        )}
                        {!product.inStock ? "Stokta Yok" : addToCartLoading[product.id.toString()] ? "Ekleniyor..." : "Sepete Ekle"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => removeFavorite(product.id)}
                        disabled={removingFavoriteId === product.id.toString()}
                      >
                      {removingFavoriteId === product.id.toString() ? ( <Loader2 className="h-4 w-4 animate-spin" />  ) : (  <Trash2 className="h-4 w-4" />  )}
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}