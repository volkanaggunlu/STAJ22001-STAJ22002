import axios from 'axios'
import axiosRateLimit from 'axios-rate-limit'
import { toast } from 'sonner'
import { jwtDecode } from 'jwt-decode'

// Token interface
interface TokenPayload {
  exp: number
  userId: string
  email: string
  role: string
}

// Auth storage utilities
const TOKEN_KEY = 'auth-token'
const REFRESH_TOKEN_KEY = 'refresh-token'

class AuthStorage {
  static getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(TOKEN_KEY, token)
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded: TokenPayload = jwtDecode(token)
      const currentTime = Date.now() / 1000
      return decoded.exp < currentTime
    } catch {
      return true
    }
  }

  static getTokenExpiration(token: string): number | null {
    try {
      const decoded: TokenPayload = jwtDecode(token)
      return decoded.exp * 1000 // Convert to milliseconds
    } catch {
      return null
    }
  }
}

// Create axios instance
const baseApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Apply rate limiting - cast to any for compatibility
const apiClient = axiosRateLimit(baseApiClient, {
  maxRequests: 50,
  perMilliseconds: 60000, // 50 requests per minute
}) as any

// Request interceptor
apiClient.interceptors.request.use(
  (config: any) => {
    const token = AuthStorage.getToken()
    
    if (token && !AuthStorage.isTokenExpired(token)) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add request timestamp for debugging (sadece development'ta)
    if (process.env.NODE_ENV === 'development') {
      config.metadata = config.metadata || {}
      config.metadata.startTime = new Date()
    }
    
    return config
  },
  (error: any) => {
    // Error log sadece development'ta detaylı
    if (process.env.NODE_ENV === 'development') {
      console.error('Request interceptor error:', error)
    } else {
      console.error('İstek hazırlama hatası')
    }
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: any) => {
    // Check for new tokens in response headers
    const newAccessToken = response.headers['new-access-token']
    const newRefreshToken = response.headers['new-refresh-token']
    
    if (newAccessToken) {
      AuthStorage.setToken(newAccessToken)
    }
    
    if (newRefreshToken) {
      AuthStorage.setRefreshToken(newRefreshToken)
    }

    // Log response time for debugging (sadece development'ta)
    if (process.env.NODE_ENV === 'development') {
      const config = response.config
      const startTime = config?.metadata?.startTime
      if (startTime) {
        const duration = new Date().getTime() - startTime.getTime()
        console.log(`API call to ${response.config.url} took ${duration}ms`)
      }
    }

    return response
  },
  async (error: any) => {
    const originalRequest = error.config

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = AuthStorage.getRefreshToken()
      
      if (refreshToken && !AuthStorage.isTokenExpired(refreshToken)) {
        try {
          // Try to refresh token
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
            { refreshToken }
          )

          const data = response.data as any
          const { accessToken, refreshToken: newRefreshToken } = data.data.tokens
          
          AuthStorage.setToken(accessToken)
          AuthStorage.setRefreshToken(newRefreshToken)
          
          // Retry original request with new token
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return apiClient.request(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout user
          AuthStorage.clearTokens()
          window.location.href = '/login'
          toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.')
        }
      } else {
        // No valid refresh token, logout user
        AuthStorage.clearTokens()
        window.location.href = '/login'
        toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.')
      }
    }

    // Handle other HTTP errors
    const errorMessage = getErrorMessage(error)
    
    // Don't show toast for cancelled requests
    if (error.code !== 'ERR_CANCELED') {
      // Development'ta detaylı log, production'da minimal log
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: errorMessage,
          data: error.response?.data
        })
      } else {
        // Production'da sadece genel hata bilgisi
        console.error(`API Error: ${error.response?.status || 'Network Error'}`)
      }

      // Show user-friendly error messages
      if (error.response?.status !== 401) {
        toast.error(errorMessage)
      }
    }

    return Promise.reject(error)
  }
)

// Helper function to extract user-friendly error messages
function getErrorMessage(error: any): string {
  if (error.response?.data) {
    const data = error.response.data
    
    // API returns structured error
    if (data.message) {
      return data.message
    }
    
    // Validation errors
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((err: any) => err.message || err).join(', ')
    }
  }

  // Network errors
  if (error.code === 'NETWORK_ERROR') {
    return 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.'
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.'
  }

  // Default error messages by status code
  switch (error.response?.status) {
    case 400:
      return 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.'
    case 403:
      return 'Bu işlemi gerçekleştirme yetkiniz bulunmuyor.'
    case 404:
      return 'Aradığınız kaynak bulunamadı.'
    case 429:
      return 'Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.'
    case 500:
      return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.'
    case 503:
      return 'Servis geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
    default:
      return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
  }
}

// Export utilities along with client
export { AuthStorage, apiClient }
export type { TokenPayload } 