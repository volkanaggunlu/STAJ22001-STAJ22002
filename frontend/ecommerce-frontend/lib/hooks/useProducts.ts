import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { productsApi } from '../api/services/products'
import { categoriesApi } from '../api/services/categories'
import { Product, ProductFilters, Category } from '../api/types'

// Query Keys
export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...PRODUCT_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
  slug: (slug: string) => [...PRODUCT_QUERY_KEYS.details(), 'slug', slug] as const,
  featured: () => [...PRODUCT_QUERY_KEYS.all, 'featured'] as const,
  bestsellers: () => [...PRODUCT_QUERY_KEYS.all, 'bestsellers'] as const,
  newProducts: () => [...PRODUCT_QUERY_KEYS.all, 'new'] as const,
  discounted: () => [...PRODUCT_QUERY_KEYS.all, 'discounted'] as const,
  bundles: () => [...PRODUCT_QUERY_KEYS.all, 'bundles'] as const,
  search: (query: string, filters?: ProductFilters) => [...PRODUCT_QUERY_KEYS.all, 'search', { query, filters }] as const,
  category: (categorySlug: string, filters?: ProductFilters) => [...PRODUCT_QUERY_KEYS.all, 'category', categorySlug, { filters }] as const,
  brand: (brand: string, filters?: ProductFilters) => [...PRODUCT_QUERY_KEYS.all, 'brand', brand, { filters }] as const,
  related: (productId: string) => [...PRODUCT_QUERY_KEYS.all, 'related', productId] as const,
  reviews: (productId: string, page?: number) => [...PRODUCT_QUERY_KEYS.all, 'reviews', productId, { page }] as const,
  favorites: () => [...PRODUCT_QUERY_KEYS.all, 'favorites'] as const,
}

export const CATEGORY_QUERY_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORY_QUERY_KEYS.all, 'list'] as const,
  list: () => [...CATEGORY_QUERY_KEYS.lists()] as const,
  details: () => [...CATEGORY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CATEGORY_QUERY_KEYS.details(), id] as const,
  slug: (slug: string) => [...CATEGORY_QUERY_KEYS.details(), 'slug', slug] as const,
  tree: () => [...CATEGORY_QUERY_KEYS.all, 'tree'] as const,
  breadcrumb: (categoryId: string) => [...CATEGORY_QUERY_KEYS.all, 'breadcrumb', categoryId] as const,
}

// Products Hooks
export const useProducts = (filters?: ProductFilters, queryOptions?: any) => {
  return useQuery<any>({
    queryKey: PRODUCT_QUERY_KEYS.list(filters),
    queryFn: () => productsApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    ...(queryOptions || {}),
  })
}

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: () => productsApi.getProductById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.slug(slug),
    queryFn: () => productsApi.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.featured(),
    queryFn: () => productsApi.getFeaturedProducts(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export const useBestsellers = (limit?: number) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.bestsellers(),
    queryFn: () => productsApi.getBestsellers(limit),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export const useNewProducts = (limit?: number) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.newProducts(),
    queryFn: () => productsApi.getNewProducts(limit),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export const useDiscountedProducts = (limit?: number) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.discounted(),
    queryFn: () => productsApi.getDiscountedProducts(limit),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export const useBundles = (limit?: number) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.bundles(),
    queryFn: () => productsApi.getBundles(limit),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export const useSearchProducts = (query: string, filters?: ProductFilters) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.search(query, filters),
    queryFn: () => productsApi.searchProducts(query, filters),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useProductsByCategory = (categorySlug: string, filters?: ProductFilters, queryOptions?: any) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.category(categorySlug, filters),
    queryFn: () => productsApi.getProductsByCategory(categorySlug, filters),
    enabled: !!categorySlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...(queryOptions || {}),
  })
}

export const useProductsByBrand = (brand: string, filters?: ProductFilters) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.brand(brand, filters),
    queryFn: () => productsApi.getProductsByBrand(brand, filters),
    enabled: !!brand,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useRelatedProducts = (productId: string) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.related(productId),
    queryFn: () => productsApi.getRelatedProducts(productId),
    enabled: !!productId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export const useProductReviews = (productId: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.reviews(productId, page),
    queryFn: () => productsApi.getProductReviews(productId, page, limit),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useFavorites = () => {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.favorites(),
    queryFn: () => productsApi.getFavorites(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Categories Hooks
export const useCategories = () => {
  return useQuery<any>({
    queryKey: CATEGORY_QUERY_KEYS.list(),
    queryFn: () => categoriesApi.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export const useCategoryTree = () => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.tree(),
    queryFn: () => categoriesApi.getCategoryTree(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.detail(id),
    queryFn: () => categoriesApi.getCategoryById(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export const useCategoryBySlug = (slug: string) => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.slug(slug),
    queryFn: () => categoriesApi.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export const useCategoryBreadcrumb = (categoryId: string) => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.breadcrumb(categoryId),
    queryFn: () => categoriesApi.getCategoryBreadcrumb(categoryId),
    enabled: !!categoryId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Mutation Hooks
export const useTrackProductView = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (productId: string) => productsApi.trackProductView(productId),
    onError: (error) => {
      console.error('Failed to track product view:', error)
      // Silent fail - tracking is not critical
    }
  })
}

export const useAddToFavorites = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (productId: string) => productsApi.addToFavorites(productId),
    onSuccess: () => {
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.favorites() })
      toast.success('Ürün favorilere eklendi')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Favoriye eklenirken hata oluştu')
    }
  })
}

export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (productId: string) => productsApi.removeFromFavorites(productId),
    onSuccess: () => {
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.favorites() })
      toast.success('Ürün favorilerden çıkarıldı')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Favoriden çıkarılırken hata oluştu')
    }
  })
}

// Toggle favorites hook
export const useToggleFavorite = () => {
  const addToFavorites = useAddToFavorites()
  const removeFromFavorites = useRemoveFromFavorites()
  
  const toggleFavorite = async (productId: string, isFavorite: boolean): Promise<void> => {
    if (isFavorite) {
      return new Promise((resolve, reject) => {
        removeFromFavorites.mutate(productId, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        })
      })
    } else {
      return new Promise((resolve, reject) => {
        addToFavorites.mutate(productId, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        })
      })
    }
  }
  
  return {
    toggleFavorite,
    isLoading: addToFavorites.isPending || removeFromFavorites.isPending
  }
} 