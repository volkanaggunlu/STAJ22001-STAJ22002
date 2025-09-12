'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star, Eye, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge as UIBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Product } from '@/lib/api/types'
import { useToggleFavorite } from '@/lib/hooks/useProducts'
import { formatPrice } from '@/lib/utils/format'
import { useHybridAddToCart } from '@/lib/store/cartStore'

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list'
  showQuickView?: boolean
  isFavorite?: boolean
  className?: string
}

export default function ProductCard({
  product,
  variant = 'grid',
  showQuickView = false,
  isFavorite: initialIsFavorite = false,
  className
}: ProductCardProps) {
  const [imageLoading, setImageLoading] = useState(true)
  const [localIsFavorite, setLocalIsFavorite] = useState(initialIsFavorite)
  const { toggleFavorite, isLoading: isFavoriteLoading } = useToggleFavorite()
  const { hybridAddToCart } = useHybridAddToCart()
  const [addLoading, setAddLoading] = useState(false)

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercentage = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const previous = localIsFavorite
    // Optimistically update the UI
    setLocalIsFavorite(!previous)
    
    try {
      await toggleFavorite(product.id, previous)
    } catch (error) {
      // Revert on error
      setLocalIsFavorite(previous)
    }
  }

  // Keep local favorite state in sync with incoming prop updates
  useEffect(() => {
    setLocalIsFavorite(initialIsFavorite)
  }, [initialIsFavorite])

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Quick view:', product.slug)
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (addLoading || product.stock.quantity === 0) return
    setAddLoading(true)
    try {
      await hybridAddToCart(product, 1)
    } finally {
      setAddLoading(false)
    }
  }

  if (variant === 'list') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="relative w-32 h-32 flex-shrink-0">
              <Link href={`/urun/${product.slug}`}>
                <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                  {primaryImage && (
                    <Image
                      src={primaryImage.url}
                      alt={primaryImage.alt || product.name}
                      fill
                      className={cn(
                        'object-cover transition-opacity duration-300',
                        imageLoading ? 'opacity-0' : 'opacity-100'
                      )}
                      onLoadingComplete={() => setImageLoading(false)}
                    />
                  )}

                  <div className="absolute top-2 left-2 flex flex-col space-y-1">
                    {product.isFeatured && (
                      <UIBadge variant="default" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Öne Çıkan
                      </UIBadge>
                    )}
                    {hasDiscount && (
                      <UIBadge variant="destructive" className="text-xs">
                        -{discountPercentage}%
                      </UIBadge>
                    )}
                    {product.stock.quantity <= product.stock.lowStockThreshold && (
                      <UIBadge variant="outline" className="text-xs">
                        Son {product.stock.quantity}
                      </UIBadge>
                    )}
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <Link href={`/urun/${product.slug}`}>
                    <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavoriteClick}
                  disabled={isFavoriteLoading}
                  className="flex-shrink-0 ml-2"
                >
                  <Heart
                    className={cn(
                      "w-4 h-4",
                      localIsFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
                    )}
                  />
                </Button>
              </div>

              {product.shortDescription && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.shortDescription}
                </p>
              )}

              {product.rating.average > 0 && (
                <div className="flex items-center space-x-1 mb-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= Math.round(product.rating.average)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({product.rating.count})
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.originalPrice!)}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {showQuickView && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleQuickView}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Hızlı Bak
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={handleAddToCart}
                    disabled={product.stock.quantity === 0 || addLoading}
                  >
                    {addLoading ? (
                      <Zap className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 mr-1" />
                    )}
                    {product.stock.quantity === 0 ? 'Stokta Yok' : addLoading ? 'Ekleniyor...' : 'Sepete Ekle'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('group hover:shadow-lg transition-all duration-300', className)}>
      <CardContent className="p-0">
        <div className="relative aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
          <Link href={`/urun/${product.slug}`}>
            {primaryImage && (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                fill
                className={cn(
                  'object-cover transition-all duration-300 group-hover:scale-105',
                  imageLoading ? 'opacity-0' : 'opacity-100'
                )}
                onLoadingComplete={() => setImageLoading(false)}
              />
            )}
          </Link>

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col space-y-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFavoriteClick}
              disabled={isFavoriteLoading}
              className="w-8 h-8 p-0"
            >
              <Heart
                className={cn(
                  "w-4 h-4",
                  localIsFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                )}
              />
            </Button>

            {showQuickView && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleQuickView}
                className="w-8 h-8 p-0"
              >
                <Eye className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {product.isFeatured && (
              <UIBadge variant="default" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                Öne Çıkan
              </UIBadge>
            )}
            {hasDiscount && (
              <UIBadge variant="destructive" className="text-xs">
                -{discountPercentage}%
              </UIBadge>
            )}
            {product.stock.quantity <= product.stock.lowStockThreshold && (
              <UIBadge variant="outline" className="text-xs bg-white">
                Son {product.stock.quantity}
              </UIBadge>
            )}
            {product.type === 'bundle' && (
              <UIBadge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Set
              </UIBadge>
            )}
          </div>

          {product.stock.quantity === 0 && (
            <div className="absolute inset-0 bg-gray-900/75 flex items-center justify-center">
              <UIBadge variant="destructive" className="text-sm">
                Stokta Yok
              </UIBadge>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="mb-2">
            <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
            <Link href={`/urun/${product.slug}`}>
              <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h3>
            </Link>
          </div>

          {product.rating.average > 0 && (
            <div className="flex items-center space-x-1 mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-3 h-3",
                      star <= Math.round(product.rating.average)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-600">
                ({product.rating.count})
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.originalPrice!)}
                </span>
              )}
            </div>
          </div>

          <Button
            className="w-full"
            size="sm"
            onClick={handleAddToCart}
            disabled={product.stock.quantity === 0 || addLoading}
          >
            {addLoading ? (
              <Zap className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ShoppingCart className="w-4 h-4 mr-2" />
            )}
            {product.stock.quantity === 0 ? 'Stokta Yok' : addLoading ? 'Ekleniyor...' : 'Sepete Ekle'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
