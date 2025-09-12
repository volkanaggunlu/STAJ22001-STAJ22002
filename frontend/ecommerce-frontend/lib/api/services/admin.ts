import { apiClient } from '../client'
import { API_ENDPOINTS } from '@/lib/utils/constants'

export interface DashboardStats {
  totalProducts: number
  totalUsers: number
  totalOrders: number
  monthlySales: number
  pageViews: number
  averageRating: number
  trends: {
    products: string
    users: string
    orders: string
    sales: string
    pageViews: string
    rating: string
  }
}

export interface RecentOrder {
  id: string
  customerName: string
  customerEmail: string
  totalAmount: number
  status: string
  createdAt: string
  items: Array<{
    productName: string
    quantity: number
    price: number
  }>
}

export interface TopProduct {
  id: string
  name: string
  salesCount: number
  revenue: number
  trend: string
  image?: string
}

export interface SalesData {
  month: string
  sales: number
  orders: number
  customers: number
}

export interface CategoryDistribution {
  categoryName: string
  percentage: number
  sales: number
  color: string
}

export type AdminOrderPaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'paid'

export interface Order {
  _id: string
  orderNumber: string
  userId: {
    _id: string
    firstName: string
    lastName: string
    email: string
  }
  items: Array<{
    productId: string
    name: string
    image?: string
    price: number
    originalPrice?: number
    quantity: number
    sku: string
    type: 'product' | 'bundle'
    bundleItems?: Array<{ productId: string; name: string; quantity: number; price: number }>
  }>
  totalItems: number
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  currency: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  statusHistory?: Array<{ status: Order['status']; date: string; note?: string; updatedBy?: string }>
  shippingAddress: {
    title?: string
    firstName: string
    lastName: string
    email?: string
    address: string
    city: string
    district: string
    postalCode: string
    phone: string
  }
  billingAddress: {
    firstName?: string
    lastName?: string
    email: string
    phone: string
    address: string
    city: string
    district: string
    postalCode: string
    companyName?: string
    taxNumber?: string
    taxOffice?: string
    eInvoiceAddress?: string
    tckn?: string
  }
  shippingMethod: 'standard' | 'express' | 'same-day'
  shippingTime: 'same-day' | '1-2-days' | '2-3-days' | '3-5-days' | '5-7-days'
  tracking?: {
    trackingNumber?: string
    carrier?: 'aras' | 'mng' | 'yurtici' | 'ptt' | 'ups' | 'dhl' | 'fedex' | ''
    service?: 'standard' | 'express' | 'nextday' | ''
    status?: 'pending' | 'created' | 'picked_up' | 'in_transit' | 'delivered' | 'failed'
    trackingUrl?: string
    estimatedDelivery?: string
    actualDelivery?: string
  }
  payment?: {
    method: 'credit-card' | 'debit-card' | 'bank-transfer' | 'cash-on-delivery'
    status: AdminOrderPaymentStatus
    transactionId?: string
    paymentDate?: string
    refundDate?: string
    refundAmount?: number
  }
  coupon?: {
    code?: string
    discountType?: string
    discountValue?: number
    discountAmount?: number
  }
  campaign?: {
    id?: string
    name?: string
    type?: string
    discountType?: string
    discountValue?: number
    discountAmount?: number
  }
  notes?: {
    customer?: string
    admin?: string
    delivery?: string
  }
  shippingType?: 'standart' | 'ekspres' | 'same-day'
  isGift: boolean
  giftMessage?: string
  kvkkConsent: boolean
  privacyPolicyConsent: boolean
  distanceSalesConsent: boolean
  orderDate: string
  confirmedDate?: string
  shippedDate?: string
  deliveredDate?: string
  cancelledDate?: string
  returnedDate?: string
  createdAt: string
  updatedAt: string
  // Sanal alanlar (backend virtuals)
  totalSavings?: number
  canBeCancelled?: boolean
  canBeReturned?: boolean
  isOverdue?: boolean
  viewCount?: number
  source?: 'website' | 'mobile-app' | 'admin-panel'
}

export interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  totalPages: number
}

export interface OrdersFilters {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: string
  dateRange?: string
  paymentMethod?: string
}

export const adminApi = {
  // Dashboard istatistikleri
  getDashboardStats: async (): Promise<DashboardStats> => {
    // Debug log'lar sadece development'ta
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Dashboard stats API çağrısı başlatılıyor...')
      
      // Token kontrolü için localStorage'dan direkt kontrol (güvenlik için sadece ilk karakterler)
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
      console.log('🔑 Token:', token ? `${token.substring(0, 10)}...` : 'Token bulunamadı')
    }
    
    try {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.DASHBOARD_STATS)
      
      // Development'ta detaylı log
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Dashboard stats response:', response.data)
        console.log('📊 Actual data:', response.data.data)
      }
      
      return response.data.data // API response structure: {success: true, data: {...}}
    } catch (error) {
      // Error log'ları production'da da olmalı (ama detay vermeden)
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Dashboard stats error:', error)
      } else {
        console.error('Dashboard stats API hatası')
      }
      throw error
    }
  },

  // Son siparişler
  getRecentOrders: async (limit: number = 5): Promise<RecentOrder[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ADMIN.ORDERS}?limit=${limit}&sort=createdAt:desc`)
    return response.data.data?.orders || []
  },

  // En çok satan ürünler
  getTopProducts: async (limit: number = 5): Promise<TopProduct[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ADMIN.PRODUCTS}/top-selling?limit=${limit}`)
    return response.data.data?.products || []
  },

  // Satış verileri (chart için)
  getSalesData: async (period: string = '6m'): Promise<SalesData[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ADMIN.ANALYTICS}/sales?period=${period}`)
    return response.data.data?.salesData || []
  },

  // Kategori dağılımı
  getCategoryDistribution: async (): Promise<CategoryDistribution[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.ADMIN.ANALYTICS}/categories`)
    return response.data.data?.distribution || []
  },

  // Kullanıcı listesi
  getUsers: async (params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.role) searchParams.append('role', params.role)
    if (params?.status) searchParams.append('status', params.status)

    const response = await apiClient.get(`${API_ENDPOINTS.ADMIN.USERS}?${searchParams}`)
    return response.data.data
  },

  // Kullanıcı silme
  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`${API_ENDPOINTS.ADMIN.USERS}/${id}`)
    return response.data
  },

  // Kullanıcının son siparişleri (admin) - mevcut stats endpointini kullanır
  getUserRecentOrders: async (userId: string) => {
    const res = await apiClient.get(`/admin/users/${userId}/stats`)
    return res.data?.data?.recentOrders || []
  },

  // Ürün listesi
  getProducts: async (params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    status?: string
    type?: string
    sortBy?: string
    sortOrder?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.type) searchParams.append('type', params.type)
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder)

    const response = await apiClient.get(`${API_ENDPOINTS.ADMIN.PRODUCTS}?${searchParams}`)
    return response.data.data
  },

  // Sipariş listesi
  getOrders: async (filters: OrdersFilters = {}): Promise<OrdersResponse> => {
    const params = new URLSearchParams()
    
    // Pagination
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    
    // Sorting
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
    
    // Filters
    if (filters.search) params.append('search', filters.search)
    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.paymentMethod && filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod)
    
    // Date range
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      let startDate: Date
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          break
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0)
      }
      
      if (filters.dateRange !== 'all') {
        params.append('startDate', startDate.toISOString().split('T')[0])
        params.append('endDate', now.toISOString().split('T')[0])
      }
    }

    const response = await apiClient.get(`${API_ENDPOINTS.ADMIN.ORDERS}?${params.toString()}`)
    return response.data.data
  },

  // Sipariş detayı
  getOrderDetails: async (orderId: string): Promise<Order> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Admin API: Sipariş detayı isteği:', orderId)
      console.log('�� Endpoint:', `/api/admin/orders/${orderId}`)
      
      // Token kontrolü
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
      console.log('🔑 Token mevcut:', !!token)
      if (token) {
        console.log('🔑 Token başlangıcı:', token.substring(0, 20) + '...')
      }
    }
    
    try {
      const response = await apiClient.get(`/orders/${orderId}`)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Admin API: Sipariş detayı response:', response.data)
        console.log('📊 Response data structure:', {
          success: response.data.success,
          hasOrder: !!response.data.order,
          orderKeys: response.data.order ? Object.keys(response.data.order) : 'No order data'
        })
      }
      
      return response.data.order
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Admin API: Sipariş detayı hatası:', error)
        console.error('❌ Error details:', {
          status: (error as any).response?.status,
          statusText: (error as any).response?.statusText,
          data: (error as any).response?.data
        })
      }
      throw error
    }
  },

  // Sipariş durumu güncelleme
  updateOrderStatus: async (orderId: string, status: string, note?: string): Promise<any> => {
    const response = await apiClient.put(`/admin/orders/${orderId}/status`, {
      status,
      note
    })
    return response.data
  },

  // Ödeme durumunu güncelleme
  updateOrderPaymentStatus: async (
    orderId: string,
    paymentStatus: AdminOrderPaymentStatus
  ): Promise<any> => {
    const response = await apiClient.put(`/admin/orders/${orderId}/payment-status`, {
      paymentStatus,
    })
    return response.data
  },

  // Kargo takip numarası ekleme
  updateOrderTracking: async (orderId: string, trackingNumber: string, carrier: string): Promise<any> => {
    const response = await apiClient.put(`/admin/orders/${orderId}/tracking`, {
      trackingNumber,
      carrier
    })
    return response.data
  },

  // Sipariş fatura indirme
  downloadOrderInvoice: async (orderId: string): Promise<Blob> => {
    const response = await apiClient.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Sipariş tekrarlama
  repeatOrder: async (orderId: string): Promise<any> => {
    const response = await apiClient.post(`/orders/${orderId}/repeat`)
    return response.data
  },

  // Tarih aralığı siparişleri
  getOrdersByDateRange: async (startDate: string, endDate: string): Promise<Order[]> => {
    const response = await apiClient.get(`/orders/get-by-date?startDate=${startDate}&endDate=${endDate}`)
    return response.data
  },

  // Ürün oluşturma
  createProduct: async (productData: any) => {
    const response = await apiClient.post(API_ENDPOINTS.ADMIN.PRODUCTS, productData)
    return response.data.data
  },

  // Ürün güncelleme
  updateProduct: async (id: string, productData: any) => {
    const response = await apiClient.put(`${API_ENDPOINTS.ADMIN.PRODUCTS}/${id}`, productData)
    return response.data.data
  },

  // Ürün status güncelleme
  updateProductStatus: async (id: string, status: 'active' | 'inactive' | 'discontinued') => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 API: Status güncelleme isteği:', { id, status })
      console.log('📡 Endpoint:', `${API_ENDPOINTS.ADMIN.PRODUCTS}/${id}/status`)
    }
    
    try {
      const response = await apiClient.put(`${API_ENDPOINTS.ADMIN.PRODUCTS}/${id}/status`, { status })
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ API: Status güncelleme response:', response.data)
        console.log('📊 API: Returned data:', response.data.data)
      }
      
      return response.data.data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ API: Status güncelleme hatası:', error)
      }
      throw error
    }
  },

  // Ürün silme
  deleteProduct: async (id: string) => {
    const response = await apiClient.delete(`${API_ENDPOINTS.ADMIN.PRODUCTS}/${id}`)
    return response.data
  },

  // Bulk ürün işlemleri
  bulkProductActions: async (action: string, productIds: string[], data?: any) => {
    const response = await apiClient.post(`${API_ENDPOINTS.ADMIN.PRODUCTS}/bulk`, {
      action,
      productIds,
      data
    })
    return response.data.data
  },

  // Ürün resim upload
  uploadProductImages: async (files: FileList, productId?: string) => {
    const formData = new FormData()
    
    Array.from(files).forEach(file => {
      formData.append('images', file)
    })
    
    if (productId) {
      formData.append('productId', productId)
    }

    const response = await apiClient.post('/admin/upload/product-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  // Fatura PDF upload
  uploadInvoicePdf: async (file: File, orderId?: string) => {
    const formData = new FormData()
    // Backend tek dosya beklediği için alan adını 'file' olarak kullanıyoruz (multer single('file'))
    formData.append('file', file)
    if (orderId) {
      formData.append('orderId', orderId)
    }
    const response = await apiClient.post('/admin/upload/invoice-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data
  },

  // Kategoriler
  getCategories: async () => {
    const response = await apiClient.get('/admin/categories')
    return response.data.data
  },

  // Admin kategori CRUD işlemleri
  adminCategories: {
    // Tüm kategorileri getir (hiyerarşik yapıda)
    getAll: async () => {
      const response = await apiClient.get('/admin/categories')
      return response.data.data
    },

    // Kategori ağaç yapısını getir
    getTree: async () => {
      const response = await apiClient.get('/admin/categories?tree=true')
      return response.data.data
    },

    // Tek kategori getir
    getById: async (id: string) => {
      const response = await apiClient.get(`/categories/${id}`)
      return response.data.category
    },

    // Yeni kategori oluştur
    create: async (categoryData: {
      name: string
      slug?: string
      description?: string
      parent?: string
      image?: {
        url: string
        alt: string
      }
      isActive?: boolean
      isVisible?: boolean
      isFeatured?: boolean
      showInMenu?: boolean
      showInFooter?: boolean
      sortOrder?: number
      icon?: string
      seo?: {
        title?: string
        description?: string
        keywords?: string[]
      }
    }) => {
      const response = await apiClient.post('/admin/categories', categoryData)
      return response.data.data
    },

    // Kategori güncelle
    update: async (id: string, categoryData: {
      name?: string
      slug?: string
      description?: string
      parent?: string
      image?: {
        url: string
        alt: string
      }
      isActive?: boolean
      isVisible?: boolean
      isFeatured?: boolean
      showInMenu?: boolean
      showInFooter?: boolean
      sortOrder?: number
      icon?: string
      seo?: {
        title?: string
        description?: string
        keywords?: string[]
      }
    }) => {
      const response = await apiClient.put(`/admin/categories/${id}`, categoryData)
      return response.data.data
    },

    // Kategori sil (soft delete)
    delete: async (id: string) => {
      const response = await apiClient.delete(`/admin/categories/${id}`)
      return response.data
    },

    // Kategori sıralama güncelle
    updateOrder: async (categories: Array<{id: string, order: number, parent?: string}>) => {
      const response = await apiClient.put('/admin/categories/reorder', { categories })
      return response.data.data
    },

    // Kategori durumu değiştir
    updateStatus: async (id: string, isActive: boolean) => {
      const response = await apiClient.put(`/admin/categories/${id}/status`, { isActive })
      return response.data.data
    },

    // Bulk kategori işlemleri
    bulkActions: async (action: 'activate' | 'deactivate' | 'delete', categoryIds: string[]) => {
      const response = await apiClient.post('/admin/categories/bulk', {
        action,
        categoryIds
      })
      return response.data.data
    },

    // Kategori resim upload
    uploadImage: async (file: File, categoryId?: string) => {
      const formData = new FormData()
      formData.append('image', file)
      
      if (categoryId) {
        formData.append('categoryId', categoryId)
      }

      const response = await apiClient.post('/admin/upload/category-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data.data
    }
  }
} 