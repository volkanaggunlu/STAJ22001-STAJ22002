import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '../api/services/admin'
import { QUERY_KEYS } from '../utils/constants'

// Admin Products Query Keys
export const ADMIN_PRODUCT_QUERY_KEYS = {
  all: ['admin', 'products'] as const,
  lists: () => [...ADMIN_PRODUCT_QUERY_KEYS.all, 'list'] as const,
  list: (params?: any) => [...ADMIN_PRODUCT_QUERY_KEYS.lists(), { params }] as const,
  detail: (id: string) => [...ADMIN_PRODUCT_QUERY_KEYS.all, 'detail', id] as const,
  topSelling: (limit?: number) => [...ADMIN_PRODUCT_QUERY_KEYS.all, 'top-selling', { limit }] as const,
}

// Admin Products Hooks

/**
 * Admin ürün listesi hook'u
 * Pagination, arama, filtreleme desteği ile
 */
export const useAdminProducts = (params?: {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: string
  type?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: ADMIN_PRODUCT_QUERY_KEYS.list(params),
    queryFn: () => adminApi.getProducts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes (admin data daha sık güncellenebilir)
    refetchOnWindowFocus: false,
  })
}

/**
 * En çok satan ürünler (admin dashboard için)
 */
export const useAdminTopProducts = (limit: number = 10) => {
  return useQuery({
    queryKey: ADMIN_PRODUCT_QUERY_KEYS.topSelling(limit),
    queryFn: () => adminApi.getTopProducts(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Ürün oluşturma mutation
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productData: any) => adminApi.createProduct(productData),
    onSuccess: () => {
      // Tüm admin products query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCT_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_STATS })
      toast.success('Ürün başarıyla oluşturuldu')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ürün oluşturulurken hata oluştu')
    }
  })
}

/**
 * Ürün güncelleme mutation
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateProduct(id, data),
    onSuccess: (data, variables) => {
      // Specific product ve tüm lists'i invalidate et
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCT_QUERY_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCT_QUERY_KEYS.all })
      toast.success('Ürün başarıyla güncellendi')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ürün güncellenirken hata oluştu')
    }
  })
}

/**
 * Ürün status değiştirme mutation
 */
export const useUpdateProductStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'discontinued' }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Status güncelleme başlatılıyor:', { id, status })
      }
      return adminApi.updateProductStatus(id, status)
    },
    onSuccess: (data, variables) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Status güncelleme başarılı:', { data, variables })
        console.log('🔄 Query invalidation başlatılıyor...')
      }
      
      // Tüm admin products query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCT_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_STATS })
      
      // Force refetch de yapalım
      queryClient.refetchQueries({ queryKey: ADMIN_PRODUCT_QUERY_KEYS.all })
      
      toast.success('Ürün durumu güncellendi')
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Query invalidation tamamlandı')
      }
    },
    onError: (error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Status güncelleme hatası:', error)
      }
      toast.error(error.response?.data?.message || 'Durum güncellenirken hata oluştu')
    }
  })
}

/**
 * Ürün silme mutation
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCT_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_STATS })
      toast.success('Ürün başarıyla silindi')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ürün silinirken hata oluştu')
    }
  })
}

/**
 * Bulk ürün işlemleri mutation
 */
export const useBulkProductActions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ action, productIds, data }: { 
      action: 'delete' | 'updateStatus' | 'updateCategory'
      productIds: string[]
      data?: any 
    }) => adminApi.bulkProductActions(action, productIds, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCT_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_STATS })
      
      const actionText = {
        delete: 'silindi',
        updateStatus: 'durumu güncellendi',
        updateCategory: 'kategorisi güncellendi'
      }[variables.action]
      
      toast.success(`${variables.productIds.length} ürün ${actionText}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Toplu işlem sırasında hata oluştu')
    }
  })
}

/**
 * Ürün resim upload mutation
 */
export const useUploadProductImages = () => {
  return useMutation({
    mutationFn: ({ files, productId }: { files: FileList; productId?: string }) => 
      adminApi.uploadProductImages(files, productId),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Resim yüklenirken hata oluştu')
    }
  })
} 