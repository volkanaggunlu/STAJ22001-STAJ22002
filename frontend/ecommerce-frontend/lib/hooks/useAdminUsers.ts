import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api/services/admin'
import { QUERY_KEYS } from '@/lib/utils/constants'

export const ADMIN_USER_QUERY_KEYS = {
  all: ['admin', 'users'] as const,
  lists: () => [...ADMIN_USER_QUERY_KEYS.all, 'list'] as const,
  list: (params?: any) => [...ADMIN_USER_QUERY_KEYS.lists(), { params }] as const,
  detail: (id: string) => [...ADMIN_USER_QUERY_KEYS.all, 'detail', id] as const,
}

export const useAdminUsers = (params?: {
  page?: number
  limit?: number
  search?: string
  role?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) => {
  return useQuery({
    queryKey: ADMIN_USER_QUERY_KEYS.list(params),
    queryFn: () => adminApi.getUsers(params),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USER_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN_STATS })
      toast.success('Kullanıcı başarıyla silindi')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Kullanıcı silinirken hata oluştu')
    }
  })
}

export const useAdminUserRecentOrders = (userId: string) => {
  return useQuery({
    queryKey: [...ADMIN_USER_QUERY_KEYS.all, 'recent-orders', userId],
    queryFn: () => adminApi.getUserRecentOrders(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  })
}


