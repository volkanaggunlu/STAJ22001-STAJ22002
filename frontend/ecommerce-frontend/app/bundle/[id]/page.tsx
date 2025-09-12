"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw, Plus, Minus, Check, Package } from "lucide-react"

// Mock bundle data
const bundle = {
  id: 1,
  name: "Arduino Mega Öğrenme Seti",
  price: 459.99,
  originalPrice: 529.99,
  images: [
    "/placeholder.svg?height=500&width=500",
    "/placeholder.svg?height=500&width=500",
    "/placeholder.svg?height=500&width=500",
    "/placeholder.svg?height=500&width=500",
  ],
  category: "Bundle",
  type: "kit",
  rating: 4.9,
  reviews: 78,
  inStock: true,
  stockCount: 12,
  sku: "BUNDLE-ARDUINO-MEGA-001",
  description:
    "Arduino Mega ile elektronik dünyasına kapsamlı bir giriş yapın! Bu özel hazırlanmış set, Arduino Mega 2560 kartı ve 15 farklı elektronik komponent ile projelerinizi hayata geçirmenizi sağlar.",
  shortDescription: "Arduino Mega 2560 ve 15 elektronik komponent içeren kapsamlı öğrenme seti",
  discountPercentage: 13,
  itemCount: 15,

  items: [
    {
      id: 1,
      name: "Arduino Mega 2560 R3",
      quantity: 1,
      price: 189.99,
      image: "/placeholder.svg?height=100&width=100",
      description: "54 dijital I/O pinli güçlü mikrodenetleyici kartı",
    },
    {
      id: 2,
      name: "Breadboard 830 Delik",
      quantity: 2,
      price: 19.99,
      image: "/placeholder.svg?height=100&width=100",
      description: "Prototip geliştirme için breadboard",
    },
    {
      id: 3,
      name: "Jumper Kablo Seti",
      quantity: 1,
      price: 24.99,
      image: "/placeholder.svg?height=100&width=100",
      description: "120 adet erkek-erkek, erkek-dişi jumper kablo",
    },
    {
      id: 4,
      name: "LED Seti (5mm)",
      quantity: 1,
      price: 15.99,
      image: "/placeholder.svg?height=100&width=100",
      description: "Kırmızı, yeşil, mavi, sarı, beyaz LED'ler (50 adet)",
    },
    {
      id: 5,
      name: "Direnç Seti",
      quantity: 1,
      price: 12.99,
      image: "/placeholder.svg?height=100&width=100",
      description: "220Ω, 1kΩ, 10kΩ dirençler (100 adet)",
    },
    {
      id: 6,
      name: "Servo Motor SG90",
      quantity: 2,
      price: 29.99,
      image: "/placeholder.svg?height=100&width=100",
      description: "Mikro servo motor 180° dönüş",
    },
    {
      id: 7,
      name: "Ultrasonik Sensör HC-SR04",
      quantity: 1,
      price: 29.99,
      image: "/placeholder.svg?height=100&width=100",
      description: "Mesafe ölçüm sensörü 2-400cm",
    },
    {
      id: 8,
      name: "DHT22 Sıcaklık Nem Sensörü",
      quantity: 1,
      price: 45.99,
      image: "/placeholder.svg?height=100&width=100",
      description: "Yüksek hassasiyetli sıcaklık ve nem sensörü",
    },
  ],

  features: [
    "Arduino Mega 2560 R3 orijinal kartı",
    "15 farklı elektronik komponent",
    "120+ adet jumper kablo",
    "50 adet LED (5 farklı renk)",
    "100 adet direnç seti",
    "2 adet servo motor",
    "Ultrasonik mesafe sensörü",
    "Sıcaklık ve nem sensörü",
    "2 adet breadboard",
    "Detaylı Türkçe proje kılavuzu",
    "Online video eğitim erişimi",
    "Teknik destek",
  ],

  specifications: {
    Mikrodenetleyici: "ATmega2560",
    "Çalışma Voltajı": "5V",
    "Giriş Voltajı": "7-12V",
    "Dijital I/O Pinleri": "54 (15 PWM çıkışı)",
    "Analog Giriş Pinleri": "16",
    "Flash Bellek": "256 KB",
    SRAM: "8 KB",
    EEPROM: "4 KB",
    "Saat Hızı": "16 MHz",
    "Toplam Parça Sayısı": "15 farklı komponent",
    "Proje Sayısı": "25+ örnek proje",
  },
}

const relatedBundles = [
  {
    id: 2,
    name: "IoT Geliştirici Paketi",
    price: 799.99,
    originalPrice: 949.99,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.8,
    itemCount: 12,
  },
  {
    id: 3,
    name: "Robotik Kodlama Seti",
    price: 649.99,
    originalPrice: 749.99,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.6,
    itemCount: 20,
  },
  {
    id: 4,
    name: "Sensör Geliştirme Paketi",
    price: 399.99,
    image: "/placeholder.svg?height=200&width=200",
    rating: 4.7,
    itemCount: 18,
  },
]

export default function BundleDetailPage() {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1 && newQuantity <= bundle.stockCount) {
      setQuantity(newQuantity)
    }
  }

  const totalOriginalPrice = bundle.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const savings = totalOriginalPrice - bundle.price

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
              <a href="/kategori/setler" className="text-gray-700 hover:text-blue-600">
                Set ve Paketler
              </a>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-500">{bundle.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        {/* Bundle Images */}
        <div>
          <div className="mb-4">
            <Image
              src={bundle.images[selectedImage] || "/placeholder.svg"}
              alt={bundle.name}
              width={500}
              height={500}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {bundle.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`border-2 rounded-lg overflow-hidden ${
                  selectedImage === index ? "border-blue-500" : "border-gray-200"
                }`}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${bundle.name} ${index + 1}`}
                  width={100}
                  height={100}
                  className="w-full h-20 object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Bundle Info */}
        <div>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-purple-500">
                <Package className="h-3 w-3 mr-1" />
                {bundle.type.toUpperCase()}
              </Badge>
              <Badge variant="outline">{bundle.category}</Badge>
              <Badge variant="secondary">{bundle.itemCount} Parça</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{bundle.name}</h1>
            <p className="text-gray-600 mb-4">{bundle.shortDescription}</p>
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(bundle.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-2 font-medium">{bundle.rating}</span>
              </div>
              <span className="text-gray-500 ml-2">({bundle.reviews} değerlendirme)</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-2">
              <span className="text-3xl font-bold text-blue-600">₺{bundle.price}</span>
              <span className="text-xl text-gray-500 line-through">₺{bundle.originalPrice}</span>
              <Badge variant="destructive">%{bundle.discountPercentage} İndirim</Badge>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Ayrı satın alındığında: ₺{totalOriginalPrice.toFixed(2)}</p>
              <p className="text-green-600 font-medium">Bu sette tasarruf: ₺{savings.toFixed(2)}</p>
              <p>KDV Dahil</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{bundle.description}</p>
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            <div className="flex items-center text-green-600">
              <Check className="h-5 w-5 mr-2" />
              <span className="font-medium">Stokta var ({bundle.stockCount} adet)</span>
            </div>
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
                  disabled={quantity >= bundle.stockCount}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-gray-600">Maksimum {bundle.stockCount} adet</span>
            </div>

            <div className="flex space-x-4">
              <Button size="lg" className="flex-1">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Sepete Ekle - ₺{(bundle.price * quantity).toFixed(2)}
              </Button>
              <Button variant="outline" size="lg" onClick={() => setIsWishlisted(!isWishlisted)}>
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

          {/* Bundle Info */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-medium">SKU:</span> {bundle.sku}
            </p>
            <p>
              <span className="font-medium">Kategori:</span> {bundle.category}
            </p>
            <p>
              <span className="font-medium">Toplam Parça:</span> {bundle.itemCount} farklı komponent
            </p>
          </div>
        </div>
      </div>

      {/* Bundle Details Tabs */}
      <Tabs defaultValue="items" className="mb-16">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="items">Set İçeriği</TabsTrigger>
          <TabsTrigger value="features">Özellikler</TabsTrigger>
          <TabsTrigger value="specifications">Teknik Özellikler</TabsTrigger>
          <TabsTrigger value="reviews">Değerlendirmeler</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-6">Set İçeriği ({bundle.itemCount} Parça)</h3>
              <div className="space-y-4">
                {bundle.items.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {index + 1}
                    </div>
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500">Adet: {item.quantity}</span>
                        <span className="text-sm text-gray-500 ml-4">Tekil Fiyat: ₺{item.price}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₺{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Ayrı satın alındığında toplam:</p>
                    <p className="text-sm text-gray-600">Bu sette tasarruf ediyorsunuz:</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg line-through text-gray-500">₺{totalOriginalPrice.toFixed(2)}</p>
                    <p className="text-lg font-bold text-green-600">₺{savings.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Set Özellikleri</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {bundle.features.map((feature, index) => (
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
                {Object.entries(bundle.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">{key}</span>
                    <span className="text-gray-600">{value}</span>
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
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="ml-2 font-medium">Mehmet K.</span>
                    <span className="ml-2 text-sm text-gray-500">1 hafta önce</span>
                  </div>
                  <p className="text-gray-700">
                    Harika bir set! Arduino öğrenmek için mükemmel. Tüm komponentler kaliteli ve kılavuz çok detaylı.
                  </p>
                </div>
                <div className="border-b pb-4">
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <Star className="h-4 w-4 text-gray-300" />
                    </div>
                    <span className="ml-2 font-medium">Ayşe T.</span>
                    <span className="ml-2 text-sm text-gray-500">2 hafta önce</span>
                  </div>
                  <p className="text-gray-700">
                    Çocuğum için aldım, çok memnun. Projeler eğlenceli ve öğretici. Sadece kargo biraz geç geldi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Related Bundles */}
      <section>
        <h2 className="text-2xl font-bold mb-8">Benzer Setler</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {relatedBundles.map((relatedBundle) => (
            <Card key={relatedBundle.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-0">
                <div className="relative">
                  <Image
                    src={relatedBundle.image || "/placeholder.svg"}
                    alt={relatedBundle.name}
                    width={200}
                    height={200}
                    className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-2 left-2 bg-purple-500">
                    <Package className="h-3 w-3 mr-1" />
                    SET
                  </Badge>
                  <Badge variant="secondary" className="absolute top-2 right-2">
                    {relatedBundle.itemCount} Parça
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg mb-2 line-clamp-2">{relatedBundle.name}</CardTitle>
                <div className="flex items-center mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(relatedBundle.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-sm">{relatedBundle.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-blue-600">₺{relatedBundle.price}</span>
                    {relatedBundle.originalPrice && (
                      <span className="text-sm text-gray-500 line-through ml-2">₺{relatedBundle.originalPrice}</span>
                    )}
                  </div>
                  <Button size="sm">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Sepete Ekle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
