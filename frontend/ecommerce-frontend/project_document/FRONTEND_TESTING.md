# Next.js E-ticaret Projesi - Frontend & Backend Entegrasyon Rehberi

## 🎯 Proje Genel Bakış

Next.js TypeScript tabanlı e-ticaret frontend'i ile Express.js MongoDB backend'ini entegre ediyoruz. Mock veriler yerine gerçek API kullanılacak.

## 🏗️ Seçilmiş Teknoloji Stack

### Core Technologies
- **Next.js 14** - App Router ile
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components

### API & Data Management
- **Axios** - HTTP client
- **TanStack Query (React Query)** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### State Management
- **Zustand** - Global state (sepet, kullanıcı durumu)

## 📁 Proje Klasör Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (shop)/            # Shop route group
│   ├── admin/             # Admin pages
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Shadcn/ui components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components (Header, Footer)
│   └── features/          # Feature-specific components
│       ├── auth/          # Auth components
│       ├── products/      # Product components
│       ├── cart/          # Cart components
│       └── orders/        # Order components
├── lib/
│   ├── api/               # API configuration
│   │   ├── client.ts      # Axios client setup
│   │   ├── services/      # API service functions
│   │   └── types.ts       # API response types
│   ├── hooks/             # Custom hooks
│   ├── utils.ts           # Utility functions
│   ├── validations/       # Zod schemas
│   └── store.ts           # Zustand store
└── types/                 # TypeScript type definitions
```

## 🔧 API Entegrasyon Kuralları

### 1. API Client Kurulumu
```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Token ekleme
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. API Services Pattern
Her entity için ayrı service dosyası:

```typescript
// lib/api/services/products.ts
import apiClient from '../client';
import { Product, ProductFilters, ApiResponse } from '../types';

export const productsApi = {
  getProducts: async (filters?: ProductFilters): Promise<ApiResponse<Product[]>> => {
    const { data } = await apiClient.get('/products', { params: filters });
    return data;
  },
  
  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },
  
  createProduct: async (product: Omit<Product, 'id'>): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.post('/products', product);
    return data;
  },
  
  updateProduct: async (id: string, product: Partial<Product>): Promise<ApiResponse<Product>> => {
    const { data } = await apiClient.put(`/products/${id}`, product);
    return data;
  },
  
  deleteProduct: async (id: string): Promise<ApiResponse<void>> => {
    const { data } = await apiClient.delete(`/products/${id}`);
    return data;
  },
};
```

### 3. React Query Hooks
```typescript
// lib/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/services/products';
import { toast } from 'sonner';

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 dakika
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Ürün başarıyla oluşturuldu');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ürün oluşturulamadı');
    },
  });
};
```

## 📋 Form Yönetimi Best Practices

### 1. Zod Schema Validation
```typescript
// lib/validations/product.ts
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Ürün adı gerekli').max(100, 'Ürün adı çok uzun'),
  price: z.number().min(0, 'Fiyat 0\'dan büyük olmalı'),
  description: z.string().optional(),
  category: z.string().min(1, 'Kategori seçiniz'),
  stock: z.number().min(0, 'Stok miktarı 0\'dan küçük olamaz'),
  images: z.array(z.string()).min(1, 'En az bir resim ekleyin'),
});

export type ProductFormData = z.infer<typeof productSchema>;
```

### 2. Form Component Pattern
```typescript
// components/forms/ProductForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { productSchema, ProductFormData } from '@/lib/validations/product';
import { useCreateProduct } from '@/lib/hooks/useProducts';

interface ProductFormProps {
  onSuccess?: () => void;
}

export const ProductForm = ({ onSuccess }: ProductFormProps) => {
  const createProduct = useCreateProduct();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      await createProduct.mutateAsync(data);
      reset();
      onSuccess?.();
    } catch (error) {
      // Error handling React Query'de yapılıyor
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Ürün Adı</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Ürün adını giriniz"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Fiyat</Label>
        <Input
          id="price"
          type="number"
          {...register('price', { valueAsNumber: true })}
          placeholder="0.00"
        />
        {errors.price && (
          <p className="text-sm text-red-500">{errors.price.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Ürün açıklaması"
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Kaydediliyor...' : 'Ürün Ekle'}
      </Button>
    </form>
  );
};
```

## 🎨 Shadcn/ui Component Usage

### 1. Kurulum
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label textarea card dialog
```

### 2. Component Import Pattern
```typescript
// components/features/products/ProductCard.tsx
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <CardTitle className="text-lg">{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">₺{product.price}</span>
          <Badge variant="secondary">Stok: {product.stock}</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onAddToCart(product)}
          className="w-full"
          disabled={product.stock === 0}
        >
          Sepete Ekle
        </Button>
      </CardFooter>
    </Card>
  );
};
```

## 🏪 Zustand Store Pattern

```typescript
// lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface StoreState {
  // Cart state
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Cart initial state
      cart: [],
      
      addToCart: (product, quantity = 1) => {
        const { cart } = get();
        const existingItem = cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
          set({
            cart: cart.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            cart: [...cart, { id: product.id, product, quantity }],
          });
        }
      },
      
      removeFromCart: (productId) => {
        set({
          cart: get().cart.filter(item => item.product.id !== productId),
        });
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        
        set({
          cart: get().cart.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          ),
        });
      },
      
      clearCart: () => set({ cart: [] }),
      
      // User state
      user: null,
      setUser: (user) => set({ user }),
      
      // UI state
      isSidebarOpen: false,
      toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),
    }),
    {
      name: 'ecommerce-store',
      partialize: (state) => ({
        cart: state.cart,
        user: state.user,
      }),
    }
  )
);
```

## 📱 Layout Components

### 1. Header Component
```typescript
// components/layout/Header.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, User } from 'lucide-react';
import { useStore } from '@/lib/store';

export const Header = () => {
  const { cart, user, toggleSidebar } = useStore();
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            E-Shop
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/products" className="hover:text-gray-600">
              Ürünler
            </Link>
            <Link href="/categories" className="hover:text-gray-600">
              Kategoriler
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
            
            {user ? (
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Giriş Yap
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
```

## 🚨 Error Handling & Loading States

### 1. Error Boundary
```typescript
// components/ui/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Bir şeyler ters gitti!</h2>
          <Button onClick={() => this.setState({ hasError: false })}>
            Tekrar Dene
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. Loading Components
```typescript
// components/ui/LoadingSpinner.tsx
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ className = '' }: { className?: string }) => {
  return <Loader2 className={`animate-spin ${className}`} />;
};

// components/ui/ProductSkeleton.tsx
export const ProductSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-48 rounded-t-lg"></div>
      <div className="p-4 space-y-2">
        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
        <div className="bg-gray-200 h-4 rounded w-1/2"></div>
        <div className="bg-gray-200 h-8 rounded"></div>
      </div>
    </div>
  );
};
```

## 🔒 Type Definitions

```typescript
// types/index.ts
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'price' | 'name' | 'date';
  sortOrder?: 'asc' | 'desc';
}
```

## 🎯 Development Guidelines

### 1. Naming Conventions
- **Components**: PascalCase (`ProductCard`, `LoginForm`)
- **Hooks**: camelCase with 'use' prefix (`useProducts`, `useAuth`)
- **Files**: kebab-case (`product-card.tsx`, `use-products.ts`)
- **API endpoints**: camelCase (`getProducts`, `createOrder`)

### 2. Code Organization
- Her feature için ayrı klasör
- Reusable components `components/ui/` içinde
- Business logic hooks içinde
- API calls services içinde

### 3. Performance Optimizations
- React.memo kullanımı gerektiğinde
- useMemo ve useCallback dikkatli kullanım
- React Query cache optimizasyonu
- Image optimization (Next.js Image component)

### 4. Testing Strategy
- Unit tests: Components ve hooks
- Integration tests: API calls
- E2E tests: Critical user flows

## 🚀 Next Steps

1. **Environment Variables Setup**:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

2. **Package Installation**:
   ```bash
   npm install @tanstack/react-query axios react-hook-form @hookform/resolvers zod zustand sonner
   ```

3. **Shadcn/ui Components**:
   ```bash
   npx shadcn-ui@latest add button input label textarea card dialog badge
   ```

4. **Mock Data Migration**: Existing mock data'yı API calls ile değiştir
5. **Authentication Integration**: JWT token management
6. **Error Handling**: Global error handling implementation

Bu dokümantasyon ile tutarlı ve maintainable bir e-ticaret frontend'i geliştirebilirsiniz.