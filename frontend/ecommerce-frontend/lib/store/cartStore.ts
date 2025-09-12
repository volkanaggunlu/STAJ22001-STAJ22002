'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/lib/api/types'
import { useAuthStore } from './authStore'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'

interface CartState {
  items: CartItem[]
  isOpen: boolean
  // Actions
  addItem: (product: any, quantity?: number) => void
  removeItem: (productId: string) => void
  removeItems: (productIds: string[]) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  // Computed
  getTotalItems: () => number
  getTotalPrice: () => number
  getTotalDiscount: () => number
  getItemQuantity: (productId: string) => number
  // Eklenen alanlar
  totalItems: number
  totalPrice: number
  totalDiscount: number
  isLoaded: boolean // Sepet API'den çekildi mi?
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      totalItems: 0,
      totalPrice: 0,
      totalDiscount: 0,
      isLoaded: false,

      addItem: (product, quantity = 1) => {
        const items = get().items
        const existingItem = items.find(item => item.productId === product.id)
        let newItems: CartItem[]

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity
          newItems = items.map(item =>
            item.productId === product.id
              ? { ...item, quantity: newQuantity }
              : item
          )
          set({ items: newItems, isLoaded: true })
        } else {
          const cartItem: CartItem = {
            productId: product.id,
            quantity: Math.min(quantity, product.stock?.quantity || 1),
            price: product.price,
            originalPrice: product.originalPrice,
            addedAt: new Date().toISOString(),
            product: product
          }
          newItems = [...items, cartItem]
          set({ items: newItems, isLoaded: true })
        }

        // Eğer kullanıcı login değilse, guest-cart'a da yaz
        try {
          const isAuthenticated = require('./authStore').useAuthStore.getState().isAuthenticated
          if (!isAuthenticated) {
            setGuestCart(newItems)
          }
        } catch {}

        // Auto open cart after adding item
        get().openCart()
        
        // Auto close after 3 seconds
        setTimeout(() => {
          get().closeCart()
        }, 3000)
      },

      removeItem: (productId) => {
        const newItems = get().items.filter(item => item.productId !== productId)
        set({ items: newItems, isLoaded: true })
        // Eğer kullanıcı login değilse, guest-cart'ı güncelle
        try {
          const isAuthenticated = require('./authStore').useAuthStore.getState().isAuthenticated
          if (!isAuthenticated) {
            setGuestCart(newItems)
          }
        } catch {}
      },

      removeItems: (productIds) => {
        const idSet = new Set(productIds)
        const newItems = get().items.filter(item => !idSet.has(item.productId))
        set({ items: newItems, isLoaded: true })
        try {
          const isAuthenticated = require('./authStore').useAuthStore.getState().isAuthenticated
          if (!isAuthenticated) {
            setGuestCart(newItems)
          }
        } catch {}
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        const newItems = get().items.map(item =>
          item.productId === productId
            ? { ...item, quantity }
            : item
        )
        set({ items: newItems, isLoaded: true })
        // Eğer kullanıcı login değilse, guest-cart'ı güncelle
        try {
          const isAuthenticated = require('./authStore').useAuthStore.getState().isAuthenticated
          if (!isAuthenticated) {
            setGuestCart(newItems)
          }
        } catch {}
      },

      clearCart: async () => {
        const isAuthenticated = require('./authStore').useAuthStore.getState().isAuthenticated
        if (isAuthenticated) {
          try {
            if (process.env.NODE_ENV === 'development') {
              console.log('[DEBUG] clearCart: API DELETE /cart istek atılıyor')
            }
            const res = await require('../api/client').apiClient.delete('/cart')
            if (process.env.NODE_ENV === 'development') {
              console.log('[DEBUG] clearCart: API yanıtı', res?.data)
            }
          } catch (err) {
            if (process.env.NODE_ENV === 'development') {
              console.error('[DEBUG] clearCart: API hata', err)
            }
            // Hata yönetimi (opsiyonel: toast veya log)
          }
        }
        set({ items: [], totalItems: 0, totalPrice: 0, totalDiscount: 0, isLoaded: true })
        if (typeof window !== 'undefined') {
          localStorage.removeItem('electrotech-cart')
          clearGuestCart()
          toast.success('Sepet başarıyla temizlendi')
        }
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          return total + (item.price * item.quantity)
        }, 0)
      },

      getTotalDiscount: () => {
        return get().items.reduce((total, item) => {
          if (item.originalPrice && item.originalPrice > item.price) {
            const discount = (item.originalPrice - item.price) * item.quantity
            return total + discount
          }
          return total
        }, 0)
      },

      getItemQuantity: (productId) => {
        const item = get().items.find(item => item.productId === productId)
        return item?.quantity || 0
      }
    }),
    {
      name: 'electrotech-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        // LocalStorage'dan yüklendiğinde isLoaded'ı true yap
        if (state) {
          state.isLoaded = true
        }
      }
    }
  )
)

// Store'a güncel cart'ı set eden fonksiyon
export const setItemsFromApi = (cart: any) => {
  const currentItems = useCartStore.getState().items || []
  const mergedItems = (cart.items || []).map((item: any) => {
    const id = item.productId || item.product?.id
    const prev = currentItems.find(ci => ci.productId === id)
    return {
      productId: id,
      quantity: item.quantity ?? prev?.quantity ?? 1,
      price: item.price ?? prev?.price ?? 0,
      originalPrice: item.originalPrice ?? prev?.originalPrice,
      addedAt: item.addedAt || prev?.addedAt || new Date().toISOString(),
      // Eğer API "product" nesnesini göndermiyorsa, mevcut store'daki ürün bilgisini koru
      product: item.product || prev?.product
    }
  })

  useCartStore.setState({
    items: mergedItems,
    totalItems:
      cart.totalItems ||
      cart.itemCount ||
      mergedItems.reduce((sum: number, i: any) => sum + i.quantity, 0),
    totalPrice:
      cart.subtotal ||
      cart.totals?.subtotal ||
      mergedItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0),
    totalDiscount: cart.totalSavings || cart.totals?.discount || 0,
    isLoaded: true,
  })
  if (typeof window !== 'undefined' && (!cart.items || cart.items.length === 0)) {
    localStorage.removeItem('electrotech-cart')
  }
}

// Sepet çekme işlemi sırasında 404 veya 'Sepet bulunamadı' mesajı gelirse toast gösterme
// Bunu, API'den sepet çekilen tüm yerlerde uygulayacağız
// Örneğin, app/layout.tsx veya login sonrası sepet çekme kodunda:
//
// apiClient.get('/cart').then(res => {
//   if (res.data?.success && res.data?.data?.cart) {
//     setItemsFromApi(res.data.data.cart)
//   }
// }).catch(err => {
//   if (err.response?.status !== 404 && err.response?.data?.message !== 'Sepet bulunamadı') {
//     toast.error(err.response?.data?.message || err.message || 'Sepet alınırken hata oluştu')
//   }
// })
//
// Benzer şekilde, login fonksiyonunda da aynı kontrolü uygula.
// Sepet hook'u için shorthand
export const useCart = () => {
  const store = useCartStore()
  return {
    items: store.items,
    isOpen: store.isOpen,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    openCart: store.openCart,
    closeCart: store.closeCart,
    totalItems: store.getTotalItems(),
    totalPrice: store.getTotalPrice(),
    totalDiscount: store.getTotalDiscount(),
    getItemQuantity: store.getItemQuantity
  }
} 

// Hibrit sepete ekle fonksiyonu
export const useHybridAddToCart = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const addItem = useCartStore(state => state.addItem)
  const setItems = useCartStore.setState

  const hybridAddToCart = async (product: any, quantity = 1) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] hybridAddToCart çağrıldı:', { product, quantity })
    }
    if (isAuthenticated) {
      try {
        const res = await apiClient.post('/cart', {
          productId: product.id,
          quantity: quantity,
          bundledProducts: []
        })
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] /cart API response:', res.data);
          console.log('[DEBUG] cart.items:', res.data?.data?.cart?.items);
        }
        if (res.data?.success && res.data?.data?.cart) {
          setItemsFromApi(res.data.data.cart)
          if (process.env.NODE_ENV === 'development') {
            console.log('[DEBUG] Sepet store güncellendi (auth)')
          }
          toast.success('Ürün sepete eklendi')
        } else {
          toast.error(res.data?.message || 'Sepete eklenirken bir hata oluştu')
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Sepete ekle hata:', err)
        }
        const msg = err.response?.data?.message || err.message || 'Sepete eklenirken bir hata oluştu'
        toast.error(msg)
      }
    } else {
      addItem(product, quantity)
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Sepet store güncellendi (anonim)')
      }
      toast.success('Ürün sepete eklendi')
    }
  }

  return { hybridAddToCart }
} 

// Hibrit sepetten çıkar fonksiyonu
export const useHybridRemoveFromCart = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const removeItem = useCartStore(state => state.removeItem)
  const setItems = useCartStore.setState

  const hybridRemoveFromCart = async (productId: string) => {
    if (isAuthenticated) {
      try {
        const res = await apiClient.delete(`/cart/${productId}`)
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] /cart/:productId DELETE API response:', res.data)
        }
        if (res.data?.success && res.data?.data?.cart) {
          setItemsFromApi(res.data.data.cart)
          toast.success('Ürün sepetten çıkarıldı')
        } else {
          toast.error(res.data?.message || 'Ürün sepetten çıkarılamadı')
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Sepetten çıkarma hata:', err)
        }
        toast.error(err.response?.data?.message || err.message || 'Ürün sepetten çıkarılamadı')
      }
    } else {
      removeItem(productId)
      toast.success('Ürün sepetten çıkarıldı')
    }
  }

  return { hybridRemoveFromCart }
}

// Sepet merge fonksiyonu
export const useCartMerge = () => {
  const items = useCartStore(state => state.items)
  const clearCart = useCartStore(state => state.clearCart)
  const setItems = useCartStore.setState
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  const mergeCart = async () => {
    if (!isAuthenticated || items.length === 0) return
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] mergeCart çağrıldı, local items:', items)
    }
    try {
      for (const item of items) {
        await apiClient.post('/cart', {
          productId: item.productId,
          quantity: item.quantity,
          bundledProducts: []
        })
      }
      const res = await apiClient.get('/cart')
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] /cart (merge sonrası) API response:', res.data)
      }
      if (res.data?.success && res.data?.data?.cart) {
        setItemsFromApi(res.data.data.cart)
        clearCart()
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Sepet store güncellendi (merge)')
        }
        toast.success('Sepetiniz hesabınıza aktarıldı')
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Sepet merge hata:', err)
      }
      toast.error('Sepet birleştirme sırasında hata oluştu')
    }
  }

  return { mergeCart }
} 

export const useHybridUpdateQuantity = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const updateQuantity = useCartStore(state => state.updateQuantity)
  const setItems = useCartStore.setState

  const hybridUpdateQuantity = async (productId: string, quantity: number) => {
    if (isAuthenticated) {
      try {
        if (quantity <= 0) {
          await apiClient.delete(`/cart/${productId}`)
        } else {
          await apiClient.put(`/cart/${productId}`, { quantity })
        }
        const res = await apiClient.get('/cart')
        if (res.data?.success && res.data?.data?.cart) {
          setItemsFromApi(res.data.data.cart)
        }
      } catch (err: any) {
        // Hata yönetimi
      }
    } else {
      updateQuantity(productId, quantity)
    }
  }

  return { hybridUpdateQuantity }
} 

// Misafir sepetini ayrı anahtarda saklamak için yardımcı fonksiyonlar
export const getGuestCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('guest-cart');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const setGuestCart = (items: CartItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('guest-cart', JSON.stringify(items));
};

export const clearGuestCart = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('guest-cart');
}; 