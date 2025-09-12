"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, CreditCard, Truck, Shield, LogIn } from "lucide-react"
import { useAuthStore } from '@/lib/store/authStore'
import { useCartStore, useHybridUpdateQuantity, useHybridRemoveFromCart } from '@/lib/store/cartStore'
import { useCouponStore } from '@/lib/store/couponStore'
import { apiClient } from '@/lib/api/client'

export default function CartPage() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const items = useCartStore(state => state.items)
  const updateQuantity = useCartStore(state => state.updateQuantity)
  const removeItem = useCartStore(state => state.removeItem)
  const { hybridUpdateQuantity } = useHybridUpdateQuantity()
  const { hybridRemoveFromCart } = useHybridRemoveFromCart()
  const { code, discount, isLoading, error: couponError, applyCoupon, removeCoupon } = useCouponStore()
  const [inputCoupon, setInputCoupon] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // cartItems, setCartItems, useEffect ve ilgili local state'leri kaldırıyorum
  // Sepet işlemlerini store fonksiyonları ile yap
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = subtotal > 500 ? 0 : 29.99
  const total = subtotal + shipping - discount

  const handleApplyCoupon = async () => {
    if (!inputCoupon) return alert('Lütfen bir kupon kodu girin')
    await applyCoupon(inputCoupon)
    setInputCoupon('')
  }
  const handleRemoveCoupon = () => {
    removeCoupon()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Alışverişe Devam Et
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Sepetim ({items.length} ürün)</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Sepetiniz boş</h2>
                <p className="text-gray-600 mb-4">Alışverişe başlamak için ürünlerimizi keşfedin</p>
                <Button asChild>
                  <Link href="/">Alışverişe Başla</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.productId}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={item.product?.images?.[0]?.url || "/placeholder.svg"}
                        alt={item.product?.name || "Ürün Adı"}
                        width={100}
                        height={100}
                        className="rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          {item.product?.name || "Ürün Adı"}
                        </h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xl font-bold text-blue-600">
                            ₺{item.price || item.product?.price}
                          </span>
                          {(item.originalPrice || item.product?.originalPrice) && (
                            <span className="text-sm text-gray-500 line-through">
                              ₺{item.originalPrice || item.product?.originalPrice}
                            </span>
                          )}
                        </div>
                        {item.product?.stock?.quantity === 0 && (
                          <Badge variant="destructive" className="mb-2">
                            Stokta Yok
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => hybridUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.product?.stock?.quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => hybridUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.product?.stock?.quantity === 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">₺{(item.price * item.quantity).toFixed(2)}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => hybridRemoveFromCart(item.productId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Ara Toplam</span>
                <span>₺{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kargo</span>
                <span>{shipping === 0 ? "Ücretsiz" : `₺${shipping.toFixed(2)}`}</span>
              </div>
              {/*
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Kupon İndirimi</span>
                  <span>-₺{discount.toFixed(2)}</span>
                </div>
              )}
              */}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Toplam</span>
                <span>₺{total.toFixed(2)}</span>
              </div>

              {/* Coupon Code */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                {/*  <Input placeholder="Kupon kodu" value={inputCoupon} onChange={(e) => setInputCoupon(e.target.value)} />
                  <Button onClick={handleApplyCoupon} disabled={isLoading || !!code}>Uygula</Button>
                  <Button onClick={handleRemoveCoupon} disabled={!code}>Kaldır</Button>*/} 
                </div>
                {couponError && <span className="text-red-600">{couponError}</span>}
              </div>
              {isAuthenticated ? (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={items.length === 0 || items.some((item) => item.product?.stock?.quantity === 0)}
                  onClick={() => window.location.href = "/odeme"}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Ödemeye Geç
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  variant="secondary"
                  asChild
                >
                  <Link href="/login?redirect=/odeme">
                    <LogIn className="h-5 w-5 mr-2" />
                    Giriş Yap ve Ödemeye Geç
                  </Link>
                </Button>
              )}

              {/* Benefits */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm">
                  <Truck className="h-4 w-4 text-green-600" />
                  <span>500₺ üzeri ücretsiz kargo</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span>Güvenli ödeme garantisi</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
