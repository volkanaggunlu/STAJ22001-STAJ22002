import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '../api/services/auth'
import { useAuthStore } from '../store/authStore'
import { LoginRequest, RegisterRequest } from '../api/types'
import { QUERY_KEYS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants'
import { useEffect } from 'react'

// Login hook
export const useLogin = () => {
  const router = useRouter()
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (response) => {
      if (response.success && response.data.user) {

        if(response.data.tokens?.accessToken){
          localStorage.setItem('token',response.data.tokens.accessToken)
        }

        login(response.data.user)
        toast.success(SUCCESS_MESSAGES.LOGIN)
        
        // Redirect based on user role
        if (response.data.user.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || ERROR_MESSAGES.INVALID_CREDENTIALS
      toast.error(message)
    }
  })
}

// Register hook
export const useRegister = () => {
  const router = useRouter()
  const { login } = useAuthStore()

  return useMutation({
    mutationFn: (userData: RegisterRequest) => authApi.register(userData),
    onSuccess: (response) => {
      if (response.success && response.data.user) {
        login(response.data.user)
        toast.success(SUCCESS_MESSAGES.REGISTER)
        router.push('/')
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || ERROR_MESSAGES.VALIDATION
      toast.error(message)
    }
  })
}

// Logout hook
export const useLogout = () => {
  const queryClient = useQueryClient()
  const { logout: logoutStore } = useAuthStore()
  const router = useRouter()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear auth store
      logoutStore()
      
      // Clear all cached queries
      queryClient.clear()
      
      toast.success(SUCCESS_MESSAGES.LOGOUT)
      router.push('/login')
    },
    onError: (error: any) => {
      // Even if logout API fails, clear local state
      logoutStore()
      queryClient.clear()
      
      const message = error.response?.data?.message || 'Çıkış yapılırken hata oluştu'
      toast.error(message)
      router.push('/login')
    }
  })
}

// Forgot password hook
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success(SUCCESS_MESSAGES.PASSWORD_RESET_SENT)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Şifre sıfırlama maili gönderilemedi'
      toast.error(message)
    }
  })
}

// Reset password hook
export const useResetPassword = () => {
  const router = useRouter()

  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success(SUCCESS_MESSAGES.PASSWORD_RESET)
      router.push('/login')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Şifre sıfırlanamadı'
      toast.error(message)
    }
  })
}

// Email verification hook
export const useVerifyEmail = () => {
  const { updateUser } = useAuthStore()

  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: () => {
      // Update user verification status
      updateUser({ isVerified: true })
      toast.success(SUCCESS_MESSAGES.EMAIL_VERIFIED)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Email doğrulanamadı'
      toast.error(message)
    }
  })
}

// Resend verification hook
export const useResendVerification = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
    onSuccess: () => {
      toast.success('Doğrulama emaili tekrar gönderildi')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Email gönderilemedi'
      toast.error(message)
    }
  })
}

// Current user query
export const useCurrentUser = () => {
  const { user, isAuthenticated } = useAuthStore()
  
  return useQuery({
    queryKey: QUERY_KEYS.USER,
    queryFn: () => authApi.getCurrentUser(),
    enabled: isAuthenticated && !!authApi.getCurrentToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    initialData: user ? { success: true, data: { user }, message: '', timestamp: '' } : undefined
  })
}

// Auth check hook - for protected routes
export const useAuthCheck = () => {
  const { checkAuth, isAuthenticated, isInitialized } = useAuthStore()

  return useQuery({
    queryKey: ['auth-check'],
    queryFn: () => checkAuth(),
    enabled: isInitialized && !isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false
  })
}

// Hook to check if user has specific role
export const useHasRole = (role: string) => {
  const { user } = useAuthStore()
  return user?.role === role
}

// Custom hook for auth state
export const useAuth = () => {
  const authStore = useAuthStore()
  return authStore
}

// Admin role check hook
export function useIsAdmin() {
  const { user, isAuthenticated } = useAuth()
  return isAuthenticated && user?.role === 'admin'
}

// Admin route protection hook - FIX: Bu hook 404'e yönlendirmiyor artık
export function useRequireAdmin() {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()
  
  // If not initialized yet, return false but don't redirect
  if (!isInitialized) {
    return false
  }
  
  // If not authenticated, redirect to login
  if (isInitialized && !isAuthenticated) {
    router.push('/login')
    return false
  }
  
  // If authenticated but not admin, redirect to home page
  if (isAuthenticated && user?.role !== 'admin') {
    toast.error('Bu sayfaya erişim yetkiniz bulunmamaktadır.')
    router.push('/')
    return false
  }
  
  // User is admin
  return isAuthenticated && user?.role === 'admin'
}

// Hook for protected routes
export const useProtectedRoute = (requiredRole?: string) => {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isInitialized) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (requiredRole && user?.role !== requiredRole) {
      toast.error('Bu sayfaya erişim yetkiniz bulunmamaktadır.')
      router.push('/')
      return
    }
  }, [isInitialized, isAuthenticated, user?.role, requiredRole, router])

  return {
    isAuthenticated,
    isAuthorized: !requiredRole || user?.role === requiredRole,
    user,
    isLoading: !isInitialized
  }
} 