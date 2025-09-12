'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Download,
  Upload,
  CheckSquare,
  Square,
  Minus,
  RefreshCw,
  SortAsc,
  SortDesc,
  SearchCheck,
  Package,
  Truck,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  FileText,
  Printer,
  Copy,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatPrice } from '@/lib/utils/format'
import { adminApi, type Order as AdminOrder } from '@/lib/api/services/admin'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import invoicesApi from '@/lib/api/services/invoices'
// import { useAdminSendInvoiceEmail } from '@/lib/hooks/useInvoices'

// Types
interface Order {
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
    productName: string
    image: string
    price: number
    originalPrice: number
    quantity: number
    sku: string
    type: string
  }>
  totalItems: number
  subtotal: number
  shippingCost: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  currency: string
  status: string
  shippingAddress: {
    title: string
    firstName: string
    lastName: string
    address: string
    city: string
    district: string
    postalCode: string
    phone: string
  }
  billingAddress?: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    district: string
    postalCode: string
  }
  shippingMethod: string
  shippingTime: string
  paymentMethod: string
  coupon?: {
    code: string
    discount: number
  }
  campaign?: {
    id: string
    name: string
    type: string
    discountType: string
    discountValue: number
    discountAmount: number
  }
  shippingType: string
  isGift: boolean
  kvkkConsent: boolean
  privacyPolicyConsent: boolean
  distanceSalesConsent: boolean
  viewCount: number
  source: string
  orderDate: string
  createdAt: string
  updatedAt: string
  totalSavings: number
  canBeCancelled: boolean
  canBeReturned: boolean
  isOverdue: boolean
  tracking?: {
    trackingNumber: string
    carrier: string
    trackingUrl: string
    estimatedDelivery: string
    actualDelivery?: string
  }
}

interface FilterState {
  search: string
  status: string
  dateRange: string
  paymentMethod: string
}

interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  totalPages: number
}

export default function AdminOrdersPage() {
  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])

  // Filter states
  const [tempFilters, setTempFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateRange: 'all',
    paymentMethod: 'all'
  })

  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateRange: 'all',
    paymentMethod: 'all'
  })

  const [invoiceStatusMap, setInvoiceStatusMap] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()
  const router = useRouter()

  // Payment status dialog state (row bağımsız, kökte yönetiliyor)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentDialogOrderId, setPaymentDialogOrderId] = useState<string | null>(null)
  const [paymentDialogValue, setPaymentDialogValue] = useState<'pending' | 'paid' | 'failed' | 'refunded'>('pending')
  const paymentStatusMutation = useMutation({
    mutationFn: (payload: { orderId: string; status: 'pending' | 'paid' | 'failed' | 'refunded' }) =>
      adminApi.updateOrderPaymentStatus(payload.orderId, payload.status),
    onSuccess: () => {
      toast.success('Ödeme durumu güncellendi')
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      setPaymentDialogOpen(false)
    },
    onError: () => toast.error('Ödeme durumu güncellenemedi'),
  })

  async function handleDownloadInvoice(orderId: string) {
    try {
      const blob = await invoicesApi.downloadPdf(orderId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error('Fatura indirilemedi')
    }
  }

  async function handleSendInvoiceEmail(orderId: string) {
    try {
      await invoicesApi.adminSendEmail(orderId)
      toast.success('Fatura e‑postası gönderildi')
    } catch (e: any) {
      toast.error('E‑posta gönderilemedi')
    }
  }

  const getInvoiceStatusBadge = (status?: string) => {
    const cls = status === 'approved' ? 'bg-green-100 text-green-800'
      : status === 'rejected' ? 'bg-red-100 text-red-800'
      : status === 'sent' || status === 'processing' ? 'bg-blue-100 text-blue-800'
      : status === 'failed' ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-800'
    return (
      <Badge className={cls}>
        {status || 'fatura-yok'}
      </Badge>
    )
  }

  // API Calls
  const { data: ordersData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'orders', currentPage, pageSize, sortBy, sortOrder, appliedFilters],
    queryFn: () => adminApi.getOrders({
      page: currentPage,
      limit: pageSize,
      sortBy,
      sortOrder,
      ...appliedFilters
    }),
    staleTime: 30000, // 30 saniye
    retry: 2
  })

  // Handlers
  const handleSelectAll = () => {
    if (selectedOrders.length === (ordersData?.orders?.length || 0)) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(ordersData?.orders?.map(order => order._id) || [])
    }
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleTempFilterChange = (field: keyof FilterState, value: string) => {
    setTempFilters(prev => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    setAppliedFilters(tempFilters)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      status: 'all',
      dateRange: 'all',
      paymentMethod: 'all'
    }
    setTempFilters(clearedFilters)
    setAppliedFilters(clearedFilters)
    setCurrentPage(1)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleViewDetails = (order: AdminOrder) => {
    router.push(`/admin/orders/${order._id}`)
  }

  const handlePageSizeChange = (newPageSize: string) => {
    const newSize = parseInt(newPageSize)
    setPageSize(newSize)
    setCurrentPage(1) // Sayfa boyutu değiştiğinde ilk sayfaya dön
  }

  // Utility functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-800' },
      processing: { label: 'İşleniyor', color: 'bg-purple-100 text-purple-800' },
      shipped: { label: 'Kargoda', color: 'bg-orange-100 text-orange-800' },
      delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800' },
      returned: { label: 'İade Edildi', color: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      'credit-card': { label: 'Kredi Kartı', icon: CreditCard },
      'bank-transfer': { label: 'Banka Transferi', icon: CreditCard },
      'cash-on-delivery': { label: 'Kapıda Ödeme', icon: CreditCard }
    }

    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig['credit-card']
    const Icon = config.icon
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  function PaymentStatusAction({ orderId, current }: { orderId: string; current?: string }) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState<'pending' | 'paid' | 'failed' | 'refunded'>(
      (current as any) || 'pending'
    )
    const queryClient = useQueryClient()
    const { mutate, isPending } = useMutation({
      mutationFn: (payload: { orderId: string; status: 'pending' | 'paid' | 'failed' | 'refunded' }) =>
        adminApi.updateOrderPaymentStatus(payload.orderId, payload.status),
      onSuccess: () => {
        toast.success('Ödeme durumu güncellendi')
        queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
        setOpen(false)
      },
      onError: () => toast.error('Ödeme durumu güncellenemedi'),
    })
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className="w-full justify-start px-2" onClick={() => setOpen(true)}>
            <CreditCard className="h-4 w-4 mr-2" /> Ödeme Durumunu Değiştir
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ödeme Durumunu Değiştir</AlertDialogTitle>
            <AlertDialogDescription>Yeni ödeme durumunu seçin.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={value} onValueChange={(v) => setValue(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="paid">Ödendi</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
                <SelectItem value="refunded">İade Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={() => mutate({ orderId, status: value })}>
              Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDateRangeFilter = (dateRange: string) => {
    const now = new Date()
    const ranges = {
      today: { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: now },
      week: { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now },
      month: { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now },
      quarter: { start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), end: now },
      year: { start: new Date(now.getFullYear(), 0, 1), end: now }
    }
    return ranges[dateRange as keyof typeof ranges] || null
  }

  // Computed values
  const totalOrders = ordersData?.total || 0
  const totalPages = ordersData?.totalPages || Math.ceil(totalOrders / pageSize) || 1
  const orders = ordersData?.orders || []

  // Debug bilgisi
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Pagination Debug:', {
        totalOrders,
        totalPages,
        ordersLength: orders.length,
        currentPage,
        pageSize,
        ordersData: ordersData,
        calculatedTotalPages: Math.ceil(totalOrders / pageSize)
      })
    }
  }, [totalOrders, totalPages, orders.length, currentPage, pageSize, ordersData])

  // Sayfa değiştiğinde scroll'u yukarı çıkar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Siparişler Yüklenirken Hata</h3>
              <p className="text-muted-foreground mb-4">
                Siparişler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
              </p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tekrar Dene
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sipariş Yönetimi</h1>
          <p className="text-muted-foreground">
            Tüm siparişleri görüntüleyin, durumlarını güncelleyin ve yönetin
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Arama</label>
              <Input
                placeholder="Sipariş no, müşteri email..."
                value={tempFilters.search}
                onChange={(e) => handleTempFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Durum</label>
              <Select value={tempFilters.status} onValueChange={(value) => handleTempFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="confirmed">Onaylandı</SelectItem>
                  <SelectItem value="processing">İşleniyor</SelectItem>
                  <SelectItem value="shipped">Kargoda</SelectItem>
                  <SelectItem value="delivered">Teslim Edildi</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  <SelectItem value="returned">İade Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tarih Aralığı</label>
              <Select value={tempFilters.dateRange} onValueChange={(value) => handleTempFilterChange('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="today">Bugün</SelectItem>
                  <SelectItem value="week">Bu Hafta</SelectItem>
                  <SelectItem value="month">Bu Ay</SelectItem>
                  <SelectItem value="quarter">Bu Çeyrek</SelectItem>
                  <SelectItem value="year">Bu Yıl</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Ödeme Yöntemi</label>
              <Select value={tempFilters.paymentMethod} onValueChange={(value) => handleTempFilterChange('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="credit-card">Kredi Kartı</SelectItem>
                  <SelectItem value="bank-transfer">Banka Transferi</SelectItem>
                  <SelectItem value="cash-on-delivery">Kapıda Ödeme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Button onClick={applyFilters}>
                <SearchCheck className="h-4 w-4 mr-2" />
                Filtrele
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Temizle
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {totalOrders} sipariş bulundu
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Siparişler</CardTitle>
            <div className="flex items-center space-x-2">
              {selectedOrders.length > 0 && (
                <Badge variant="secondary">
                  {selectedOrders.length} seçili
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-6 w-[100px]" />
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedOrders.includes(order._id)}
                        onCheckedChange={() => handleSelectOrder(order._id)}
                      />
                      <div className="flex items-center space-x-3">
                        <Package className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{order.orderNumber}</span>
                            {getStatusBadge(order.status)}
                            {/* Fatura durumu rozeti */}
                            {getInvoiceStatusBadge(invoiceStatusMap[order._id])}
                            {/* Fatura durum yenile kaldırıldı */}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.userId.firstName} {order.userId.lastName} • {order.userId.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium">{formatPrice(order.totalAmount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.totalItems} ürün
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getPaymentMethodBadge(order.paymentMethod)}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Detayları Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDownloadInvoice(order._id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Fatura PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendInvoiceEmail(order._id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            E‑posta Gönder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              setPaymentDialogOrderId(order._id)
                              setPaymentDialogValue(((order as any)?.paymentStatus as any) || 'pending')
                              setPaymentDialogOpen(true)
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-2" /> Ödeme Durumunu Değiştir
                          </DropdownMenuItem>
                          
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Order Items Preview */}
                  <div className="mt-4 flex items-center space-x-2">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{item.productName}</span>
                        <span>×{item.quantity}</span>
                        {index < Math.min(3, order.items.length - 1) && <span>•</span>}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-sm text-muted-foreground">
                        +{order.items.length - 3} daha
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {orders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Toplam {totalOrders} sipariş • Sayfa {currentPage} / {totalPages}
              </div>
              
              <div className="flex items-center space-x-2">
                {/* İlk Sayfa - Sadece desktop'ta görünür */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || isLoading}
                  className="hidden lg:flex"
                >
                  İlk
                </Button>
                
                {/* Önceki Sayfa */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Sayfa Numaraları - Mobilde sadece mevcut sayfa gösterilir */}
                <div className="hidden sm:flex items-center space-x-1">
                  {(() => {
                    const pages = []
                    const maxVisiblePages = 5
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                    
                    // Eğer son sayfalar görünüyorsa, başlangıcı ayarla
                    if (endPage - startPage + 1 < maxVisiblePages) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1)
                    }
                    
                    // İlk sayfa ve üç nokta
                    if (startPage > 1) {
                      pages.push(
                        <Button
                          key="1"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0"
                        >
                          1
                        </Button>
                      )
                      if (startPage > 2) {
                        pages.push(
                          <span key="dots1" className="px-2 text-muted-foreground">
                            ...
                          </span>
                        )
                      }
                    }
                    
                    // Görünür sayfa numaraları
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={currentPage === i ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(i)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0"
                        >
                          {i}
                        </Button>
                      )
                    }
                    
                    // Son sayfa ve üç nokta
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="dots2" className="px-2 text-muted-foreground">
                            ...
                          </span>
                        )
                      }
                      pages.push(
                        <Button
                          key={totalPages}
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>
                
                {/* Mobil için sayfa bilgisi */}
                <div className="sm:hidden text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </div>
                
                {/* Sonraki Sayfa */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Son Sayfa - Sadece desktop'ta görünür */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || isLoading}
                  className="hidden lg:flex"
                >
                  Son
                </Button>
              </div>
              
              {/* Sayfa Başına Öğe Seçici */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Sayfa başına:</span>
                <span className="text-sm text-muted-foreground sm:hidden">Göster:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ödeme Durumu Değiştir Dialog */}
      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ödeme Durumunu Değiştir</AlertDialogTitle>
            <AlertDialogDescription>Yeni ödeme durumunu seçin.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Select value={paymentDialogValue} onValueChange={(v) => setPaymentDialogValue(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="paid">Ödendi</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
                <SelectItem value="refunded">İade Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={paymentStatusMutation.isPending || !paymentDialogOrderId}
              onClick={() => {
                if (!paymentDialogOrderId) return
                paymentStatusMutation.mutate({ orderId: paymentDialogOrderId, status: paymentDialogValue })
              }}
            >
              Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 