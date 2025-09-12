import { jwtDecode } from 'jwt-decode'
import { AuthUser, TokenPayload } from '../api/types'

// Token validation utilities
export class AuthValidator {
  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate password strength
  static isValidPassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Şifre en az 8 karakter olmalıdır')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Şifre en az bir büyük harf içermelidir')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Şifre en az bir küçük harf içermelidir')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Şifre en az bir rakam içermelidir')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validate phone number (Turkish format)
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+90|90|0)?[5][0-9]{9}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  // Format phone number to standard format
  static formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.startsWith('90')) {
      return `+${cleaned}`
    } else if (cleaned.startsWith('0')) {
      return `+9${cleaned}`
    } else if (cleaned.length === 10) {
      return `+90${cleaned}`
    }
    
    return phone
  }
}

// JWT token utilities
export class TokenUtils {
  // Decode JWT token safely
  static decodeToken(token: string): TokenPayload | null {
    try {
      return jwtDecode<TokenPayload>(token)
    } catch (error) {
      console.error('Failed to decode token:', error)
      return null
    }
  }

  // Check if token is expired
  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token)
    if (!decoded) return true
    
    const currentTime = Date.now() / 1000
    return decoded.exp <= currentTime
  }

  // Get token expiration time
  static getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token)
    if (!decoded) return null
    
    return new Date(decoded.exp * 1000)
  }

  // Get time until token expires (in milliseconds)
  static getTimeUntilExpiration(token: string): number | null {
    const expiration = this.getTokenExpiration(token)
    if (!expiration) return null
    
    return expiration.getTime() - Date.now()
  }

  // Check if token expires soon (within 5 minutes)
  static willExpireSoon(token: string, thresholdMinutes: number = 5): boolean {
    const timeUntilExpiration = this.getTimeUntilExpiration(token)
    if (timeUntilExpiration === null) return true
    
    const thresholdMs = thresholdMinutes * 60 * 1000
    return timeUntilExpiration <= thresholdMs
  }
}

// Role and permission utilities
export class RoleUtils {
  // Check if user has specific role
  static hasRole(user: AuthUser | null, role: string): boolean {
    return user?.role === role
  }

  // Check if user is admin
  static isAdmin(user: AuthUser | null): boolean {
    return user?.role === 'admin'
  }

  // Check if user is regular user
  static isUser(user: AuthUser | null): boolean {
    return user?.role === 'user'
  }

  // Get user permissions based on role
  static getUserPermissions(user: AuthUser | null): string[] {
    if (!user) return []
    
    const basePermissions = ['read:profile', 'update:profile']
    
    switch (user.role) {
      case 'admin':
        return [
          ...basePermissions,
          'read:users',
          'update:users',
          'delete:users',
          'read:products',
          'create:products',
          'update:products',
          'delete:products',
          'read:orders',
          'update:orders',
          'delete:orders',
          'read:analytics'
        ]
      case 'user':
        return [
          ...basePermissions,
          'create:orders',
          'read:own_orders',
          'update:own_orders'
        ]
      default:
        return basePermissions
    }
  }

  // Check if user has specific permission
  static hasPermission(user: AuthUser | null, permission: string): boolean {
    const permissions = this.getUserPermissions(user)
    return permissions.includes(permission)
  }
}

// Auth route utilities
export class RouteUtils {
  // Routes that require authentication
  static readonly PROTECTED_ROUTES = [
    '/hesabim',
    '/siparislerim', 
    '/favorilerim',
    '/sepet',
    '/odeme',
    '/admin'
  ]

  // Routes that authenticated users shouldn't access  
  static readonly AUTH_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ]

  // Public routes (no auth required)
  static readonly PUBLIC_ROUTES = [
    '/',
    '/urunler',
    '/urun',
    '/kategori',
    '/hakkimizda',
    '/iletisim',
    '/yardim',
    '/gizlilik',
    '/kullanim-kosullari'
  ]

  /**
   * Check if route requires authentication
   */
  static isProtectedRoute(pathname: string): boolean {
    return this.PROTECTED_ROUTES.some(route => 
      pathname.startsWith(route)
    )
  }

  /**
   * Check if authenticated users should be redirected from this route
   */
  static isAuthRoute(pathname: string): boolean {
    return this.AUTH_ROUTES.some(route => 
      pathname.startsWith(route)
    )
  }

  /**
   * Check if route is public (no restrictions)
   */
  static isPublicRoute(pathname: string): boolean {
    // Email verification is special case - should work for both states
    if (pathname.startsWith('/email-verification')) {
      return true
    }

    return this.PUBLIC_ROUTES.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    )
  }

  /**
   * Get redirect URL for unauthenticated users
   */
  static getLoginRedirect(currentPath: string): string {
    const redirectTo = encodeURIComponent(currentPath)
    return `/login?redirect=${redirectTo}`
  }

  /**
   * Get redirect URL for authenticated users
   */
  static getAuthenticatedRedirect(searchParams?: URLSearchParams): string {
    const redirectTo = searchParams?.get('redirect')
    
    if (redirectTo) {
      // Validate redirect URL (security)
      try {
        const url = new URL(redirectTo, window.location.origin)
        if (url.origin === window.location.origin) {
          return decodeURIComponent(redirectTo)
        }
      } catch {
        // Invalid URL, fall back to default
      }
    }
    
    return '/' // Default redirect
  }

  /**
   * Check if user can access admin routes
   */
  static canAccessAdmin(user: any): boolean {
    return user?.role === 'admin'
  }

  /**
   * Check if email verification is required for protected routes
   */
  static requiresEmailVerification(user: any, pathname: string): boolean {
    if (!user || user.isVerified) return false
    
    // Some routes might not require email verification
    const noVerificationRoutes = ['/hesabim', '/email-verification']
    return !noVerificationRoutes.some(route => pathname.startsWith(route))
  }
}

// Local storage utilities for auth
export class AuthStorageUtils {
  private static PREFIX = 'auth_'

  // Store user preferences
  static setUserPreferences(userId: string, preferences: Record<string, any>): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(
        `${this.PREFIX}preferences_${userId}`,
        JSON.stringify(preferences)
      )
    } catch (error) {
      console.error('Failed to save user preferences:', error)
    }
  }

  // Get user preferences
  static getUserPreferences(userId: string): Record<string, any> | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(`${this.PREFIX}preferences_${userId}`)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Failed to load user preferences:', error)
      return null
    }
  }

  // Clear user-specific data
  static clearUserData(userId: string): void {
    if (typeof window === 'undefined') return
    
    const keys = [
      `${this.PREFIX}preferences_${userId}`,
      `${this.PREFIX}cart_${userId}`,
      `${this.PREFIX}favorites_${userId}`
    ]
    
    keys.forEach(key => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error(`Failed to remove ${key}:`, error)
      }
    })
  }
}

// Export all utilities
export const authUtils = {
  validator: AuthValidator,
  token: TokenUtils,
  role: RoleUtils,
  route: RouteUtils,
  storage: AuthStorageUtils
} 