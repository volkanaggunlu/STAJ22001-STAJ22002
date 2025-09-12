# 🔄 State Management (Durum Yönetimi)

## 📋 Genel Bakış

Açık Atölye projesi **hibrit state management** yaklaşımı kullanır:
- **Zustand**: Client-side state (auth, cart, preferences)
- **TanStack Query**: Server state (API data, caching)
- **React useState**: Component-level state

## 🏗️ State Architecture

### State Katmanları
```
┌─────────────────────────────────────────┐
│              Component State             │
│        (useState, useReducer)           │
├─────────────────────────────────────────┤
│             Client State                │
│          (Zustand Stores)               │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ AuthStore   │  │   CartStore     │   │
│  │ UIStore     │  │ PreferencesStore│   │
│  └─────────────┘  └─────────────────┘   │
├─────────────────────────────────────────┤
│             Server State                │
│         (TanStack Query)                │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  Products   │  │   Categories    │   │
│  │   Orders    │  │     Users       │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## 🏪 Zustand Stores

### Auth Store
```typescript
// lib/store/authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AuthUser } from '../api/types'

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
      login: (user) => {
        console.log('🔐 Login successful for:', user.email)
        set({
          user,
          isAuthenticated: true,
          isLoading: false
        })
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

        // Clear other stores
        useCartStore.getState().clearCart()
        usePreferencesStore.getState().resetPreferences()
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-preferences')
          localStorage.removeItem('recently-viewed')
          localStorage.removeItem('guest-cart')
          sessionStorage.clear()
        }
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
          return
        }

        setLoading(true)
        try {
          const isValidToken = await authApi.checkAndRefreshToken()
          
          if (isValidToken) {
            const response = await authApi.getCurrentUser()
            if (response.success && response.data.user) {
              setUser(response.data.user)
            } else {
              setUser(null)
            }
          } else {
            setUser(null)
          }
        } catch (error) {
          console.error('Auth initialization failed:', error)
          setUser(null)
        } finally {
          setLoading(false)
          setInitialized(true)
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const { setUser } = get()
        
        try {
          const isValidToken = await authApi.checkAndRefreshToken()
          
          if (isValidToken) {
            if (!get().user) {
              const response = await authApi.getCurrentUser()
              if (response.success && response.data.user) {
                setUser(response.data.user)
                return true
              }
            }
            return !!get().user
          } else {
            setUser(null)
            return false
          }
        } catch (error) {
          setUser(null)
          return false
        }
      },

      // Clear all authentication data
      clearAuth: () => {
        AuthStorage.clearTokens()
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: false
        })

        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-store')
          localStorage.removeItem('cart-store')
          localStorage.removeItem('preferences-store')
          sessionStorage.clear()
        }
      }
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
```

### Cart Store
```typescript
// lib/store/cartStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Product } from '../api/types'

interface CartItem {
  id: string
  product: Product
  quantity: number
  addedAt: Date
}

interface CartState {
  // State
  items: CartItem[]
  isOpen: boolean
  totalItems: number
  totalAmount: number
  
  // Actions
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  
  // Computed
  getItem: (productId: string) => CartItem | undefined
  isInCart: (productId: string) => boolean
  getItemCount: (productId: string) => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isOpen: false,
      totalItems: 0,
      totalAmount: 0,

      // Add item to cart
      addItem: (product, quantity = 1) => {
        const { items } = get()
        const existingItem = items.find(item => item.product.id === product.id)
        
        let newItems: CartItem[]
        
        if (existingItem) {
          // Update existing item quantity
          newItems = items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${product.id}-${Date.now()}`,
            product,
            quantity,
            addedAt: new Date()
          }
          newItems = [...items, newItem]
        }
        
        // Calculate totals
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalAmount = newItems.reduce((sum, item) => 
          sum + (item.product.finalPrice * item.quantity), 0
        )
        
        set({
          items: newItems,
          totalItems,
          totalAmount
        })
        
        console.log(`🛒 Added ${quantity}x ${product.name} to cart`)
      },

      // Remove item from cart
      removeItem: (productId) => {
        const { items } = get()
        const newItems = items.filter(item => item.product.id !== productId)
        
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalAmount = newItems.reduce((sum, item) => 
          sum + (item.product.finalPrice * item.quantity), 0
        )
        
        set({
          items: newItems,
          totalItems,
          totalAmount
        })
        
        console.log(`🛒 Removed product ${productId} from cart`)
      },

      // Update item quantity
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        
        const { items } = get()
        const newItems = items.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        )
        
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalAmount = newItems.reduce((sum, item) => 
          sum + (item.product.finalPrice * item.quantity), 0
        )
        
        set({
          items: newItems,
          totalItems,
          totalAmount
        })
      },

      // Clear cart
      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalAmount: 0
        })
        console.log('🛒 Cart cleared')
      },

      // Cart visibility
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

      // Computed getters
      getItem: (productId) => {
        const { items } = get()
        return items.find(item => item.product.id === productId)
      },

      isInCart: (productId) => {
        const { items } = get()
        return items.some(item => item.product.id === productId)
      },

      getItemCount: (productId) => {
        const item = get().getItem(productId)
        return item ? item.quantity : 0
      },
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

### UI Store
```typescript
// lib/store/uiStore.ts
interface UIState {
  // Loading states
  isGlobalLoading: boolean
  loadingMessage: string
  
  // Modal states
  modals: {
    quickView: {
      isOpen: boolean
      productId?: string
    }
    authModal: {
      isOpen: boolean
      mode: 'login' | 'register'
    }
    confirmDialog: {
      isOpen: boolean
      title: string
      message: string
      onConfirm?: () => void
    }
  }
  
  // Toast notifications
  notifications: Notification[]
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Actions
  setGlobalLoading: (loading: boolean, message?: string) => void
  openQuickView: (productId: string) => void
  closeQuickView: () => void
  openAuthModal: (mode: 'login' | 'register') => void
  closeAuthModal: () => void
  showConfirmDialog: (title: string, message: string, onConfirm: () => void) => void
  hideConfirmDialog: () => void
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      isGlobalLoading: false,
      loadingMessage: '',
      
      modals: {
        quickView: {
          isOpen: false,
          productId: undefined
        },
        authModal: {
          isOpen: false,
          mode: 'login'
        },
        confirmDialog: {
          isOpen: false,
          title: '',
          message: '',
          onConfirm: undefined
        }
      },
      
      notifications: [],
      theme: 'system',

      // Loading actions
      setGlobalLoading: (loading, message = '') => {
        set({
          isGlobalLoading: loading,
          loadingMessage: message
        })
      },

      // Quick view modal
      openQuickView: (productId) => {
        set({
          modals: {
            ...get().modals,
            quickView: {
              isOpen: true,
              productId
            }
          }
        })
      },

      closeQuickView: () => {
        set({
          modals: {
            ...get().modals,
            quickView: {
              isOpen: false,
              productId: undefined
            }
          }
        })
      },

      // Auth modal
      openAuthModal: (mode) => {
        set({
          modals: {
            ...get().modals,
            authModal: {
              isOpen: true,
              mode
            }
          }
        })
      },

      closeAuthModal: () => {
        set({
          modals: {
            ...get().modals,
            authModal: {
              isOpen: false,
              mode: 'login'
            }
          }
        })
      },

      // Confirm dialog
      showConfirmDialog: (title, message, onConfirm) => {
        set({
          modals: {
            ...get().modals,
            confirmDialog: {
              isOpen: true,
              title,
              message,
              onConfirm
            }
          }
        })
      },

      hideConfirmDialog: () => {
        set({
          modals: {
            ...get().modals,
            confirmDialog: {
              isOpen: false,
              title: '',
              message: '',
              onConfirm: undefined
            }
          }
        })
      },

      // Notifications
      addNotification: (notification) => {
        const id = Date.now().toString()
        const newNotification = { ...notification, id }
        
        set({
          notifications: [...get().notifications, newNotification]
        })
        
        // Auto remove after 5 seconds
        setTimeout(() => {
          get().removeNotification(id)
        }, 5000)
      },

      removeNotification: (id) => {
        set({
          notifications: get().notifications.filter(n => n.id !== id)
        })
      },

      // Theme
      setTheme: (theme) => {
        set({ theme })
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          const root = document.documentElement
          root.classList.remove('light', 'dark')
          
          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            root.classList.add(systemTheme)
          } else {
            root.classList.add(theme)
          }
        }
      },
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        theme: state.theme 
      }),
    }
  )
)
```

### Preferences Store
```typescript
// lib/store/preferencesStore.ts
interface PreferencesState {
  // Display preferences
  currency: 'TRY' | 'USD' | 'EUR'
  language: 'tr' | 'en'
  itemsPerPage: 12 | 24 | 48
  viewMode: 'grid' | 'list'
  
  // Recently viewed
  recentlyViewed: string[] // product IDs
  
  // Search history
  searchHistory: string[]
  
  // Filters
  savedFilters: {
    [key: string]: any
  }
  
  // Notifications
  emailNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  
  // Actions
  setCurrency: (currency: 'TRY' | 'USD' | 'EUR') => void
  setLanguage: (language: 'tr' | 'en') => void
  setItemsPerPage: (count: 12 | 24 | 48) => void
  setViewMode: (mode: 'grid' | 'list') => void
  addToRecentlyViewed: (productId: string) => void
  addToSearchHistory: (query: string) => void
  saveFilter: (name: string, filter: any) => void
  removeFilter: (name: string) => void
  updateNotificationSettings: (settings: Partial<{
    emailNotifications: boolean
    pushNotifications: boolean
    marketingEmails: boolean
  }>) => void
  resetPreferences: () => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      // Initial state
      currency: 'TRY',
      language: 'tr',
      itemsPerPage: 24,
      viewMode: 'grid',
      recentlyViewed: [],
      searchHistory: [],
      savedFilters: {},
      emailNotifications: true,
      pushNotifications: true,
      marketingEmails: false,

      // Display preferences
      setCurrency: (currency) => {
        set({ currency })
      },

      setLanguage: (language) => {
        set({ language })
        
        // Update document language
        if (typeof window !== 'undefined') {
          document.documentElement.lang = language
        }
      },

      setItemsPerPage: (count) => {
        set({ itemsPerPage: count })
      },

      setViewMode: (mode) => {
        set({ viewMode: mode })
      },

      // Recently viewed
      addToRecentlyViewed: (productId) => {
        const { recentlyViewed } = get()
        
        // Remove if already exists and add to beginning
        const filtered = recentlyViewed.filter(id => id !== productId)
        const updated = [productId, ...filtered].slice(0, 20) // Keep last 20
        
        set({ recentlyViewed: updated })
      },

      // Search history
      addToSearchHistory: (query) => {
        if (!query.trim()) return
        
        const { searchHistory } = get()
        const trimmedQuery = query.trim().toLowerCase()
        
        // Remove if already exists and add to beginning
        const filtered = searchHistory.filter(q => q !== trimmedQuery)
        const updated = [trimmedQuery, ...filtered].slice(0, 10) // Keep last 10
        
        set({ searchHistory: updated })
      },

      // Saved filters
      saveFilter: (name, filter) => {
        set({
          savedFilters: {
            ...get().savedFilters,
            [name]: filter
          }
        })
      },

      removeFilter: (name) => {
        const { savedFilters } = get()
        const { [name]: removed, ...rest } = savedFilters
        set({ savedFilters: rest })
      },

      // Notification settings
      updateNotificationSettings: (settings) => {
        set(settings)
      },

      // Reset all preferences
      resetPreferences: () => {
        set({
          currency: 'TRY',
          language: 'tr',
          itemsPerPage: 24,
          viewMode: 'grid',
          recentlyViewed: [],
          searchHistory: [],
          savedFilters: {},
          emailNotifications: true,
          pushNotifications: true,
          marketingEmails: false,
        })
      },
    }),
    {
      name: 'preferences-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

## 🪝 Store Hooks

### Composite Hooks
```typescript
// lib/hooks/useStores.ts

// Combined auth and cart hook
export function useAuthCart() {
  const { user, isAuthenticated } = useAuthStore()
  const { items, totalItems, addItem, removeItem } = useCartStore()
  
  return {
    user,
    isAuthenticated,
    cartItems: items,
    cartCount: totalItems,
    addToCart: addItem,
    removeFromCart: removeItem,
  }
}

// Combined UI and preferences hook
export function useUIPreferences() {
  const { theme, setTheme } = useUIStore()
  const { 
    language, 
    currency, 
    viewMode, 
    setLanguage, 
    setCurrency, 
    setViewMode 
  } = usePreferencesStore()
  
  return {
    theme,
    language,
    currency,
    viewMode,
    setTheme,
    setLanguage,
    setCurrency,
    setViewMode,
  }
}

// Modal management hook
export function useModals() {
  const {
    modals,
    openQuickView,
    closeQuickView,
    openAuthModal,
    closeAuthModal,
    showConfirmDialog,
    hideConfirmDialog,
  } = useUIStore()
  
  return {
    quickView: modals.quickView,
    authModal: modals.authModal,
    confirmDialog: modals.confirmDialog,
    openQuickView,
    closeQuickView,
    openAuthModal,
    closeAuthModal,
    showConfirmDialog,
    hideConfirmDialog,
  }
}
```

### Selector Hooks
```typescript
// lib/hooks/useSelectors.ts

// Optimized selectors to prevent unnecessary re-renders
export const useAuthUser = () => useAuthStore(state => state.user)
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated)
export const useAuthLoading = () => useAuthStore(state => state.isLoading)

export const useCartItems = () => useCartStore(state => state.items)
export const useCartTotal = () => useCartStore(state => ({
  items: state.totalItems,
  amount: state.totalAmount
}))
export const useCartVisibility = () => useCartStore(state => ({
  isOpen: state.isOpen,
  openCart: state.openCart,
  closeCart: state.closeCart,
  toggleCart: state.toggleCart,
}))

export const useTheme = () => useUIStore(state => ({
  theme: state.theme,
  setTheme: state.setTheme,
}))

export const useViewPreferences = () => usePreferencesStore(state => ({
  viewMode: state.viewMode,
  itemsPerPage: state.itemsPerPage,
  setViewMode: state.setViewMode,
  setItemsPerPage: state.setItemsPerPage,
}))
```

## 🔄 State Synchronization

### Cross-Store Actions
```typescript
// lib/utils/storeSync.ts

// Sync cart with authentication state
export const syncCartWithAuth = () => {
  const { isAuthenticated, user } = useAuthStore.getState()
  const { items, clearCart } = useCartStore.getState()
  
  if (!isAuthenticated) {
    // User logged out - keep cart for guest users
    return
  }
  
  if (isAuthenticated && user && items.length > 0) {
    // User logged in with items in cart - sync with server
    syncCartToServer(items, user.id)
  }
}

// Sync preferences with user account
export const syncPreferencesWithAuth = () => {
  const { isAuthenticated, user } = useAuthStore.getState()
  const preferences = usePreferencesStore.getState()
  
  if (isAuthenticated && user) {
    // Save preferences to user account
    saveUserPreferences(user.id, preferences)
  }
}

// Clear user-specific data on logout
export const clearUserData = () => {
  useCartStore.getState().clearCart()
  usePreferencesStore.getState().resetPreferences()
  useUIStore.getState().notifications.forEach(notification => {
    useUIStore.getState().removeNotification(notification.id)
  })
}
```

### State Persistence
```typescript
// lib/utils/statePersistence.ts

// Custom storage engine with encryption
export const createSecureStorage = () => {
  return {
    getItem: (name: string) => {
      const item = localStorage.getItem(name)
      if (!item) return null
      
      try {
        // Decrypt if needed (for sensitive data)
        return JSON.parse(item)
      } catch {
        return null
      }
    },
    
    setItem: (name: string, value: string) => {
      try {
        // Encrypt if needed (for sensitive data)
        localStorage.setItem(name, value)
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    },
    
    removeItem: (name: string) => {
      localStorage.removeItem(name)
    },
  }
}

// Cleanup old data
export const cleanupStoredData = () => {
  const stores = ['auth-store', 'cart-store', 'preferences-store', 'ui-store']
  
  stores.forEach(storeName => {
    try {
      const stored = localStorage.getItem(storeName)
      if (stored) {
        const parsed = JSON.parse(stored)
        
        // Remove if older than 30 days
        if (parsed.timestamp && Date.now() - parsed.timestamp > 30 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem(storeName)
        }
      }
    } catch (error) {
      // Remove corrupted data
      localStorage.removeItem(storeName)
    }
  })
}
```

## 🧪 State Testing

### Store Tests
```typescript
// __tests__/stores/authStore.test.ts
import { useAuthStore } from '@/lib/store/authStore'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('should login user successfully', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
    }

    useAuthStore.getState().login(mockUser)
    
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('should logout user successfully', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
    }

    useAuthStore.getState().login(mockUser)
    useAuthStore.getState().logout()
    
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBe(null)
  })
})

// __tests__/stores/cartStore.test.ts
import { useCartStore } from '@/lib/store/cartStore'

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart()
  })

  it('should add item to cart', () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      finalPrice: 100,
      // ... other product properties
    }

    useCartStore.getState().addItem(mockProduct, 2)
    
    const { items, totalItems, totalAmount } = useCartStore.getState()
    
    expect(items).toHaveLength(1)
    expect(totalItems).toBe(2)
    expect(totalAmount).toBe(200)
    expect(items[0].product.id).toBe('1')
    expect(items[0].quantity).toBe(2)
  })

  it('should update quantity of existing item', () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      finalPrice: 100,
    }

    useCartStore.getState().addItem(mockProduct, 1)
    useCartStore.getState().addItem(mockProduct, 2)
    
    const { items, totalItems } = useCartStore.getState()
    
    expect(items).toHaveLength(1)
    expect(totalItems).toBe(3)
    expect(items[0].quantity).toBe(3)
  })
})
```

## 📊 Performance Optimization

### Zustand Optimizations
```typescript
// Prevent unnecessary re-renders with selectors
const useOptimizedCart = () => {
  // Only re-render when total changes, not individual items
  const total = useCartStore(state => state.totalAmount)
  const itemCount = useCartStore(state => state.totalItems)
  
  return { total, itemCount }
}

// Shallow comparison for objects
import { shallow } from 'zustand/shallow'

const useCartActions = () => useCartStore(
  state => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
    updateQuantity: state.updateQuantity,
  }),
  shallow
)
```

### Memory Management
```typescript
// Cleanup on unmount
export const useStoreCleanup = () => {
  useEffect(() => {
    return () => {
      // Clear temporary UI state
      useUIStore.getState().closeQuickView()
      useUIStore.getState().closeAuthModal()
      useUIStore.getState().hideConfirmDialog()
    }
  }, [])
}
```

---

**Son Güncelleme**: Aralık 2024  
**Doküman Versiyonu**: 1.0 