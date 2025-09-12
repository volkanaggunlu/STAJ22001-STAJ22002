# 🔌 API Integration (API Entegrasyonu)

## 📋 Genel Bakış

Açık Atölye frontend projesi **Express.js + MongoDB** backend'i ile **RESTful API** üzerinden haberleşir. API entegrasyonu **Axios** HTTP client'ı ve **TanStack Query** server state management ile yönetilir.

## 🏗️ API Architecture

### API Client Yapısı
```
lib/api/
├── client.ts              # Ana Axios client
├── types.ts              # API tip tanımları
└── services/             # Endpoint servisleri
    ├── auth.ts          # Authentication API
    ├── products.ts      # Products API
    ├── categories.ts    # Categories API
    ├── admin.ts         # Admin API
    └── orders.ts        # Orders API
```

### Base Configuration
```typescript
// lib/api/client.ts
import axios, { AxiosError, AxiosResponse } from 'axios'

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = AuthStorage.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request timestamp
    config.metadata = { startTime: new Date() }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration
    const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime()
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`)
    }
    
    return response
  },
  async (error: AxiosError) => {
    const original = error.config
    
    // Token refresh logic
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      
      const refreshSuccess = await AuthStorage.handleTokenRefresh()
      if (refreshSuccess) {
        const token = AuthStorage.getAccessToken()
        original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      } else {
        // Redirect to login
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message)
      throw new Error('Bağlantı hatası oluştu')
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${error.response.status} ${error.config?.url}`)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
```

## 🔗 API Types

### Common Types
```typescript
// lib/api/types.ts
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
    totalPages?: number
  }
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
  statusCode: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  featured?: boolean
}

export type ProductFilters = PaginationParams & FilterParams
```

### Product Types
```typescript
// Product related types
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number
  originalPrice: number
  finalPrice: number
  discount?: number
  sku: string
  stock: number
  inStock: boolean
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  
  // Media
  images: string[]
  thumbnail: string
  
  // Category
  category: {
    id: string
    name: string
    slug: string
  }
  
  // Brand
  brand?: {
    id: string
    name: string
    slug: string
  }
  
  // Reviews
  rating: number
  reviewCount: number
  
  // SEO
  metaTitle?: string
  metaDescription?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateProductDto {
  name: string
  description: string
  shortDescription?: string
  price: number
  originalPrice?: number
  sku: string
  stock: number
  categoryId: string
  brandId?: string
  images: string[]
  isActive?: boolean
  isFeatured?: boolean
  metaTitle?: string
  metaDescription?: string
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string
}
```

## 🛍️ Service Layer

### Products API Service
```typescript
// lib/api/services/products.ts
export const productsApi = {
  // Get products with filters
  getProducts: async (filters?: ProductFilters): Promise<ApiResponse<{
    products: Product[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }>> => {
    const { data } = await apiClient.get('/products', { params: filters })
    return data
  },

  // Get single product
  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.get(`/products/${id}`)
    return data
  },

  // Get product by slug
  getProductBySlug: async (slug: string): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.get(`/products/slug/${slug}`)
    return data
  },

  // Get featured products
  getFeaturedProducts: async (limit = 8): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get('/products/featured', { 
      params: { limit } 
    })
    return data
  },

  // Get new products
  getNewProducts: async (limit = 8): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get('/products/new', { 
      params: { limit } 
    })
    return data
  },

  // Get bestsellers
  getBestsellers: async (limit = 8): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get('/products/bestsellers', { 
      params: { limit } 
    })
    return data
  },

  // Search products
  searchProducts: async (query: string, filters?: Partial<ProductFilters>): Promise<ApiResponse<{
    products: Product[]
    suggestions: string[]
    pagination: any
  }>> => {
    const { data } = await apiClient.get('/products/search', { 
      params: { q: query, ...filters } 
    })
    return data
  },

  // Get related products
  getRelatedProducts: async (productId: string, limit = 4): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get(`/products/${productId}/related`, { 
      params: { limit } 
    })
    return data
  },

  // Admin: Create product
  createProduct: async (product: CreateProductDto): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.post('/admin/products', product)
    return data
  },

  // Admin: Update product
  updateProduct: async (id: string, product: UpdateProductDto): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.put(`/admin/products/${id}`, product)
    return data
  },

  // Admin: Delete product
  deleteProduct: async (id: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(`/admin/products/${id}`)
    return data
  },

  // Admin: Upload product images
  uploadProductImages: async (productId: string, files: FileList): Promise<ApiResponse<{ images: string[] }>> => {
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('images', file)
    })
    
    const { data } = await apiClient.post(`/admin/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },
}
```

### Categories API Service
```typescript
// lib/api/services/categories.ts
export const categoriesApi = {
  // Get all categories
  getCategories: async (): Promise<ApiResponse<{ categories: Category[] }>> => {
    const { data } = await apiClient.get('/categories')
    return data
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string): Promise<ApiResponse<Category>> => {
    const { data } = await apiClient.get(`/categories/slug/${slug}`)
    return data
  },

  // Get category tree (hierarchical)
  getCategoryTree: async (): Promise<ApiResponse<{ categories: CategoryTree[] }>> => {
    const { data } = await apiClient.get('/categories/tree')
    return data
  },

  // Get products by category
  getProductsByCategory: async (
    categorySlug: string, 
    filters?: ProductFilters
  ): Promise<ApiResponse<{
    products: Product[]
    category: Category
    pagination: any
  }>> => {
    const { data } = await apiClient.get(`/categories/${categorySlug}/products`, {
      params: filters
    })
    return data
  },

  // Admin: Create category
  createCategory: async (category: CreateCategoryDto): Promise<ApiResponse<Category>> => {
    const { data } = await apiClient.post('/admin/categories', category)
    return data
  },

  // Admin: Update category
  updateCategory: async (id: string, category: UpdateCategoryDto): Promise<ApiResponse<Category>> => {
    const { data } = await apiClient.put(`/admin/categories/${id}`, category)
    return data
  },

  // Admin: Delete category
  deleteCategory: async (id: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(`/admin/categories/${id}`)
    return data
  },
}
```

### Admin API Service
```typescript
// lib/api/services/admin.ts
export const adminApi = {
  // Dashboard stats
  getDashboardStats: async (): Promise<ApiResponse<{
    totalProducts: number
    totalUsers: number
    totalOrders: number
    monthlySales: number
    trends: {
      products: string
      users: string
      orders: string
      sales: string
    }
  }>> => {
    const { data } = await apiClient.get('/admin/dashboard/stats')
    return data
  },

  // Recent orders
  getRecentOrders: async (limit = 5): Promise<ApiResponse<{ orders: Order[] }>> => {
    const { data } = await apiClient.get('/admin/orders/recent', {
      params: { limit }
    })
    return data
  },

  // Top products
  getTopProducts: async (limit = 5): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get('/admin/products/top', {
      params: { limit }
    })
    return data
  },

  // Sales data for charts
  getSalesData: async (period: '7d' | '30d' | '6m' | '1y'): Promise<ApiResponse<{
    labels: string[]
    data: number[]
  }>> => {
    const { data } = await apiClient.get('/admin/analytics/sales', {
      params: { period }
    })
    return data
  },

  // Category distribution
  getCategoryDistribution: async (): Promise<ApiResponse<{
    labels: string[]
    data: number[]
  }>> => {
    const { data } = await apiClient.get('/admin/analytics/categories')
    return data
  },

  // User analytics
  getUserAnalytics: async (): Promise<ApiResponse<{
    newUsers: number
    activeUsers: number
    totalUsers: number
  }>> => {
    const { data } = await apiClient.get('/admin/analytics/users')
    return data
  },
}
```

## 🪝 Custom Query Hooks

### Product Hooks
```typescript
// lib/hooks/useProducts.ts
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['product', 'slug', slug],
    queryFn: () => productsApi.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getFeaturedProducts(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export function useNewProducts(limit = 8) {
  return useQuery({
    queryKey: ['products', 'new', limit],
    queryFn: () => productsApi.getNewProducts(limit),
    staleTime: 10 * 60 * 1000,
  })
}

export function useBestsellers(limit = 8) {
  return useQuery({
    queryKey: ['products', 'bestsellers', limit],
    queryFn: () => productsApi.getBestsellers(limit),
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useSearchProducts(query: string, filters?: Partial<ProductFilters>) {
  return useQuery({
    queryKey: ['products', 'search', query, filters],
    queryFn: () => productsApi.searchProducts(query, filters),
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useRelatedProducts(productId: string, limit = 4) {
  return useQuery({
    queryKey: ['products', 'related', productId, limit],
    queryFn: () => productsApi.getRelatedProducts(productId, limit),
    enabled: !!productId,
    staleTime: 30 * 60 * 1000,
  })
}
```

### Category Hooks
```typescript
// lib/hooks/useCategories.ts
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['category', 'slug', slug],
    queryFn: () => categoriesApi.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  })
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => categoriesApi.getCategoryTree(),
    staleTime: 60 * 60 * 1000,
  })
}

export function useProductsByCategory(categorySlug: string, filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', 'category', categorySlug, filters],
    queryFn: () => categoriesApi.getProductsByCategory(categorySlug, filters),
    enabled: !!categorySlug,
    staleTime: 5 * 60 * 1000,
  })
}
```

### Mutation Hooks
```typescript
// lib/hooks/useProductMutations.ts
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      toast.success('Ürün başarıyla oluşturuldu!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ürün oluşturulamadı!')
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, product }: { id: string; product: UpdateProductDto }) =>
      productsApi.updateProduct(id, product),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      toast.success('Ürün başarıyla güncellendi!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ürün güncellenemedi!')
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      toast.success('Ürün başarıyla silindi!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ürün silinemedi!')
    },
  })
}
```

## 🔧 Query Configuration

### Global Query Client Setup
```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        // Global error handling for mutations
        if (error?.response?.status === 401) {
          useAuthStore.getState().logout()
        }
      },
    },
  },
})
```

### Query Keys Factory
```typescript
// lib/queryKeys.ts
export const QUERY_KEYS = {
  // Products
  PRODUCTS: ['products'] as const,
  PRODUCT: (id: string) => ['product', id] as const,
  PRODUCT_BY_SLUG: (slug: string) => ['product', 'slug', slug] as const,
  FEATURED_PRODUCTS: ['products', 'featured'] as const,
  NEW_PRODUCTS: (limit: number) => ['products', 'new', limit] as const,
  BESTSELLERS: (limit: number) => ['products', 'bestsellers', limit] as const,
  SEARCH_PRODUCTS: (query: string, filters?: any) => ['products', 'search', query, filters] as const,
  RELATED_PRODUCTS: (id: string, limit: number) => ['products', 'related', id, limit] as const,
  
  // Categories
  CATEGORIES: ['categories'] as const,
  CATEGORY: (id: string) => ['category', id] as const,
  CATEGORY_BY_SLUG: (slug: string) => ['category', 'slug', slug] as const,
  CATEGORY_TREE: ['categories', 'tree'] as const,
  PRODUCTS_BY_CATEGORY: (slug: string, filters?: any) => ['products', 'category', slug, filters] as const,
  
  // Admin
  ADMIN_STATS: ['admin', 'stats'] as const,
  ADMIN_RECENT_ORDERS: ['admin', 'orders', 'recent'] as const,
  ADMIN_TOP_PRODUCTS: ['admin', 'products', 'top'] as const,
  ADMIN_SALES_DATA: (period: string) => ['admin', 'analytics', 'sales', period] as const,
  ADMIN_CATEGORY_DISTRIBUTION: ['admin', 'analytics', 'categories'] as const,
  
  // Auth
  CURRENT_USER: ['auth', 'me'] as const,
} as const
```

## 📊 Caching Strategy

### Cache Invalidation
```typescript
// utils/cacheUtils.ts
export const invalidateProductCaches = (queryClient: QueryClient, productId?: string) => {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FEATURED_PRODUCTS })
  queryClient.invalidateQueries({ queryKey: ['products', 'new'] })
  queryClient.invalidateQueries({ queryKey: ['products', 'bestsellers'] })
  
  if (productId) {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCT(productId) })
    queryClient.invalidateQueries({ queryKey: ['products', 'related', productId] })
  }
}

export const invalidateAdminCaches = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['admin'] })
}
```

### Background Refetch
```typescript
// Background refetch for critical data
export const useBackgroundRefetch = () => {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Refetch dashboard stats every 5 minutes
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.ADMIN_STATS,
        exact: true 
      })
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [queryClient])
}
```

## 🚦 Loading & Error States

### Loading States
```typescript
// Custom hook for loading states
export function useApiState() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const execute = async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await apiCall()
      return result
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Bir hata oluştu'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }
  
  return { isLoading, error, execute }
}
```

### Error Boundary
```typescript
// components/ErrorBoundary.tsx
export class ApiErrorBoundary extends Component {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('API Error:', error, errorInfo)
    
    // Send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { extra: errorInfo })
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Bir sorun oluştu</h2>
          <p className="text-gray-600 mb-4">Sayfa yüklenirken bir hata oluştu.</p>
          <Button onClick={() => window.location.reload()}>
            Sayfayı Yenile
          </Button>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

---

**Son Güncelleme**: Aralık 2024  
**Doküman Versiyonu**: 1.0 