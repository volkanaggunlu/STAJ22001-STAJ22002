"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw, Plus, Minus, Check } from "lucide-react"
import { useParams } from "next/navigation"
import { useProductBySlug, useRelatedProducts, useToggleFavorite } from "@/lib/hooks/useProducts"
import Link from "next/link"
import { useHybridAddToCart } from "@/lib/store/cartStore"

export default function ProductPage() {
  const params = useParams<{ id: string }>()
  const slug = params?.id
  const { data, isLoading, isError } = useProductBySlug(slug)
  const product = data?.data?.product
  const { data: relatedData, isLoading: relatedLoading } = useRelatedProducts(product?.id || "")
  const relatedProducts = relatedData?.data?.products || []

  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const { hybridAddToCart } = useHybridAddToCart()
  const { toggleFavorite, isLoading: isFavoriteLoading } = useToggleFavorite()

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    if (product && newQuantity >= 1 && newQuantity <= (product.stock?.quantity || 1)) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    await hybridAddToCart(product, quantity)
  }

  const handleToggleFavorite = () => {
    if (!product) return
    toggleFavorite(product.id, isWishlisted)
    setIsWishlisted(prev => !prev)
  }

  if (isLoading) {
    // Burada mevcut skeleton veya loading UI'nı kullanabilirsin
    return <div className="container mx-auto px-4 py-8">Yükleniyor...</div>
  }
  if (isError || !product) {
    return <div className="container mx-auto px-4 py-8 text-red-600">Ürün bulunamadı.</div>
  }

  // Aşağıda mock product yerine API'den gelen product kullanılacak
  // Benzer şekilde relatedProducts da dinamik

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <a href="/" className="text-gray-700 hover:text-blue-600">
              Ana Sayfa
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <a href={product.category ? `/kategori/${product.category.slug || product.category}` : '#'} className="text-gray-700 hover:text-blue-600">
                {product.category?.name || "Kategori"}
              </a>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-500">{product.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        {/* Product Images */}
        <div>
          <div className="mb-4">
            <Image
              src={product.images?.[selectedImage]?.url || "/placeholder.svg"}
              alt={product.images?.[selectedImage]?.alt || product.name}
              width={500}
              height={500}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(product.images || []).map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`border-2 rounded-lg overflow-hidden ${selectedImage === index ? "border-blue-500" : "border-gray-200"}`}
              >
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt={image.alt || `${product.name} ${index + 1}`}
                  width={100}
                  height={100}
                  className="w-full h-20 object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-4">
            <Badge variant="outline" className="mb-2">
              {product.category?.name || "Kategori"}
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(product.rating?.average || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
                <span className="ml-2 font-medium">{product.rating?.average?.toFixed(1) || 0}</span>
              </div>
              <span className="text-gray-500 ml-2">({product.rating?.count || 0} değerlendirme)</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-2">
              <span className="text-3xl font-bold text-blue-600">₺{product.price}</span>
              {product.originalPrice && (
                <span className="text-xl text-gray-500 line-through">₺{product.originalPrice}</span>
              )}
              {product.originalPrice && (
                <Badge variant="destructive">
                  %{product.discountPercentage || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)} İndirim
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">KDV Dahil</p>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            {product.stock?.quantity > 0 ? (
              <div className="flex items-center text-green-600">
                <Check className="h-5 w-5 mr-2" />
                <span className="font-medium">Stokta var ({product.stock.quantity} adet)</span>
              </div>
            ) : (
              <div className="text-red-600 font-medium">Stokta yok</div>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center border rounded-lg">
                <Button variant="ghost" size="sm" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product.stock?.quantity || 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-gray-600">Maksimum {product.stock?.quantity || 1} adet</span>
            </div>

            <div className="flex space-x-4">
              <Button size="lg" className="flex-1" disabled={!(product.stock?.quantity > 0)} onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Sepete Ekle - ₺{(product.price * quantity).toFixed(2)}
              </Button>
              <Button variant="outline" size="lg" onClick={handleToggleFavorite} disabled={isFavoriteLoading}>
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center space-x-2 text-sm">
              <Truck className="h-5 w-5 text-green-600" />
              <span>Ücretsiz Kargo</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>2 Yıl Garanti</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              <span>Kolay İade</span>
            </div>
          </div>

          {/* Product Info */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">SKU:</span> {product.sku}
            </p>
            <p>
              <span className="font-medium">Marka:</span> {product.brand}
            </p>
            <p>
              <span className="font-medium">Kategori:</span> {product.category?.name || "Kategori"}
            </p>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs defaultValue="description" className="mb-16">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="description">Açıklama</TabsTrigger>
          <TabsTrigger value="features">Özellikler</TabsTrigger>
          <TabsTrigger value="specifications">Teknik Özellikler</TabsTrigger>
          <TabsTrigger value="reviews">Değerlendirmeler</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Ürün Açıklaması</h3>
              <div className="prose max-w-none">
                <p className="mb-4">{product.description}</p>
                {product.shortDescription && <p className="mb-4">{product.shortDescription}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Özellikler</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {(product.features || []).map((feature: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Teknik Özellikler</h3>
              <div className="space-y-3">
                {(product.specifications || []).map((spec: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">{spec.key}</span>
                    <span className="text-gray-600">{spec.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Müşteri Değerlendirmeleri</h3>
              {/* Yorumlar için ayrı bir hook ile çekilebilir, şimdilik placeholder */}
              <div className="space-y-6">
                <div className="text-gray-500">Yorumlar yakında...</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      <section>
        <h2 className="text-2xl font-bold mb-8">Benzer Ürünler</h2>
        {relatedLoading ? (
          <div>Yükleniyor...</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct: any) => (
              <Card key={relatedProduct._id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="p-0">
                  <Image
                    src={relatedProduct.images?.[0]?.url || "/placeholder.svg"}
                    alt={relatedProduct.images?.[0]?.alt || relatedProduct.name}
                    width={200}
                    height={200}
                    className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                  />
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-2 line-clamp-2">
                    <Link href={`/urun/${relatedProduct.slug}`} className="hover:text-blue-600 transition-colors">
                      {relatedProduct.name}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(relatedProduct.rating?.average || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-sm">{relatedProduct.rating?.average?.toFixed(1) || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-600">₺{relatedProduct.price}</span>
                    <Button size="sm" onClick={() => hybridAddToCart(relatedProduct, 1)} disabled={relatedProduct?.stock?.quantity === 0}>
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Sepete Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
