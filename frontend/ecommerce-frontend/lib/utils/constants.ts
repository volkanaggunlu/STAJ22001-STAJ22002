// API Base Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 15000,
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    PER_MILLISECONDS: 15 * 60 * 1000, // 15 minutes
  },
} as const

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    ADDRESSES: '/users/addresses',
    FAVORITES: '/users/favorites',
    STATISTICS: '/users/statistics',
    FAVORITE_BY_ID: '/users/favorites',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: '/products/id',
    BY_SLUG: '/products/slug',
    CREATE: '/products',
    UPDATE: '/products',
    DELETE: '/products',
    SEARCH: '/products/search',
    FEATURED: '/products/featured',
    BESTSELLERS: '/products/bestsellers',
    NEW: '/products/new',
    BUNDLES: '/products/bundles',
    DISCOUNTED: '/products/discounted',
    CATEGORY: '/products/category',
    BRAND: '/products/brand',
    REVIEWS: '/products/:id/reviews',
    RELATED: (id: string) => `/products/${id}/related`,
    VIEW: '/products/:id/view',
    // Added helpers for slug-based routes used in services
    BY_CATEGORY: (slug: string) => `/products/category/${slug}`,
    BY_BRAND: (brand: string) => `/products/brand/${encodeURIComponent(brand)}`,
  },
  CATEGORIES: {
    LIST: '/categories',
    DETAIL: '/categories',
    CREATE: '/categories',
    UPDATE: '/categories',
    DELETE: '/categories',
    TREE: '/categories/tree',
    // Added helpers for id/slug-based routes used in services
    BY_ID: (id: string) => `/categories/${id}`,
    BY_SLUG: (slug: string) => `/categories/slug/${slug}`,
  },
  ORDERS: {
    LIST: '/orders',
    DETAIL: '/orders',
    CREATE: '/orders',
    UPDATE: '/orders',
    CANCEL: '/orders/:id/cancel',
    RETURN: '/orders/:id/return',
    TRACKING: '/orders/:id/tracking',
    INVOICE: '/orders/:id/invoice',
    REVIEW: '/orders/:id/review',
    INVOICE_PDF: (orderId: string) => `/orders/${orderId}/invoice`,
  },
  PAYMENTS: {
    PAYTR_INIT: '/payments/paytr/init',
    PAYTR_CALLBACK: '/payments/paytr/callback',
    BANK_TRANSFER: '/payments/bank-transfer/notify',
    LIST: '/payments',
    REFUND: '/payments/:id/refund',
  },
  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    UPDATE: '/cart/update',
    REMOVE: '/cart/remove',
    CLEAR: '/cart/clear',
    MERGE: '/cart/merge',
    SUMMARY: '/cart/summary',
    VALIDATE: '/cart/validate',
  },
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    UPDATE: '/reviews',
    DELETE: '/reviews',
    APPROVE: '/reviews/:id/approve',
    REJECT: '/reviews/:id/reject',
  },
  COUPONS: {
    LIST: '/coupons',
    CREATE: '/coupons',
    UPDATE: '/coupons',
    DELETE: '/coupons',
    VALIDATE: '/coupons/validate',
    USAGE: '/coupons/:id/usage',
  },
  SHIPPING: {
    CARRIERS: '/shipping/carriers',
    TRACK: '/track',
    TRACK_BY_NUMBER: '/track/number',
  },
  ADMIN: {
    DASHBOARD_STATS: '/admin/dashboard/stats',
    USERS: '/admin/users',
    PRODUCTS: '/admin/products',
    ORDERS: '/admin/orders',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
  },
  INVOICES: {
    LIST: '/invoices',
    DETAIL: (orderId: string) => `/invoices/${orderId}`,
    ADMIN_MANUAL: (orderId: string) => `/invoices/${orderId}/manual`,
    ADMIN_SEND_EMAIL: (orderId: string) => `/invoices/${orderId}/send-email`,
  },
} as const

// React Query Keys
export const QUERY_KEYS = {
  // Auth
  USER: ['user'],
  AUTH_CHECK: ['auth-check'],
  
  // Products
  PRODUCTS: ['products'],
  PRODUCT: ['product'],
  FEATURED_PRODUCTS: ['products', 'featured'],
  BESTSELLERS: ['products', 'bestsellers'],
  NEW_PRODUCTS: ['products', 'new'],
  BUNDLES: ['products', 'bundles'],
  PRODUCT_REVIEWS: ['product-reviews'],
  
  // Categories
  CATEGORIES: ['categories'],
  CATEGORY: ['category'],
  CATEGORY_TREE: ['categories', 'tree'],
  
  // Orders
  ORDERS: ['orders'],
  ORDER: ['order'],
  ORDER_TRACKING: ['order', 'tracking'],
  
  // Cart
  CART: ['cart'],
  CART_SUMMARY: ['cart', 'summary'],
  
  // Users
  USER_PROFILE: ['user', 'profile'],
  USER_ADDRESSES: ['user', 'addresses'],
  USER_FAVORITES: ['user', 'favorites'],
  USER_ORDERS: ['user', 'orders'],
  USER_STATISTICS: ['user', 'statistics'],
  
  // Admin
  ADMIN_STATS: ['admin', 'stats'],
  ADMIN_USERS: ['admin', 'users'],
  ADMIN_PRODUCTS: ['admin', 'products'],
  ADMIN_ORDERS: ['admin', 'orders'],
  ADMIN_ANALYTICS: ['admin', 'analytics'],
  
  // Reviews
  REVIEWS: ['reviews'],
  PRODUCT_REVIEW: ['product', 'review'],
  
  // Payments
  PAYMENTS: ['payments'],
  PAYMENT: ['payment'],
  
  // Coupons
  COUPONS: ['coupons'],
  COUPON: ['coupon'],
  
  // Shipping
  CARRIERS: ['carriers'],
  TRACKING: ['tracking'],
  INVOICES: ['invoices'],
  INVOICE: ['invoice'],
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN: 'Başarıyla giriş yapıldı',
  LOGOUT: 'Başarıyla çıkış yapıldı',
  REGISTER: 'Hesabınız başarıyla oluşturuldu',
  PASSWORD_CHANGED: 'Şifreniz başarıyla değiştirildi',
  PASSWORD_RESET_SENT: 'Şifre sıfırlama linki email adresinize gönderildi',
  PASSWORD_RESET: 'Şifreniz başarıyla sıfırlandı',
  EMAIL_VERIFIED: 'Email adresiniz başarıyla doğrulandı',
  
  // Products
  PRODUCT_CREATED: 'Ürün başarıyla oluşturuldu',
  PRODUCT_UPDATED: 'Ürün başarıyla güncellendi',
  PRODUCT_DELETED: 'Ürün başarıyla silindi',
  
  // Cart
  ADDED_TO_CART: 'Ürün sepete eklendi',
  REMOVED_FROM_CART: 'Ürün sepetten çıkarıldı',
  CART_UPDATED: 'Sepet güncellendi',
  CART_CLEARED: 'Sepet temizlendi',
  
  // Orders
  ORDER_CREATED: 'Siparişiniz başarıyla oluşturuldu',
  ORDER_CANCELLED: 'Siparişiniz iptal edildi',
  ORDER_UPDATED: 'Sipariş durumu güncellendi',
  
  // General
  SAVED: 'Başarıyla kaydedildi',
  UPDATED: 'Başarıyla güncellendi',
  DELETED: 'Başarıyla silindi',
  COPIED: 'Panoya kopyalandı',
} as const

// Error Messages
export const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Email veya şifre hatalı',
  EMAIL_ALREADY_EXISTS: 'Bu email adresi zaten kullanılıyor',
  USER_NOT_FOUND: 'Kullanıcı bulunamadı',
  INVALID_TOKEN: 'Geçersiz token',
  TOKEN_EXPIRED: 'Token süresi dolmuş',
  UNAUTHORIZED: 'Bu işlem için yetkiniz bulunmamaktadır',
  
  // Validation
  VALIDATION: 'Girilen bilgilerde hata var',
  REQUIRED_FIELD: 'Bu alan zorunludur',
  INVALID_EMAIL: 'Geçerli bir email adresi giriniz',
  INVALID_PHONE: 'Geçerli bir telefon numarası giriniz',
  PASSWORD_TOO_SHORT: 'Şifre en az 8 karakter olmalıdır',
  PASSWORDS_NOT_MATCH: 'Şifreler eşleşmiyor',
  
  // API
  NETWORK_ERROR: 'Bağlantı hatası oluştu',
  SERVER_ERROR: 'Sunucu hatası oluştu',
  REQUEST_TIMEOUT: 'İstek zaman aşımına uğradı',
  RATE_LIMIT: 'Çok fazla istek gönderdiniz. Lütfen bekleyiniz',
  NOT_FOUND: 'Aradığınız sayfa bulunamadı',
  
  // Business Logic
  OUT_OF_STOCK: 'Ürün stokta bulunmamaktadır',
  INSUFFICIENT_STOCK: 'Yeterli stok bulunmamaktadır',
  INVALID_QUANTITY: 'Geçerli bir miktar giriniz',
  CART_EMPTY: 'Sepetiniz boş',
  INVALID_COUPON: 'Geçersiz kupon kodu',
  COUPON_EXPIRED: 'Kupon süresi dolmuş',
  COUPON_USED: 'Bu kupon daha önce kullanılmış',
  
  // Generic
  UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu',
  OPERATION_FAILED: 'İşlem başarısız oldu',
} as const

// App Configuration
export const APP_CONFIG = {
  NAME: 'Açık Atölye',
  DESCRIPTION: 'Elektronik ve teknoloji ürünleri satış platformu',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'destek@Açık Atölye.com',
  PHONE: '+90 (555) 123 45 67',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
  
  // Cache Times (in milliseconds)
  CACHE_TIMES: {
    SHORT: 2 * 60 * 1000,     // 2 minutes
    MEDIUM: 5 * 60 * 1000,    // 5 minutes
    LONG: 30 * 60 * 1000,     // 30 minutes
    VERY_LONG: 60 * 60 * 1000, // 1 hour
  },
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  
  // Security
  PASSWORD_MIN_LENGTH: 8,
  LOGIN_ATTEMPT_LIMIT: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // UI
  TOAST_DURATION: 4000,
  SIDEBAR_WIDTH: 280,
  HEADER_HEIGHT: 64,
  
  // Social Media
  SOCIAL_LINKS: {
    FACEBOOK: 'https://facebook.com/Açık Atölye',
    TWITTER: 'https://twitter.com/Açık Atölye',
    INSTAGRAM: 'https://instagram.com/Açık Atölye',
    LINKEDIN: 'https://linkedin.com/company/Açık Atölye',
  },
} as const

// Product Categories
export const PRODUCT_CATEGORIES = {
  ELECTRONICS: 'electronics',
  ARDUINO: 'arduino',
  RASPBERRY_PI: 'raspberry-pi',
  SENSORS: 'sensors',
  MODULES: 'modules',
  TOOLS: 'tools',
  CABLES: 'cables',
  KITS: 'kits',
  BOOKS: 'books',
  GIFT_CARDS: 'gift-cards',
} as const

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
} as const

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const

// Shipping Methods
export const SHIPPING_METHODS = {
  STANDARD: 'standard',
  EXPRESS: 'express',
  OVERNIGHT: 'overnight',
  PICKUP: 'pickup',
} as const

// Export types for TypeScript
export type ApiEndpoint = typeof API_ENDPOINTS
export type QueryKey = typeof QUERY_KEYS
export type SuccessMessage = typeof SUCCESS_MESSAGES
export type ErrorMessage = typeof ERROR_MESSAGES
export type AppConfig = typeof APP_CONFIG 