import { apiClient } from '../client'
import { 
  ApiResponse, 
  Category
} from '../types'
import { API_ENDPOINTS } from '@/lib/utils/constants'

// Categories API Service
export const categoriesApi = {
  // Get all categories with hierarchy
  getCategories: async (): Promise<ApiResponse<{ categories: Category[] }>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.CATEGORIES.LIST)
    return data as ApiResponse<{ categories: Category[] }>
  },

  // Get single category by ID
  getCategoryById: async (id: string): Promise<ApiResponse<{ category: Category }>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.CATEGORIES.BY_ID(id))
    return data as ApiResponse<{ category: Category }>
  },

  // Get single category by slug
  getCategoryBySlug: async (slug: string): Promise<ApiResponse<{ category: Category }>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.CATEGORIES.BY_SLUG(slug))
    return data as ApiResponse<{ category: Category }>
  },

  // Get category tree for navigation
  getCategoryTree: async (): Promise<ApiResponse<{ categories: Category[] }>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.CATEGORIES.LIST}?tree=true`)
    return data as ApiResponse<{ categories: Category[] }>
  },

  // Get root categories (level 0)
  getRootCategories: async (): Promise<ApiResponse<{ categories: Category[] }>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.CATEGORIES.LIST}?level=0`)
    return data as ApiResponse<{ categories: Category[] }>
  },

  // Get subcategories of a parent category
  getSubcategories: async (parentId: string): Promise<ApiResponse<{ categories: Category[] }>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.CATEGORIES.LIST}?parent=${parentId}`)
    return data as ApiResponse<{ categories: Category[] }>
  },

  // Get category breadcrumb path
  getCategoryBreadcrumb: async (categoryId: string): Promise<ApiResponse<{ breadcrumb: Category[] }>> => {
    const { data } = await apiClient.get(`${API_ENDPOINTS.CATEGORIES.BY_ID(categoryId)}/breadcrumb`)
    return data as ApiResponse<{ breadcrumb: Category[] }>
  }
}

// Export for external use
export default categoriesApi 