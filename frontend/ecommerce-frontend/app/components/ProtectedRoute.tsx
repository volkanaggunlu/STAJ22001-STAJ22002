'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { RouteUtils } from '@/lib/utils/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  requireEmailVerification?: boolean
  redirectTo?: string
}

function ProtectedRouteContent({ 
  children, 
  requireAuth = true,
  requireAdmin = false,
  requireEmailVerification = false,
  redirectTo 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isInitialized || isLoading) {
      return // Wait for auth to initialize
    }

    // Redirect authenticated users from auth pages
    if (isAuthenticated && RouteUtils.isAuthRoute(pathname)) {
      const redirectPath = RouteUtils.getAuthenticatedRedirect(searchParams)
      console.log('🔐 Redirecting authenticated user from auth page to:', redirectPath)
      router.replace(redirectPath)
      return
    }

    // Check if authentication is required
    if (requireAuth && !isAuthenticated) {
      const loginUrl = redirectTo || RouteUtils.getLoginRedirect(pathname)
      console.log('🔐 Redirecting unauthenticated user to:', loginUrl)
      router.replace(loginUrl)
      return
    }

    // Check admin access
    if (requireAdmin && (!user || !RouteUtils.canAccessAdmin(user))) {
      console.log('🔐 Access denied: Admin required')
      router.replace('/')
      return
    }

    // Check email verification
    if (requireEmailVerification && RouteUtils.requiresEmailVerification(user, pathname)) {
      console.log('🔐 Email verification required')
      router.replace('/email-verification')
      return
    }

    console.log('🔐 Route access granted for:', pathname)
  }, [
    isAuthenticated, 
    isLoading, 
    isInitialized, 
    user, 
    pathname, 
    requireAuth, 
    requireAdmin, 
    requireEmailVerification, 
    redirectTo, 
    router, 
    searchParams
  ])

  // Show loading while auth initializes
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Prevent flash of content during redirects
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Yönlendiriliyor...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated && RouteUtils.isAuthRoute(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Yönlendiriliyor...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function ProtectedRoute(props: ProtectedRouteProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <ProtectedRouteContent {...props} />
    </Suspense>
  )
}

// Convenience wrapper for pages that require authentication
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true}>
      {children}
    </ProtectedRoute>
  )
}

// Convenience wrapper for admin pages
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={true} requireAdmin={true}>
      {children}
    </ProtectedRoute>
  )
}

// Convenience wrapper for pages that redirect logged-in users
export function GuestOnlyRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  )
} 