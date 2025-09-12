# 🏗️ Proje Mimarisi ve Teknik Altyapı

## 📐 Genel Mimari

Açık Atölye frontend projesi **layered architecture** prensibiyle tasarlanmıştır:

```
┌─────────────────────────────────────────┐
│              Presentation Layer         │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Pages     │  │   Components    │   │
│  │ (App Router)│  │   (UI/Business) │   │
│  └─────────────┘  └─────────────────┘   │
├─────────────────────────────────────────┤
│              Business Logic Layer       │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Hooks     │  │  State Mgmt     │   │
│  │ (Custom)    │  │ (Zustand/Query) │   │
│  └─────────────┘  └─────────────────┘   │
├─────────────────────────────────────────┤
│              Data Access Layer          │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ API Client  │  │   Services      │   │
│  │   (Axios)   │  │  (Endpoints)    │   │
│  └─────────────┘  └─────────────────┘   │
├─────────────────────────────────────────┤
│              Infrastructure Layer       │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Utils     │  │   Config        │   │
│  │ (Helpers)   │  │  (Env/Types)    │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## 🎯 Next.js App Router Yapısı

### Route Groups
```
app/
├── (auth)/              # Auth route group
│   ├── login/
│   ├── register/
│   └── layout.tsx       # Auth-specific layout
├── (shop)/              # Shop route group  
│   ├── urunler/
│   ├── kategori/
│   └── layout.tsx       # Shop-specific layout
├── admin/               # Admin route group
│   ├── dashboard/
│   ├── products/
│   └── layout.tsx       # Admin layout
├── hesabim/             # User account pages
├── sepet/               # Cart page
└── layout.tsx           # Root layout
```

### Page Routing Sistemi
```typescript
// Static Routes
/                        → app/page.tsx
/login                   → app/(auth)/login/page.tsx
/urunler                 → app/urunler/page.tsx
/admin                   → app/admin/page.tsx

// Dynamic Routes
/urun/[id]              → app/urun/[id]/page.tsx
/kategori/[slug]        → app/kategori/[slug]/page.tsx
/admin/products/[id]    → app/admin/products/[id]/page.tsx

// Nested Routes
/hesabim/siparisler     → app/hesabim/siparisler/page.tsx
/hesabim/favoriler      → app/hesabim/favoriler/page.tsx
```

## 🧩 Component Architecture

### Component Hierarchy
```
┌─────────────────────────────────────────┐
│                Layout                   │
│  ┌───────────────────────────────────┐  │
│  │            Header                 │  │
│  │  ┌─────────┐  ┌─────────────────┐ │  │
│  │  │  Logo   │  │   Navigation    │ │  │
│  │  └─────────┘  └─────────────────┘ │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │             Main                  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │         Page Content        │  │  │
│  │  │  ┌─────────┐ ┌─────────────┐ │  │  │
│  │  │  │Feature  │ │  Business   │ │  │  │
│  │  │  │Comp.    │ │  Components │ │  │  │
│  │  │  │         │ │             │ │  │  │
│  │  │  │ ┌─────┐ │ │ ┌─────────┐ │ │  │  │
│  │  │  │ │ UI  │ │ │ │   UI    │ │ │  │  │
│  │  │  │ │Comp.│ │ │ │  Comp.  │ │ │  │  │
│  │  │  │ └─────┘ │ │ └─────────┘ │ │  │  │
│  │  │  └─────────┘ └─────────────┘ │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │            Footer                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Component Types

#### 1. Layout Components
```typescript
// Root Layout (app/layout.tsx)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>
        <QueryClientProvider client={queryClient}>
          <Header />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster />
        </QueryClientProvider>
      </body>
    </html>
  )
}
```

#### 2. UI Components (components/ui/)
- **Atomic Components**: Button, Input, Badge
- **Composite Components**: Card, Dialog, Sheet
- **Layout Components**: Sidebar, Navigation

#### 3. Feature Components (app/components/)
- **Product Components**: ProductCard, ProductGrid
- **Auth Components**: LoginForm, RegisterForm
- **Cart Components**: CartDrawer, CartItem

#### 4. Business Components
- **Forms**: ProductForm, CategoryForm
- **Lists**: ProductList, OrderList
- **Modals**: QuickView, Confirmation

## 🔄 Data Flow Architecture

### 1. API Data Flow
```
[UI Component] 
    ↓ (user action)
[Custom Hook] 
    ↓ (query/mutation)
[TanStack Query] 
    ↓ (HTTP request)
[API Service] 
    ↓ (axios call)
[Backend API]
    ↓ (response)
[API Service] 
    ↓ (typed response)
[TanStack Query] 
    ↓ (cache update)
[Custom Hook] 
    ↓ (state update)
[UI Component] (re-render)
```

### 2. Local State Flow
```
[UI Component] 
    ↓ (user action)
[Zustand Action] 
    ↓ (state update)
[Zustand Store] 
    ↓ (notify subscribers)
[UI Component] (re-render)
```

## 📦 State Management Architecture

### Zustand Stores
```typescript
// Store yapısı
interface AuthState {
  // State
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (user: AuthUser) => void
  logout: () => void
  updateUser: (updates: Partial<AuthUser>) => void
}

interface CartState {
  // State
  items: CartItem[]
  isOpen: boolean
  totalItems: number
  
  // Actions
  addItem: (product: Product, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
}
```

### TanStack Query Structure
```typescript
// Query Keys
export const QUERY_KEYS = {
  PRODUCTS: ['products'] as const,
  PRODUCT: (id: string) => ['product', id] as const,
  CATEGORIES: ['categories'] as const,
  ADMIN_STATS: ['admin', 'stats'] as const,
}

// Custom Hook Pattern
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PRODUCTS, filters],
    queryFn: () => productsApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

## 🔌 API Integration Architecture

### API Client Setup
```typescript
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
})

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = AuthStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor  
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AuthStorage.handleTokenRefresh()
    }
    return Promise.reject(error)
  }
)
```

### Service Layer Pattern
```typescript
// lib/api/services/products.ts
export const productsApi = {
  // GET /api/products
  getProducts: async (filters?: ProductFilters) => {
    const { data } = await apiClient.get('/products', { params: filters })
    return data
  },
  
  // GET /api/products/:id
  getProduct: async (id: string) => {
    const { data } = await apiClient.get(`/products/${id}`)
    return data
  },
  
  // POST /api/admin/products
  createProduct: async (product: CreateProductDto) => {
    const { data } = await apiClient.post('/admin/products', product)
    return data
  },
}
```

## 🛡️ Security Architecture

### Authentication Flow
```
1. User Login
   ↓
2. Backend returns JWT tokens
   ↓
3. Store in secure storage
   ↓
4. Include in API requests
   ↓
5. Auto-refresh when expired
   ↓
6. Logout clears all tokens
```

### Protected Routes
```typescript
// Route protection levels
export enum RouteAccessLevel {
  PUBLIC = 'public',           // Anyone can access
  AUTHENTICATED = 'auth',      // Requires login
  ADMIN = 'admin',            // Requires admin role
  EMAIL_VERIFIED = 'verified', // Requires email verification
}

// Route configuration
const routeConfig = {
  '/': RouteAccessLevel.PUBLIC,
  '/login': RouteAccessLevel.PUBLIC,
  '/hesabim': RouteAccessLevel.AUTHENTICATED,
  '/admin': RouteAccessLevel.ADMIN,
}
```

## 📱 Responsive Architecture

### Breakpoint Strategy
```css
/* Mobile First Approach */
.component {
  /* Mobile styles (default) */
  
  @media (min-width: 640px) {
    /* Tablet styles */
  }
  
  @media (min-width: 1024px) {
    /* Desktop styles */
  }
}
```

### Component Responsiveness
```typescript
// Hook-based responsive design
const useResponsive = () => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  
  return { isMobile, isTablet, isDesktop }
}
```

## 🚀 Performance Architecture

### Code Splitting Strategy
```typescript
// Route-based splitting (automatic with App Router)
const AdminPanel = lazy(() => import('./admin/AdminPanel'))
const ProductDetail = lazy(() => import('./product/ProductDetail'))

// Component-based splitting
const HeavyChart = lazy(() => import('./charts/HeavyChart'))
```

### Caching Strategy
```typescript
// TanStack Query cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
```

## 🔄 Error Handling Architecture

### Error Boundaries
```typescript
// Global error boundary
export class GlobalErrorBoundary extends Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global error:', error, errorInfo)
    // Send to monitoring service
  }
}
```

### API Error Handling
```typescript
// Centralized error handling
export const handleApiError = (error: AxiosError) => {
  if (error.response?.status === 401) {
    // Handle auth errors
    useAuthStore.getState().logout()
  } else if (error.response?.status >= 500) {
    // Handle server errors
    toast.error('Sunucu hatası oluştu')
  } else {
    // Handle client errors
    toast.error(error.response?.data?.message || 'Bir hata oluştu')
  }
}
```

## 📊 Monitoring & Analytics

### Performance Monitoring
```typescript
// Web Vitals tracking
export function reportWebVitals(metric: NextWebVitalsMetric) {
  switch (metric.name) {
    case 'FCP':
    case 'LCP':
    case 'CLS':
    case 'FID':
    case 'TTFB':
      // Send to analytics service
      break
  }
}
```

### Error Tracking
```typescript
// Error tracking setup
if (process.env.NODE_ENV === 'production') {
  // Initialize error tracking service
  // (Sentry, LogRocket, etc.)
}
```

---

**Son Güncelleme**: Aralık 2024  
**Doküman Versiyonu**: 1.0 