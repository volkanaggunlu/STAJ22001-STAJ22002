// Base API Response Structure
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

// Token payload interface for JWT
export interface TokenPayload {
  exp: number
  userId: string
  email: string
  role: string
  iat?: number
  iss?: string
  sub?: string
}

// Error Response Structure
export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

// Pagination Structure
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  gender: 'male' | 'female'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  surname: string
  firstName: string
  lastName: string
  gender: string
  phone?: string
  role: 'user' | 'admin'
  isVerified: boolean
  addresses?: Address[]
  favorites?: any[]
  totalOrders?: number
  totalSpent?: number
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: AuthUser
  tokens: AuthTokens
}

// User Types
export interface Address {
  id: string
  firstName: string
  lastName: string
  address: string
  city: string
  district: string
  phone: string
  isDefault: boolean
}

export interface UserProfile {
  id: string
  email: string
  name: string
  surname: string
  phone: string
  birthDate?: string
  gender?: 'male' | 'female' | 'other'
  addresses: Address[]
  favorites: string[]
  totalOrders: number
  totalSpent: number
  lastLogin?: string
}

// Product Types
export interface ProductImage {
  url: string
  alt: string
  isPrimary: boolean
}

export interface ProductSpecification {
  key: string
  value: string
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
}

export interface BundleItem {
  productId: string
  name: string
  description?: string
  image?: string
  quantity: number
  price: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  originalPrice?: number
  discountPercentage?: number
  category: ProductCategory
  subCategories?: ProductCategory[]
  brand: string
  sku: string
  images: ProductImage[]
  specifications: ProductSpecification[]
  features: string[]
  type: 'product' | 'bundle'
  bundleItems?: BundleItem[]
  bundleType?: 'kit' | 'set' | 'package' | 'bundle'
  itemCount?: number
  stock: {
    quantity: number
    lowStockThreshold: number
    trackStock: boolean
  }
  shipping: {
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
    freeShipping: boolean
    shippingTime: 'same-day' | '1-2-days' | '2-3-days' | '3-5-days' | '5-7-days'
  }
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  rating: {
    average: number
    count: number
    distribution: {
      five: number
      four: number
      three: number
      two: number
      one: number
    }
  }
  reviews: string[]
  status: 'active' | 'inactive' | 'discontinued'
  isNew: boolean
  isBestseller: boolean
  isFeatured: boolean
  stats: {
    views: number
    purchases: number
    addedToCart: number
    addedToWishlist: number
  }
  publishedAt: string
  lastModified: string
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  search?: string
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating'
  page?: number
  limit?: number
}

// Category Types
export interface CategoryFilter {
  name: string
  type: 'range' | 'checkbox' | 'radio' | 'select'
  options: Array<{
    label: string
    value: string
    count: number
  }>
  isActive: boolean
}

export interface CategoryCustomField {
  name: string
  value: string
  type: 'text' | 'number' | 'boolean' | 'url'
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent?: Category | null
  children?: Category[]
  level: number
  image?: {
    url: string
    alt: string
  }
  icon?: string
  // SEO
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
  // Görünüm ayarları
  isActive: boolean
  isVisible?: boolean
  isFeatured?: boolean
  showInMenu?: boolean
  showInFooter?: boolean
  // Sıralama
  sortOrder?: number
  // İstatistikler
  stats?: {
    productCount?: number
    totalSales?: number
    viewCount?: number
  }
  // Backward compatibility
  productCount?: number // Deprecated, use stats.productCount
  // Filtreler
  filters?: CategoryFilter[]
  // Özel alanlar
  customFields?: CategoryCustomField[]
  // Timestamps
  createdAt?: string
  updatedAt?: string
}

// Cart Types
export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  addedAt: string;
  product?: Product;
}

export interface Cart {
  id?: string
  userId?: string
  items: CartItem[]
  totalItems: number
  subtotal: number
  totalSavings: number
  lastModified: string
}

// Order Types
export interface OrderItem {
  productId: string
  product: {
    id: string
    name: string
    slug: string
    image: string
    price: number
  }
  quantity: number
  price: number
  total: number
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  address: string
  city: string
  district: string
  phone: string
}

export interface Order {
  id: string
  userId: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'credit_card' | 'bank_transfer' | 'paytr'
  shippingAddress: ShippingAddress
  trackingNumber?: string
  estimatedDelivery?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  items: {
    productId: string
    quantity: number
  }[]
  shippingAddress: ShippingAddress
  paymentMethod: 'credit_card' | 'bank_transfer' | 'paytr'
  notes?: string
}

// Payment Types
export interface PayTRRequest {
  orderId: string
}

export interface PayTRResponse {
  iframeUrl: string
  token: string
}

export interface BankTransferRequest {
  orderId: string
  bankName: string
  transferDate: string
  transferAmount: number
  senderName: string
  receipt: string // base64 encoded image
}

// Review Types
export interface Review {
  id: string
  userId: string
  user: {
    name: string
    surname: string
  }
  productId: string
  orderId: string
  rating: number
  comment: string
  images?: string[]
  isApproved: boolean
  isVerifiedPurchase: boolean
  helpfulCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateReviewRequest {
  productId: string
  rating: number
  comment: string
  images?: File[]
}

// Admin Types
export interface AdminStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  pendingOrders: number
  lowStockProducts: number
  pendingReviews: number
  recentActivity: AdminActivity[]
}

export interface AdminActivity {
  id: string
  type: 'order' | 'user' | 'product' | 'review'
  description: string
  createdAt: string
}

export interface SalesAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  data: {
    date: string
    sales: number
    orders: number
    revenue: number
  }[]
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  growth: {
    sales: number
    orders: number
    revenue: number
  }
}

// Common Query Parameters
export interface QueryParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, any>
}

// File Upload Types
export interface UploadResponse {
  url: string
  filename: string
  size: number
  mimetype: string
}

// Notification Types
export interface Notification {
  id: string
  userId: string
  type: 'order' | 'payment' | 'shipping' | 'product' | 'system'
  title: string
  message: string
  isRead: boolean
  data?: any
  createdAt: string
}

// Search Types
export interface SearchResult {
  products: Product[]
  categories: Category[]
  totalResults: number
  searchTime: number
  suggestions: string[]
}

export interface SearchFilters extends ProductFilters {
  categoryIds?: string[]
  brandIds?: string[]
  attributes?: Record<string, string[]>
}

// Coupon Types
export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  usedCount: number
  validFrom: string
  validUntil: string
  isActive: boolean
  applicableProducts?: string[]
  applicableCategories?: string[]
}

// Error Types
export type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'

export interface ValidationError {
  field: string
  message: string
  code: string
} 

// Invoice (Manual) Types
export type InvoiceStatus = 'pending' | 'sent' | 'processing' | 'approved' | 'rejected' | 'error'

export interface InvoiceSellerInfo {
  name?: string
  taxOffice?: string
  vkn?: string
  mersis?: string
  address?: string
  city?: string
  district?: string
  postalCode?: string
  phone?: string
  email?: string
  bankName?: string
  iban?: string
}

export interface InvoiceBuyerInfo {
  firstName?: string
  lastName?: string
  companyName?: string
  tckn?: string
  taxNumber?: string
  taxOffice?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  district?: string
  postalCode?: string
}

export interface InvoiceItem {
  productId?: string
  name?: string
  sku?: string
  quantity?: number
  unitPrice?: number
  discount?: number
  taxRate?: number
  taxAmount?: number
  totalExclTax?: number
  totalInclTax?: number
}

export interface InvoiceTotals {
  subtotal?: number
  discountsTotal?: number
  shippingCost?: number
  taxTotal?: number
  grandTotal?: number
}

export interface InvoiceShippingInfo {
  address?: string
  city?: string
  district?: string
  postalCode?: string
  carrier?: string
  trackingNumber?: string
  deliveredAt?: string | null
}

export interface InvoiceMetaInfo {
  invoiceNumber?: string
  invoiceDate?: string
  currency?: string
  orderNumber?: string
  orderDate?: string
  paymentMethod?: string
  paymentDate?: string
  notes?: string
}

export interface Invoice {
  orderId: string
  userId?: string
  status: InvoiceStatus
  isManual: boolean
  createdBy?: string
  sentAt?: string | null
  sentToUserAt?: string | null
  seller?: InvoiceSellerInfo
  buyer?: InvoiceBuyerInfo
  items?: InvoiceItem[]
  totals?: InvoiceTotals
  shipping?: InvoiceShippingInfo
  meta?: InvoiceMetaInfo
  pdfPath?: string | null
  manualNotes?: string
  createdAt?: string
  updatedAt?: string
}

export interface InvoiceListResponse {
  items: Invoice[]
  pagination: PaginationMeta
} 