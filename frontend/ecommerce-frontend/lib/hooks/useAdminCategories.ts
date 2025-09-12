import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '../api/services/admin'
import { Category } from '../api/types'

// Query Keys
export const ADMIN_CATEGORY_QUERY_KEYS = {
  all: ['admin', 'categories'] as const,
  lists: () => [...ADMIN_CATEGORY_QUERY_KEYS.all, 'list'] as const,
  list: () => [...ADMIN_CATEGORY_QUERY_KEYS.lists()] as const,
  tree: () => [...ADMIN_CATEGORY_QUERY_KEYS.all, 'tree'] as const,
  details: () => [...ADMIN_CATEGORY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ADMIN_CATEGORY_QUERY_KEYS.details(), id] as const,
}

// Hook'lar
export const useAdminCategories = () => {
  return useQuery({
    queryKey: ADMIN_CATEGORY_QUERY_KEYS.list(),
    queryFn: () => adminApi.adminCategories.getAll(),
    staleTime: 5 * 60 * 1000, // 5 dakika
  })
}

export const useAdminCategoryTree = () => {
  return useQuery({
    queryKey: ADMIN_CATEGORY_QUERY_KEYS.tree(),
    queryFn: () => adminApi.adminCategories.getTree(),
    staleTime: 5 * 60 * 1000, // 5 dakika
  })
}

export const useAdminCategory = (id: string) => {
  return useQuery({
    queryKey: ADMIN_CATEGORY_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const res = await adminApi.adminCategories.getById(id)
      return res ?? null
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 dakika
  })
}

// Mutations
export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: adminApi.adminCategories.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORY_QUERY_KEYS.all })
      toast.success('Kategori başarıyla oluşturuldu')
      return data
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Kategori oluşturulamadı'
      toast.error(message)
      throw error
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      adminApi.adminCategories.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORY_QUERY_KEYS.all })
      queryClient.invalidateQueries({ 
        queryKey: ADMIN_CATEGORY_QUERY_KEYS.detail(variables.id) 
      })
      toast.success('Kategori başarıyla güncellendi')
      return data
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Kategori güncellenemedi'
      toast.error(message)
      throw error
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: adminApi.adminCategories.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORY_QUERY_KEYS.all })
      toast.success('Kategori başarıyla silindi')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Kategori silinemedi'
      toast.error(message)
      throw error
    },
  })
}

export const useUpdateCategoryStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) =>
      adminApi.adminCategories.updateStatus(id, isActive),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORY_QUERY_KEYS.all })
      queryClient.invalidateQueries({ 
        queryKey: ADMIN_CATEGORY_QUERY_KEYS.detail(variables.id) 
      })
      toast.success(`Kategori ${variables.isActive ? 'aktifleştirildi' : 'deaktifleştirildi'}`)
      return data
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Kategori durumu değiştirilemedi'
      toast.error(message)
      throw error
    },
  })
}

export const useBulkCategoryActions = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ action, categoryIds }: { 
      action: 'activate' | 'deactivate' | 'delete', 
      categoryIds: string[] 
    }) => adminApi.adminCategories.bulkActions(action, categoryIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORY_QUERY_KEYS.all })
      
      const actionMessages = {
        activate: 'Kategoriler aktifleştirildi',
        deactivate: 'Kategoriler deaktifleştirildi',
        delete: 'Kategoriler silindi'
      }
      
      toast.success(actionMessages[variables.action])
      return data
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Toplu işlem başarısız'
      toast.error(message)
      throw error
    },
  })
}

export const useUpdateCategoryOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: adminApi.adminCategories.updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORY_QUERY_KEYS.all })
      toast.success('Kategori sıralaması güncellendi')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Sıralama güncellenemedi'
      toast.error(message)
      throw error
    },
  })
}

export const useUploadCategoryImage = () => {
  return useMutation({
    mutationFn: ({ file, categoryId }: { file: File, categoryId?: string }) =>
      adminApi.adminCategories.uploadImage(file, categoryId),
    onSuccess: (data) => {
      toast.success('Resim başarıyla yüklendi')
      return data
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Resim yüklenemedi'
      toast.error(message)
      throw error
    },
  })
} 