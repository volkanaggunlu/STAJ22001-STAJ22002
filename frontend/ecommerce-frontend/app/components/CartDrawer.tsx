'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useCart, useHybridRemoveFromCart, useHybridUpdateQuantity, setItemsFromApi, useCartStore } from '@/lib/store/cartStore'
import { formatPrice } from '@/lib/utils/format'
import { Minus, Plus, X, ShoppingCart, Package } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useState } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import { useCouponStore } from '@/lib/store/couponStore'

export function CartDrawer() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    updateQuantity,
    totalItems,
    totalPrice,
    totalDiscount 
  } = useCart()
  const { isAuthenticated } = useAuth()
  const { code, discount, isLoading, error, applyCoupon, removeCoupon } = useCouponStore()
  const [inputCoupon, setInputCoupon] = useState('')
  const { hybridRemoveFromCart } = useHybridRemoveFromCart()
  const { hybridUpdateQuantity } = useHybridUpdateQuantity()
  const { clearCart } = useCart()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const removeItems = useCartStore(state => state.removeItems)

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      window.location.href = '/login?redirect=/odeme'
    } else {
      // Go directly to odeme (checkout)
      window.location.href = '/odeme'
    }
  }

  const handleApplyCoupon = async () => {
    if (!inputCoupon) return toast.error('Lütfen bir kupon kodu girin')
    await applyCoupon(inputCoupon)
    setInputCoupon('')
  }
  const handleRemoveCoupon = () => {
    removeCoupon()
  }

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Sepetim ({totalItems} ürün)
          </SheetTitle>
          <SheetDescription>
            Sepetinizdeki ürünleri kontrol edin ve satın almaya devam edin
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full pt-6">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Sepetiniz boş
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sepetinizde henüz ürün bulunmuyor
                </p>
                <Button asChild onClick={closeCart}>
                  <Link href="/urunler">
                    Alışverişe Başla
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-auto space-y-4">
                {items.map((item) => {
                  if (process.env.NODE_ENV === 'development') {
                    // eslint-disable-next-line no-console
                    console.log('CartDrawer DEBUG item.product.images:', item.product?.images)
                  }
                  const firstImage = item.product?.images?.[0];
                  const imageUrl = firstImage?.url && typeof firstImage.url === 'string'
                    ? (firstImage.url.startsWith('http') ? firstImage.url : (process.env.NEXT_PUBLIC_API_URL || '') + firstImage.url)
                    : undefined;
                  const imageAlt = typeof firstImage?.alt === 'string' ? firstImage.alt : (item.product?.name || 'Ürün');
                  return (
                    <div key={item.productId} className="flex items-center space-x-4">
                      {/* Checkbox for bulk delete */}
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.productId)}
                        onChange={e => {
                          if (e.target.checked) setSelectedIds([...selectedIds, item.productId])
                          else setSelectedIds(selectedIds.filter(id => id !== item.productId))
                        }}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      {/* Product Image */}
                      <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={imageAlt}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {item.product?.name || 'Ürün'}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.product?.brand} • {item.product?.sku}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-sm font-medium text-foreground">
                            {formatPrice(item.price)}
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-xs text-muted-foreground line-through ml-2">
                              {formatPrice(item.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => hybridUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => hybridUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.product?.stock?.quantity ? item.quantity >= item.product.stock.quantity : false}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => hybridRemoveFromCart(item.productId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
                
              </div>

              <Separator className="my-4" />

              {/* Seçili Ürünleri Sil Butonu */}
              <div className="mb-2">
                <Button
                  onClick={async () => {
                    try {
                      if (isAuthenticated) {
                        const res = await apiClient.delete('/cart/bulk', { data: { productIds: selectedIds } })
                        if (res.data?.success && res.data?.data?.cart) {
                          setItemsFromApi(res.data.data.cart)
                          toast.success('Seçili ürünler sepetten silindi')
                        } else {
                          toast.error(res.data?.message || 'Ürünler silinemedi')
                        }
                      } else {
                        // guest kullanıcı: store içi toplu silme
                        removeItems(selectedIds)
                        toast.success('Seçili ürünler sepetten silindi')
                      }
                      setSelectedIds([])
                    } catch (err: any) {
                      toast.error(err?.response?.data?.message || err?.message || 'Ürünler silinirken bir hata oluştu')
                    }
                  }}
                  variant="destructive"
                  disabled={selectedIds.length === 0}
                  className="w-full"
                >
                  Seçili Ürünleri Sil
                </Button>
              </div>

              {/* Toplu Silme Butonu */}
              <div className="mb-4">
                <Button onClick={clearCart} variant="destructive" className="w-full">
                  Sepeti Temizle
                </Button>
              </div>

              {/* Cart Summary */}
              <div className="space-y-4 pb-32"> {/* Alt butonlara yer bırakmak için padding ekledim */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                  {/*   <input type="text" value={inputCoupon} onChange={e => setInputCoupon(e.target.value)} placeholder="Kupon kodu" className="input input-sm flex-1" disabled={isLoading || !!code} />
                    <Button size="sm" onClick={handleApplyCoupon} disabled={isLoading || !!code}>{isLoading ? 'Uygulanıyor...' : code ? 'Uygulandı' : 'Kuponu Uygula'}</Button>
                    <Button size="sm" onClick={handleRemoveCoupon} disabled={!code}>Kaldır</Button>*/}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ara Toplam:</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  {/*
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Kupon İndirimi:</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  */}
                  
                  <div className="flex justify-between text-sm">
                    <span>Kargo:</span>
                    <span>
                      {totalPrice >= 500 ? (
                        <span className="text-green-600">Ücretsiz</span>
                      ) : (
                        formatPrice(29.99)
                      )}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Toplam:</span>
                    <span>
                      {formatPrice(totalPrice + (totalPrice >= 500 ? 0 : 29.99) - discount)}
                    </span>
                  </div>
                </div>
                {/* Free Shipping Notice */}
                {totalPrice < 500 && (
                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                    🚚 {formatPrice(500 - totalPrice)} daha ekleyin, kargo ücretsiz olsun!
                  </div>
                )}
              </div>

              {/* Sticky Action Buttons */}
              <div className="sticky bottom-0 left-0 right-0 bg-white p-4 z-10 border-t space-y-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                >
                  {isAuthenticated ? 'Satın Al' : 'Giriş Yap ve Satın Al'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                  onClick={closeCart}
                >
                  <Link href="/sepet">
                    Sepete Git
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 