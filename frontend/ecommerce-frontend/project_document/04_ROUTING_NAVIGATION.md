# 🧭 Routing ve Navigation Sistemi

## 📐 Next.js App Router Yapısı

Açık Atölye projesi **Next.js 15 App Router** kullanır. Bu modern routing sistemi file-system bazlıdır ve güçlü özelliklere sahiptir.

## 📁 Dizin Yapısı ve Route Mapping

### Root Level Routes
```
app/
├── page.tsx                 → / (Ana sayfa)
├── layout.tsx              → Root layout (tüm sayfalar)
├── globals.css             → Global CSS
├── loading.tsx             → Global loading UI
├── error.tsx               → Global error UI
└── not-found.tsx          → 404 sayfası
```

### Grouped Routes
```
app/
├── (auth)/                 → Auth route group
│   ├── layout.tsx         → Auth layout
│   ├── login/
│   │   └── page.tsx       → /login
│   └── register/
│       └── page.tsx       → /register
│
├── (shop)/                → Shop route group
│   ├── layout.tsx         → Shop layout
│   ├── urunler/
│   │   └── page.tsx       → /urunler
│   └── kategori/
│       └── [slug]/
│           └── page.tsx   → /kategori/[slug]
│
└── admin/                 → Admin route group
    ├── layout.tsx         → Admin layout
    ├── page.tsx          → /admin (Dashboard)
    ├── products/
    │   ├── page.tsx      → /admin/products
    │   ├── new/
    │   │   └── page.tsx  → /admin/products/new
    │   └── [id]/
    │       └── page.tsx  → /admin/products/[id]
    └── categories/
        ├── page.tsx      → /admin/categories
        └── new/
            └── page.tsx  → /admin/categories/new
```

## 🔗 Route Definitions

### Public Routes (Herkes Erişebilir)
```typescript
const publicRoutes = {
  // Ana sayfalar
  home: '/',
  products: '/urunler',
  productDetail: '/urun/[id]',
  category: '/kategori/[slug]',
  
  // Statik sayfalar
  about: '/hakkimizda',
  contact: '/iletisim',
  help: '/yardim',
  privacy: '/gizlilik',
  terms: '/kosullar',
  
  // Search & Filter
  search: '/arama',
  brands: '/markalar',
  
  // Auth pages
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
} as const
```

### Protected Routes (Giriş Gerekli)
```typescript
const protectedRoutes = {
  // User account
  account: '/hesabim',
  accountOrders: '/hesabim/siparisler',
  accountFavorites: '/hesabim/favoriler',
  accountAddresses: '/hesabim/adresler',
  accountSettings: '/hesabim/ayarlar',
  
  // Shopping flow
  cart: '/sepet',
  checkout: '/odeme',
  orderSuccess: '/siparis-basarili',
  orderTracking: '/siparis-takip/[orderNumber]',
  
  // Profile
  profile: '/profil',
  profileEdit: '/profil/duzenle',
} as const
```

### Admin Routes (Admin Yetkisi Gerekli)
```typescript
const adminRoutes = {
  // Dashboard
  dashboard: '/admin',
  
  // Product management
  products: '/admin/products',
  productNew: '/admin/products/new',
  productEdit: '/admin/products/[id]',
  productBulkEdit: '/admin/products/bulk-edit',
  
  // Category management
  categories: '/admin/categories',
  categoryNew: '/admin/categories/new',
  categoryEdit: '/admin/categories/[id]',
  
  // User management
  users: '/admin/users',
  userDetail: '/admin/users/[id]',
  
  // Order management
  orders: '/admin/orders',
  orderDetail: '/admin/orders/[id]',
  
  // Analytics & Reports
  analytics: '/admin/analytics',
  reports: '/admin/reports',
  
  // Settings
  settings: '/admin/settings',
  settingsGeneral: '/admin/settings/general',
  settingsPayment: '/admin/settings/payment',
  settingsShipping: '/admin/settings/shipping',
} as const
```

## 🛡️ Route Protection

### Protected Route Component
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
  
  useEffect(() => {
    if (!isInitialized || isLoading) return
    
    // Redirect logic
    if (requireAuth && !isAuthenticated) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`
      router.replace(loginUrl)
      return
    }
    
    if (requireAdmin && (!user || user.role !== 'admin')) {
      router.replace('/')
      return
    }
    
    if (requireEmailVerification && !user?.emailVerified) {
      router.replace('/email-verification')
      return
    }
  }, [isAuthenticated, user, pathname, requireAuth, requireAdmin])
  
  // Loading state
  if (!isInitialized || isLoading) {
    return <LoadingSpinner />
  }
  
  return <>{children}</>
}
```

### Layout-Based Protection
```typescript
// app/admin/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireAuth={true} requireAdmin={true}>
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
```

## 🧭 Navigation Components

### Main Navigation (Header)
```typescript
// app/components/Header.tsx
const navigationItems = [
  {
    title: 'Ana Sayfa',
    href: '/',
    icon: Home,
  },
  {
    title: 'Ürünler',
    href: '/urunler',
    icon: Package,
    children: [
      { title: 'Tüm Ürünler', href: '/urunler' },
      { title: 'Yeni Ürünler', href: '/urunler?sort=newest' },
      { title: 'İndirimli Ürünler', href: '/urunler?sale=true' },
    ]
  },
  {
    title: 'Kategoriler',
    href: '/kategoriler',
    icon: Grid,
    children: [
      { title: 'Elektronik Komponentler', href: '/kategori/elektronik' },
      { title: 'Arduino Kitleri', href: '/kategori/arduino' },
      { title: '3D Baskı', href: '/kategori/3d-baski' },
      { title: 'Hobi Malzemeleri', href: '/kategori/hobi' },
    ]
  },
  {
    title: 'Markalar',
    href: '/markalar',
    icon: Tag,
  },
]

export default function Header() {
  const pathname = usePathname()
  
  return (
    <header>
      <NavigationMenu>
        <NavigationMenuList>
          {navigationItems.map((item) => (
            <NavigationMenuItem key={item.href}>
              {item.children ? (
                <NavigationMenuTrigger>
                  {item.title}
                </NavigationMenuTrigger>
              ) : (
                <NavigationMenuLink 
                  href={item.href}
                  className={cn(
                    "navigation-link",
                    pathname === item.href && "active"
                  )}
                >
                  {item.title}
                </NavigationMenuLink>
              )}
              
              {item.children && (
                <NavigationMenuContent>
                  <div className="grid gap-2 p-4">
                    {item.children.map((child) => (
                      <NavigationMenuLink 
                        key={child.href}
                        href={child.href}
                      >
                        {child.title}
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  )
}
```

### Admin Sidebar Navigation
```typescript
// app/components/AdminSidebar.tsx
const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
  },
  {
    title: 'Ürün Yönetimi',
    icon: Package,
    items: [
      { title: 'Ürün Listesi', href: '/admin/products', icon: List },
      { title: 'Yeni Ürün', href: '/admin/products/new', icon: Plus },
      { title: 'Toplu İşlemler', href: '/admin/products/bulk', icon: Upload },
    ],
  },
  {
    title: 'Kategori Yönetimi',
    icon: FolderTree,
    items: [
      { title: 'Kategori Listesi', href: '/admin/categories', icon: List },
      { title: 'Yeni Kategori', href: '/admin/categories/new', icon: Plus },
    ],
  },
  {
    title: 'Sipariş Yönetimi',
    icon: ShoppingCart,
    items: [
      { title: 'Sipariş Listesi', href: '/admin/orders', icon: List },
      { title: 'Bekleyen Siparişler', href: '/admin/orders?status=pending', icon: Clock },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  
  return (
    <Sidebar>
      <SidebarContent>
        {menuItems.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items ? (
                  item.items.map((subItem) => (
                    <SidebarMenuItem key={subItem.href}>
                      <SidebarMenuButton 
                        asChild
                        isActive={pathname === subItem.href}
                      >
                        <Link href={subItem.href}>
                          <subItem.icon className="h-4 w-4" />
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
```

### Breadcrumb Navigation
```typescript
// components/Breadcrumb.tsx
interface BreadcrumbItem {
  title: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbNav({ items }: BreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.current ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href || '#'}>
                  {item.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

// Kullanım örneği
function ProductDetailPage({ params }: { params: { id: string } }) {
  const { data: product } = useProduct(params.id)
  
  const breadcrumbItems = [
    { title: 'Ana Sayfa', href: '/' },
    { title: 'Ürünler', href: '/urunler' },
    { title: product?.category?.name || 'Kategori', href: `/kategori/${product?.category?.slug}` },
    { title: product?.name || 'Ürün', current: true },
  ]
  
  return (
    <div>
      <BreadcrumbNav items={breadcrumbItems} />
      {/* Product content */}
    </div>
  )
}
```

## 🔀 Router Hooks ve Navigation

### Next.js Router Hooks
```typescript
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

function MyComponent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Programmatic navigation
  const handleNavigate = () => {
    router.push('/products')
    router.replace('/login')
    router.back()
    router.forward()
  }
  
  // Get current route info
  const currentPath = pathname // '/products'
  const queryParam = searchParams.get('category') // URL'den query param al
  
  return (
    <div>
      <p>Current path: {pathname}</p>
      <button onClick={handleNavigate}>Navigate</button>
    </div>
  )
}
```

### Custom Navigation Hooks
```typescript
// hooks/useNavigation.ts
export function useNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  
  const navigateToProduct = (productId: string) => {
    router.push(`/urun/${productId}`)
  }
  
  const navigateToCategory = (categorySlug: string) => {
    router.push(`/kategori/${categorySlug}`)
  }
  
  const navigateToAdmin = (adminPath: string = '') => {
    router.push(`/admin${adminPath}`)
  }
  
  const isCurrentPath = (path: string) => {
    return pathname === path
  }
  
  const isActiveRoute = (basePath: string) => {
    return pathname.startsWith(basePath)
  }
  
  return {
    navigateToProduct,
    navigateToCategory,
    navigateToAdmin,
    isCurrentPath,
    isActiveRoute,
    pathname,
    router,
  }
}
```

## 🔍 Dynamic Routes ve Params

### Dynamic Route Patterns
```typescript
// [id] - Single dynamic segment
app/urun/[id]/page.tsx          → /urun/123

// [slug] - Named dynamic segment  
app/kategori/[slug]/page.tsx    → /kategori/elektronik

// [...slug] - Catch-all segments
app/kategori/[...slug]/page.tsx → /kategori/a/b/c

// [[...slug]] - Optional catch-all
app/arama/[[...slug]]/page.tsx  → /arama veya /arama/a/b/c
```

### Params ve SearchParams Kullanımı
```typescript
// app/urun/[id]/page.tsx
interface ProductPageProps {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ProductPage({ params, searchParams }: ProductPageProps) {
  const productId = params.id
  const color = searchParams.color
  const size = searchParams.size
  
  return (
    <div>
      <h1>Product ID: {productId}</h1>
      <p>Color: {color}</p>
      <p>Size: {size}</p>
    </div>
  )
}

// URL: /urun/123?color=red&size=large
// params.id = "123"
// searchParams.color = "red" 
// searchParams.size = "large"
```

## 📱 Mobile Navigation

### Mobile Menu Component
```typescript
// components/MobileNav.tsx
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          
          <nav className="flex flex-col space-y-4 mt-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-lg font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
```

## 🔄 Route Loading ve Error States

### Loading UI
```typescript
// app/loading.tsx (Global loading)
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  )
}

// app/urunler/loading.tsx (Specific loading)
export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
```

### Error UI
```typescript
// app/error.tsx (Global error)
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Bir şeyler yanlış gitti!</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Tekrar dene
      </button>
    </div>
  )
}

// app/not-found.tsx (404 page)
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-3xl font-bold mb-4">404 - Sayfa Bulunamadı</h2>
      <p className="text-gray-600 mb-8">Aradığınız sayfa mevcut değil.</p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  )
}
```

## ⚡ Route Performance

### Preloading
```typescript
import { useRouter } from 'next/navigation'

function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  
  return (
    <div
      onMouseEnter={() => {
        // Preload the route on hover
        router.prefetch(`/urun/${product.id}`)
      }}
    >
      <Link href={`/urun/${product.id}`}>
        {/* Product content */}
      </Link>
    </div>
  )
}
```

### Route-based Code Splitting
```typescript
// Automatic with App Router
// Each page.tsx automatically creates a route-based split
```

---

**Son Güncelleme**: Aralık 2024  
**Doküman Versiyonu**: 1.0 