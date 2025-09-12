import { apiClient } from '../client'
import { 
  ApiResponse, 
  Product, 
  ProductFilters,
  Category,
  Review,
  SearchResult
} from '../types'
import { API_ENDPOINTS } from '@/lib/utils/constants'

// Products API Service
export const productsApi = {
  // Get all products with filters and pagination
  getProducts: async (filters?: ProductFilters): Promise<ApiResponse<{
    products: Product[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    filters: {
      categories: Category[]
      brands: string[]
      priceRange: { min: number, max: number }
    }
  }>> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const { data } = await apiClient.get(
      `${API_ENDPOINTS.PRODUCTS.LIST}?${params.toString()}`
    )
    return data as ApiResponse<any>
  },

  // Get single product by ID
  getProductById: async (id: string): Promise<ApiResponse<{ product: Product }>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.DETAIL}/${id}`)
    return data as ApiResponse<{ product: Product }>
  },

  // Get single product by slug
  getProductBySlug: async (slug: string): Promise<ApiResponse<{ product: Product }>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.PRODUCTS.BY_SLUG}/${slug}`)
    return data as ApiResponse<{ product: Product }>
  },

  // Get featured products
  getFeaturedProducts: async (): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PRODUCTS.FEATURED)
    return data as ApiResponse<{ products: Product[] }>
  },

  // Get bestseller products
  getBestsellers: async (limit = 12): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get(
      `${API_ENDPOINTS.PRODUCTS.BESTSELLERS}?limit=${limit}`
    )
    return data as ApiResponse<{ products: Product[] }>
  },

  // Get new products
  getNewProducts: async (limit = 12): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get(
      `${API_ENDPOINTS.PRODUCTS.NEW}?limit=${limit}`
    )
    return data as ApiResponse<{ products: Product[] }>
  },

  // Get discounted products
  getDiscountedProducts: async (limit = 12): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get(
      `${API_ENDPOINTS.PRODUCTS.DISCOUNTED}?limit=${limit}`
    )
    return data as ApiResponse<{ products: Product[] }>
  },

  // Get bundle products
  getBundles: async (limit = 12): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get(
      `${API_ENDPOINTS.PRODUCTS.BUNDLES}?limit=${limit}`
    )
    return data as ApiResponse<{ products: Product[] }>
  },

  // Search products
  searchProducts: async (query: string, filters?: ProductFilters): Promise<ApiResponse<SearchResult>> => {
    const params = new URLSearchParams({ q: query })
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const { data } = await apiClient.get(
      `${API_ENDPOINTS.PRODUCTS.SEARCH}?${params.toString()}`
    )
    return data as ApiResponse<SearchResult>
  },

  // Get products by category
  getProductsByCategory: async (
    categorySlug: string, 
    filters?: ProductFilters
  ): Promise<ApiResponse<{
    products: Product[]
    category: Category
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const { data } = await apiClient.get(
      `${API_ENDPOINTS.PRODUCTS.BY_CATEGORY(categorySlug)}?${params.toString()}`
    )
    return data as ApiResponse<any>
  },

  // Get products by brand
  getProductsByBrand: async (
    brand: string, 
    filters?: ProductFilters
  ): Promise<ApiResponse<{
    products: Product[]
    brand: string
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }>> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    const { data } = await apiClient.get(
      `${API_ENDPOINTS.PRODUCTS.BY_BRAND(brand)}?${params.toString()}`
    )
    return data as ApiResponse<any>
  },

  // Get related products
  getRelatedProducts: async (productId: string): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.PRODUCTS.RELATED(productId))
    return data as ApiResponse<{ products: Product[] }>
  },

  // Get product reviews
  getProductReviews: async (
    productId: string,
    page = 1,
    limit = 10
  ): Promise<ApiResponse<{
    reviews: Review[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    stats: {
      averageRating: number
      totalReviews: number
      ratingDistribution: { [key: number]: number }
    }
  }>> => {
    const { data } = await apiClient.get(
      `${API_ENDPOINTS.PRODUCTS.REVIEWS(productId)}?page=${page}&limit=${limit}`
    )
    return data as ApiResponse<any>
  },

  // Track product view
  trackProductView: async (productId: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.PRODUCTS.VIEW(productId))
    return data as ApiResponse<void>
  },

  // Add to favorites
  addToFavorites: async (productId: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(`${API_ENDPOINTS.USERS.FAVORITE_BY_ID}/${productId}`)
    return data as ApiResponse<void>
  },

  // Remove from favorites
  removeFromFavorites: async (productId: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(`${API_ENDPOINTS.USERS.FAVORITE_BY_ID}/${productId}`)
    return data as ApiResponse<void>
  },

  // Get user favorites
  getFavorites: async (): Promise<ApiResponse<{ products: Product[] }>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.USERS.FAVORITES)
    return data as ApiResponse<{ products: Product[] }>
  }
}

// Export for external use
export default productsApi 