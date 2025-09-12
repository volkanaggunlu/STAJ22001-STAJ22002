import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AuthUser } from '../api/types'
import { authApi } from '../api/services/auth'
import { AuthStorage } from '../api/client'
import { useCartStore } from './cartStore'
import { apiClient } from '@/lib/api/client'
// setItemsFromApi fonksiyonunu import et
// Not: Eğer doğrudan import edilemiyorsa, useCartStore.setState ile de güncellenebilir
import { setItemsFromApi, useCartMerge, getGuestCart, clearGuestCart } from './cartStore'
import { toast } from 'sonner'

interface AuthState {
  // State
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  login: (user: AuthUser) => void
  logout: () => void
  updateUser: (updates: Partial<AuthUser>) => void
  initialize: () => Promise<void>
  checkAuth: () => Promise<boolean>
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // Set user data
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        })
      },

      // Set loading state
      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      // Set initialized state
      setInitialized: (initialized) => {
        set({ isInitialized: initialized })
      },

      // Login action
      login: async (user) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 [DEBUG] Login successful for:', user.email)
        }
        set({
          user,
          isAuthenticated: true,
          isLoading: false
        })
        // Kullanıcı login olduktan hemen sonra backend sepetini çek
        let backendCart = null
        try {
          const res = await apiClient.get('/cart')
          if (process.env.NODE_ENV === 'development') {
            console.log('🛒 [DEBUG] Backend sepeti çekildi:', res.data)
          }
          if (res.data?.success && res.data?.data?.cart) {
            setItemsFromApi(res.data.data.cart)
            backendCart = res.data.data.cart
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🛒 [DEBUG] Backend sepeti çekilirken hata:', err)
          }
        }
        // Local (guest) sepeti backend ile merge et
        try {
          const guestItems = getGuestCart()
          if (process.env.NODE_ENV === 'development') {
            console.log('🛒 [DEBUG] Guest-cart içeriği:', guestItems)
          }
          if (guestItems && guestItems.length > 0) {
            // Guest-cart ürünlerini backend'e sırayla ekle
            for (const item of guestItems) {
              if (process.env.NODE_ENV === 'development') {
                console.log('🛒 [DEBUG] Guest-cart ürünü backend eklenecek:', item)
              }
              await apiClient.post('/cart', {
                productId: item.productId,
                quantity: item.quantity,
                bundledProducts: []
              })
            }
            // Tüm eklemeler bittikten sonra backend sepetini çek
            const res2 = await apiClient.get('/cart')
            if (process.env.NODE_ENV === 'development') {
              console.log('🛒 [DEBUG] Merge sonrası backend sepeti:', res2.data)
            }
            if (res2.data?.success && res2.data?.data?.cart) {
              setItemsFromApi(res2.data.data.cart)
            }
            clearGuestCart()
            if (process.env.NODE_ENV === 'development') {
              console.log('🛒 [DEBUG] Guest-cart temizlendi')
            }
            toast.success('Sepetiniz birleştirildi')
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('🛒 [DEBUG] Guest-cart yok, sadece backend sepeti kullanılacak')
            }
            // Guest-cart yoksa sadece backend sepetini kullan
            // (zaten yukarıda setItemsFromApi çağrıldı)
          }
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🛒 [DEBUG] Guest-cart merge edilirken hata:', err)
          }
        }
      },

      // Logout action
      logout: () => {
        console.log('🔐 Logging out user:', get().user?.email || 'Unknown')
        
        // Clear auth storage
        AuthStorage.clearTokens()
        
        // Clear user state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })

        // Clear other storage data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-preferences')
          localStorage.removeItem('recently-viewed')
          sessionStorage.clear()
          // Local sepeti temizle
          useCartStore.getState().clearCart()
        }
        
        console.log('🔐 Logout complete')
      },

      // Update user data
      updateUser: (updates) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...updates }
          })
        }
      },

      // Initialize auth state on app start
      initialize: async () => {
        const { setLoading, setInitialized, setUser } = get()
        
        if (get().isInitialized) {
          console.log('🔐 Auth already initialized')
          return
        }

        console.log('🔐 Initializing auth...')
        setLoading(true)

        try {
          // Check if tokens exist and are valid
          const isValidToken = await authApi.checkAndRefreshToken()
          console.log('🔐 Token check result:', isValidToken)
          
          if (isValidToken) {
            // Fetch current user data
            try {
              const response = await authApi.getCurrentUser()
              if (response.success && response.data.user) {
                console.log('🔐 User data fetched:', response.data.user.email)
                setUser(response.data.user)
              } else {
                console.log('🔐 No user data in response')
                setUser(null)
              }
            } catch (error) {
              console.warn('🔐 Failed to fetch user data:', error)
              setUser(null)
            }
          } else {
            console.log('🔐 No valid tokens found')
            setUser(null)
          }
        } catch (error) {
          console.error('🔐 Auth initialization failed:', error)
          setUser(null)
        } finally {
          setLoading(false)
          setInitialized(true)
          console.log('🔐 Auth initialization complete. User:', get().user?.email || 'None')
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const { setUser } = get()
        
        try {
          const isValidToken = await authApi.checkAndRefreshToken()
          
          if (isValidToken) {
            // If we don't have user data, fetch it
            if (!get().user) {
              try {
                const response = await authApi.getCurrentUser()
                if (response.success && response.data.user) {
                  setUser(response.data.user)
                  return true
                }
              } catch (error) {
                console.warn('Failed to fetch user data during auth check:', error)
              }
            }
            return !!get().user
          } else {
            setUser(null)
            return false
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          setUser(null)
          return false
        }
      },

      // Clear all authentication data
      clearAuth: () => {
        // Clear tokens
        AuthStorage.clearTokens()
        
        // Reset state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: false
        })

        // Clear all related storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-store')
          localStorage.removeItem('user-preferences')
          localStorage.removeItem('guest-cart')
          localStorage.removeItem('recently-viewed')
          localStorage.removeItem('search-history')
          sessionStorage.clear()
        }
      }
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist user data, not loading states
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
      // Rehydrate user state on app start
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Auto-initialize after rehydration
          setTimeout(() => {
            state.initialize()
          }, 100)
        }
      }
    }
  )
)

// Auth store utilities
export const authStoreUtils = {
  // Get current user
  getUser: () => useAuthStore.getState().user,
  
  // Check if user is authenticated
  isAuthenticated: () => useAuthStore.getState().isAuthenticated,
  
  // Check if user has specific role
  hasRole: (role: string) => {
    const user = useAuthStore.getState().user
    return user?.role === role
  },
  
  // Check if user is admin
  isAdmin: () => {
    const user = useAuthStore.getState().user
    return user?.role === 'admin'
  },
  
  // Get user ID
  getUserId: () => {
    const user = useAuthStore.getState().user
    return user?.id
  },
  
  // Check if email is verified
  isEmailVerified: () => {
    const user = useAuthStore.getState().user
    return user?.isVerified || false
  }
}

export default useAuthStore 