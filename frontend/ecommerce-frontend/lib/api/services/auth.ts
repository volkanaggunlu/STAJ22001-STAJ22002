import { apiClient, AuthStorage } from '../client'
import { 
  ApiResponse, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  AuthTokens 
} from '../types'
import { API_ENDPOINTS } from '@/lib/utils/constants'

// Auth API Service
export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    )
    
    // Store tokens after successful login
    if (data.success && data.data.tokens) {
      AuthStorage.setToken(data.data.tokens.accessToken)
      AuthStorage.setRefreshToken(data.data.tokens.refreshToken)
    }
    
    return data as ApiResponse<AuthResponse>
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    )
    
    // Store tokens after successful registration
    if (data.success && data.data.tokens) {
      AuthStorage.setToken(data.data.tokens.accessToken)
      AuthStorage.setRefreshToken(data.data.tokens.refreshToken)
    }
    
    return data as ApiResponse<AuthResponse>
  },

  // Logout user
  logout: async (): Promise<ApiResponse<void>> => {
    try {
      const { data } = await apiClient.post(
        API_ENDPOINTS.AUTH.LOGOUT
      )
      return data as ApiResponse<void>
    } finally {
      // Always clear tokens, even if API call fails
      AuthStorage.clearTokens()
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ tokens: AuthTokens }>> => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.AUTH.REFRESH_TOKEN,
      { refreshToken }
    )
    
    // Update stored tokens
    if (data.success && data.data.tokens) {
      AuthStorage.setToken(data.data.tokens.accessToken)
      AuthStorage.setRefreshToken(data.data.tokens.refreshToken)
    }
    
    return data as ApiResponse<{ tokens: AuthTokens }>
  },

  // Forgot password - send reset email
  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email }
    )
    return data as ApiResponse<void>
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      { token, newPassword }
    )
    return data as ApiResponse<void>
  },

  // Verify email with token
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      { token }
    )
    return data as ApiResponse<void>
  },

  // Resend verification email
  resendVerification: async (email: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post(
      API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
      { email }
    )
    return data as ApiResponse<void>
  },

  // Get current user profile
  getCurrentUser: async (): Promise<ApiResponse<{ user: any }>> => {
    const { data } = await apiClient.get('/users/profile')
    return data as ApiResponse<{ user: any }>
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = AuthStorage.getToken()
    return !!(token && !AuthStorage.isTokenExpired(token))
  },

  // Get current token if valid
  getCurrentToken: (): string | null => {
    const token = AuthStorage.getToken()
    if (token && !AuthStorage.isTokenExpired(token)) {
      return token
    }
    return null
  },

  // Get refresh token if valid
  getCurrentRefreshToken: (): string | null => {
    const refreshToken = AuthStorage.getRefreshToken()
    if (refreshToken && !AuthStorage.isTokenExpired(refreshToken)) {
      return refreshToken
    }
    return null
  },

  // Force logout - clear all auth data
  forceLogout: (): void => {
    AuthStorage.clearTokens()
    // Clear any additional auth-related data from storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-preferences')
      sessionStorage.clear()
    }
  },

  // Check token expiration and auto-refresh if needed
  checkAndRefreshToken: async (): Promise<boolean> => {
    const token = AuthStorage.getToken()
    const refreshToken = AuthStorage.getRefreshToken()
    
    if (!token || !refreshToken) {
      return false
    }
    
    // If access token is expired but refresh token is valid
    if (AuthStorage.isTokenExpired(token)) {
      if (!AuthStorage.isTokenExpired(refreshToken)) {
        try {
          await authApi.refreshToken(refreshToken)
          return true
        } catch (error) {
          AuthStorage.clearTokens()
          return false
        }
      } else {
        AuthStorage.clearTokens()
        return false
      }
    }
    
    // Check if token expires in the next 5 minutes (300 seconds)
    const tokenExpiration = AuthStorage.getTokenExpiration(token)
    if (tokenExpiration) {
      const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)
      if (tokenExpiration <= fiveMinutesFromNow) {
        if (!AuthStorage.isTokenExpired(refreshToken)) {
          try {
            await authApi.refreshToken(refreshToken)
            return true
          } catch (error) {
            console.warn('Failed to refresh token:', error)
            // Don't force logout on refresh failure, let it expire naturally
          }
        }
      }
    }
    
    return true
  }
}

// Export for external use
export default authApi 