# 🔐 Authentication (Kimlik Doğrulama) Sistemi

## 📋 Genel Bakış

Açık Atölye projesi **JWT (JSON Web Token)** tabanlı güvenli kimlik doğrulama sistemi kullanır. Sistem, kullanıcı giriş/çıkış işlemlerini, token yönetimini ve rol bazlı erişim kontrolünü sağlar.

## 🏗️ Authentication Architecture

### Sistem Bileşenleri
```
┌─────────────────────────────────────────┐
│            Authentication Flow           │
├─────────────────────────────────────────┤
│ 1. User Login                          │
│ 2. Backend JWT Token Generation        │
│ 3. Secure Token Storage                │
│ 4. API Request Authorization          │
│ 5. Token Refresh Management           │
│ 6. Logout & Token Cleanup             │
└─────────────────────────────────────────┘
```

### Core Components
- **AuthStore** (Zustand) - Global auth state
- **AuthAPI** - Authentication API calls
- **AuthStorage** - Secure token storage
- **ProtectedRoute** - Route protection
- **AuthInitializer** - Auth state initialization

## 🏪 Auth Store (Zustand)

### State Structure
```typescript
// lib/store/authStore.ts
interface AuthState {
  // State
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  login: (user: AuthUser) => void
  logout: () => void
  updateUser: (updates: Partial<AuthUser>) => void
  initialize: () => Promise<void>
  checkAuth: () => Promise<boolean>
  clearAuth: () => void
}
```

### Key Features
```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      // Login action
      login: (user) => {
        console.log('🔐 Login successful for:', user.email)
        set({
          user,
          isAuthenticated: true,
          isLoading: false
        })
      },

      // Logout action
      logout: () => {
        // Clear auth storage
        AuthStorage.clearTokens()
        
        // Clear user state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })

        // Clear related storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-preferences')
          localStorage.removeItem('recently-viewed')
          sessionStorage.clear()
        }
      },

      // Initialize auth state on app start
      initialize: async () => {
        if (get().isInitialized) return

        setLoading(true)
        try {
          const isValidToken = await authApi.checkAndRefreshToken()
          
          if (isValidToken) {
            const response = await authApi.getCurrentUser()
            if (response.success && response.data.user) {
              setUser(response.data.user)
            }
          }
        } catch (error) {
          console.error('Auth initialization failed:', error)
          setUser(null)
        } finally {
          setLoading(false)
          setInitialized(true)
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
```

## 🔑 Token Management

### Token Storage
```typescript
// lib/api/client.ts
export const AuthStorage = {
  // Get tokens
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refresh_token')
  },

  // Set tokens
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  },

  // Clear tokens
  clearTokens: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  // Token refresh
  handleTokenRefresh: async (): Promise<boolean> => {
    const refreshToken = AuthStorage.getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await authApi.refreshToken(refreshToken)
      if (response.success) {
        AuthStorage.setTokens(
          response.data.accessToken,
          response.data.refreshToken
        )
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      AuthStorage.clearTokens()
    }
    return false
  }
}
```

### Axios Interceptors
```typescript
// Request interceptor - Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = AuthStorage.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      
      const refreshSuccess = await AuthStorage.handleTokenRefresh()
      if (refreshSuccess) {
        const token = AuthStorage.getAccessToken()
        original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      } else {
        // Redirect to login
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)
```

## 🌐 API Services

### Auth API
```typescript
// lib/api/services/auth.ts
export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await apiClient.post('/auth/login', credentials)
    return data
  },

  // Register
  register: async (userData: RegisterData): Promise<ApiResponse<RegisterResponse>> => {
    const { data } = await apiClient.post('/auth/register', userData)
    return data
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<{ user: AuthUser }>> => {
    const { data } = await apiClient.get('/auth/me')
    return data
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<ApiResponse<TokenResponse>> => {
    const { data } = await apiClient.post('/auth/refresh', { refreshToken })
    return data
  },

  // Check and refresh token
  checkAndRefreshToken: async (): Promise<boolean> => {
    const accessToken = AuthStorage.getAccessToken()
    const refreshToken = AuthStorage.getRefreshToken()
    
    if (!accessToken || !refreshToken) return false

    try {
      // Try to decode token to check expiration
      const decoded = jwtDecode(accessToken) as any
      const now = Date.now() / 1000
      
      // If token expires in less than 5 minutes, refresh it
      if (decoded.exp - now < 300) {
        return await AuthStorage.handleTokenRefresh()
      }
      
      return true
    } catch (error) {
      return await AuthStorage.handleTokenRefresh()
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      AuthStorage.clearTokens()
    }
  },

  // Password reset
  requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post('/auth/forgot-password', { email })
    return data
  },

  resetPassword: async (resetData: ResetPasswordData): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post('/auth/reset-password', resetData)
    return data
  },

  // Email verification
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post('/auth/verify-email', { token })
    return data
  },

  resendVerificationEmail: async (): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.post('/auth/resend-verification')
    return data
  },
}
```

## 🪝 Custom Hooks

### useAuth Hook
```typescript
// lib/hooks/useAuth.ts
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    logout,
    updateUser,
    initialize,
    checkAuth
  } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      if (response.success) {
        // Store tokens
        AuthStorage.setTokens(
          response.data.accessToken,
          response.data.refreshToken
        )
        
        // Update auth state
        login(response.data.user)
        
        toast.success('Giriş başarılı!')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Giriş başarısız!')
    }
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout()
      toast.success('Çıkış yapıldı')
    }
  })

  return {
    // State
    user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    isInitialized,

    // Actions
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    updateUser,
    initialize,
    checkAuth,

    // Mutation states
    isLoginLoading: loginMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
  }
}
```

### useIsAdmin Hook
```typescript
// lib/hooks/useIsAdmin.ts
export function useIsAdmin(): boolean {
  const { user, isAuthenticated } = useAuth()
  
  return isAuthenticated && user?.role === 'admin'
}
```

## 🛡️ Route Protection

### ProtectedRoute Component
```typescript
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  requireEmailVerification?: boolean
  redirectTo?: string
}

export function ProtectedRoute({ 
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
    if (!isInitialized || isLoading) return

    // Redirect authenticated users from auth pages
    if (isAuthenticated && RouteUtils.isAuthRoute(pathname)) {
      const redirectPath = RouteUtils.getAuthenticatedRedirect(searchParams)
      router.replace(redirectPath)
      return
    }

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      const loginUrl = redirectTo || RouteUtils.getLoginRedirect(pathname)
      router.replace(loginUrl)
      return
    }

    // Check admin requirement
    if (requireAdmin && (!user || !RouteUtils.canAccessAdmin(user))) {
      router.replace('/')
      return
    }

    // Check email verification
    if (requireEmailVerification && RouteUtils.requiresEmailVerification(user, pathname)) {
      router.replace('/email-verification')
      return
    }
  }, [
    isAuthenticated, 
    isLoading, 
    isInitialized, 
    user, 
    pathname, 
    requireAuth, 
    requireAdmin, 
    requireEmailVerification
  ])

  // Show loading while auth initializes
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Prevent flash of content during redirects
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return <>{children}</>
}
```

### Route Utils
```typescript
// lib/utils/routeUtils.ts
export const RouteUtils = {
  isAuthRoute: (pathname: string): boolean => {
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
    return authRoutes.includes(pathname)
  },

  canAccessAdmin: (user: AuthUser | null): boolean => {
    return user?.role === 'admin'
  },

  requiresEmailVerification: (user: AuthUser | null, pathname: string): boolean => {
    if (!user) return false
    
    const protectedRoutes = ['/hesabim', '/sepet', '/odeme']
    return !user.emailVerified && protectedRoutes.some(route => 
      pathname.startsWith(route)
    )
  },

  getLoginRedirect: (currentPath: string): string => {
    return `/login?redirect=${encodeURIComponent(currentPath)}`
  },

  getAuthenticatedRedirect: (searchParams: URLSearchParams): string => {
    return searchParams.get('redirect') || '/'
  }
}
```

## 🔄 Auth Initialization

### Auth Initializer Component
```typescript
// components/AuthInitializer.tsx
interface AuthInitializerProps {
  children: React.ReactNode
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const initialize = useAuthStore((state) => state.initialize)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])

  return <>{children}</>
}
```

### Layout Integration
```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthInitializer>
            <Header />
            <main>{children}</main>
            <Footer />
            <Toaster />
          </AuthInitializer>
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

## 📱 Auth Forms

### Login Form
```typescript
// components/forms/LoginForm.tsx
const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  rememberMe: z.boolean().optional(),
})

export function LoginForm() {
  const { login, isLoginLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => {
        const redirectTo = searchParams.get('redirect') || '/'
        router.push(redirectTo)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Email adresinizi giriniz" 
                  type="email"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Şifrenizi giriniz" 
                  type="password"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Beni hatırla</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoginLoading}
        >
          {isLoginLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Giriş yapılıyor...
            </>
          ) : (
            'Giriş Yap'
          )}
        </Button>
      </form>
    </Form>
  )
}
```

## 🔒 Security Features

### Role-Based Access Control
```typescript
// Types
export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin' | 'moderator'
  emailVerified: boolean
  avatar?: string
  createdAt: string
  updatedAt: string
}

// Admin check
export function useRequireAdmin() {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated || user?.role !== 'admin') {
    throw new Error('Admin access required')
  }
  
  return user
}
```

### Password Security
```typescript
// Password validation schema
const passwordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalıdır')
  .regex(/[A-Z]/, 'En az bir büyük harf içermelidir')
  .regex(/[a-z]/, 'En az bir küçük harf içermelidir')
  .regex(/[0-9]/, 'En az bir rakam içermelidir')
  .regex(/[^A-Za-z0-9]/, 'En az bir özel karakter içermelidir')
```

### CSRF Protection
```typescript
// API client CSRF protection
apiClient.defaults.xsrfCookieName = 'XSRF-TOKEN'
apiClient.defaults.xsrfHeaderName = 'X-XSRF-TOKEN'
```

## 🧪 Testing

### Auth Store Tests
```typescript
// __tests__/authStore.test.ts
describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('should login user successfully', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      emailVerified: true,
    }

    useAuthStore.getState().login(mockUser)
    
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  it('should logout user successfully', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user' as const,
      emailVerified: true,
    }

    useAuthStore.getState().login(mockUser)
    useAuthStore.getState().logout()
    
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBe(null)
  })
})
```

---

**Son Güncelleme**: Aralık 2024  
**Doküman Versiyonu**: 1.0 