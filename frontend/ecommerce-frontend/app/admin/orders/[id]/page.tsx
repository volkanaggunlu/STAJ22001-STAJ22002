'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
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
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Building,
  CreditCard as CreditCardIcon,
  Truck as TruckIcon,
  FileText as FileTextIcon
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatPrice } from '@/lib/utils/format'
import { adminApi } from '@/lib/api/services/admin'
import { toast } from 'sonner'
import { ShippingManagement } from './components/ShippingManagement'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const orderId = params.id as string

  // State for status update
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')

  // State for tracking update
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')

  // API Calls
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['admin', 'order', orderId],
    queryFn: async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Sipariş detayı çekiliyor:', orderId)
      }
      
      const response = await adminApi.getOrderDetails(orderId)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Sipariş detayı response:', response)
        console.log('📊 Response type:', typeof response)
        console.log('📊 Response keys:', response ? Object.keys(response) : 'No response')
        console.log('🚛 Tracking field:', response?.tracking)
      }
      
      return response
    },
    enabled: !!orderId,
    staleTime: 30000,
    retry: 2
  })

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, note }: { orderId: string, status: string, note?: string }) =>
      adminApi.updateOrderStatus(orderId, status, note),
    onSuccess: () => {
      toast.success('Sipariş durumu güncellendi')
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      setIsStatusModalOpen(false)
      setNewStatus('')
      setStatusNote('')
    },
    onError: (error) => {
      toast.error('Sipariş durumu güncellenirken hata oluştu')
      console.error('Status update error:', error)
    }
  })

  // Tracking update mutation
  const updateTrackingMutation = useMutation({
    mutationFn: ({ orderId, trackingNumber, carrier }: { orderId: string, trackingNumber: string, carrier: string }) =>
      adminApi.updateOrderTracking(orderId, trackingNumber, carrier),
    onSuccess: () => {
      toast.success('Kargo takip numarası eklendi')
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      setIsTrackingModalOpen(false)
      setTrackingNumber('')
      setCarrier('')
    },
    onError: (error) => {
      toast.error('Kargo takip numarası eklenirken hata oluştu')
      console.error('Tracking update error:', error)
    }
  })

  // Handlers
  const handleStatusUpdate = () => {
    if (!newStatus) {
      toast.error('Lütfen bir durum seçin')
      return
    }
    updateStatusMutation.mutate({ orderId, status: newStatus, note: statusNote })
  }

  const handleTrackingUpdate = () => {
    if (!trackingNumber || !carrier) {
      toast.error('Lütfen takip numarası ve kargo şirketi girin')
      return
    }
    updateTrackingMutation.mutate({ orderId, trackingNumber, carrier })
  }

  const handleCopyOrderNumber = () => {
    if (order?.orderNumber) {
      navigator.clipboard.writeText(order.orderNumber)
      toast.success('Sipariş numarası kopyalandı')
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      const blob = await adminApi.downloadOrderInvoice(orderId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fatura_${order?.orderNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Fatura indirildi')
    } catch (error) {
      toast.error('Fatura indirilirken hata oluştu')
      console.error('Invoice download error:', error)
    }
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
      'credit-card': { label: 'Kredi Kartı', icon: CreditCardIcon },
      'bank-transfer': { label: 'Banka Transferi', icon: CreditCardIcon },
      'cash-on-delivery': { label: 'Kapıda Ödeme', icon: CreditCardIcon }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sipariş Yüklenirken Hata</h3>
              <p className="text-muted-foreground mb-4">
                Sipariş detayları yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sipariş Bulunamadı</h3>
              <p className="text-muted-foreground mb-4">
                Aradığınız sipariş bulunamadı veya silinmiş olabilir.
              </p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri Dön
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
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Sipariş #{order.orderNumber}</h1>
            <p className="text-muted-foreground">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusBadge(order.status)}
          <Button variant="outline" onClick={() => setIsStatusModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Durumu Güncelle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Sipariş Ürünleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 border rounded">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name || "Ürün"}
                        width={60}
                        height={60}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-[60px] h-[60px] bg-gray-200 rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.type && (
                          <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-md">
                            {item.type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatPrice(item.price)}</div>
                      <div className="text-sm text-muted-foreground">
                        Adet: {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Sipariş Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kargo</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>
                {/*
                {order.coupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Kupon İndirimi</span>
                    <span>-{formatPrice(order.coupon.discount)}</span>
                  </div>
                )}
                */}
                {order.campaign && (
                  <div className="flex justify-between text-green-600">
                    <span>Kampanya İndirimi</span>
                    <span>-{formatPrice(order.campaign?.discountAmount ?? 0)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Toplam</span>
                    <span>{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Teslimat Adresi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.district}, {order.shippingAddress.city}</p>
                  <p>Posta Kodu : {order.shippingAddress.postalCode}</p>
                  <p className="flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {order.shippingAddress.phone}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Fatura Adresi - Backend'den gelen invoiceAddress alanını kullan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Fatura Adresi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(order as any).invoiceAddress ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{(order as any).invoiceAddress.firstName} {(order as any).invoiceAddress.lastName}</p>
                    <p>{(order as any).invoiceAddress.address}</p>
                    <p>{(order as any).invoiceAddress.district}, {(order as any).invoiceAddress.city}</p>
                    <p>Posta Kodu : {(order as any).invoiceAddress.postalCode}</p>
                    <p className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {(order as any).invoiceAddress.phone}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Fatura adresi belirtilmemiş</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Teslimat adresi fatura adresi olarak kullanılıyor
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Shipping Management */}
          <ShippingManagement 
            orderId={order._id}
            currentShipping={order.tracking}
            onShippingUpdate={(shipping) => {
              // Shipping güncellendikten sonra order'ı yeniden fetch et
              queryClient.invalidateQueries({ queryKey: ['admin', 'order', orderId] })
              // Admin orders listesini de güncelle
              queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Ad Soyad</label>
                  <p>{order.userId.firstName} {order.userId.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {order.userId.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Ödeme Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Ödeme Yöntemi</label>
                  <div className="mt-1">
                    {getPaymentMethodBadge(order.payment?.method || (order as any).paymentMethod)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Ödeme Durumu</label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {order.payment?.status || 'pending'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleCopyOrderNumber}>
                  <Copy className="h-4 w-4 mr-2" />
                  Sipariş Numarasını Kopyala
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleDownloadInvoice}>
                  <FileText className="h-4 w-4 mr-2" />
                  Fatura İndir
                </Button>
                
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sipariş Durumu Güncelle</DialogTitle>
            <DialogDescription>
              Sipariş #{order.orderNumber} durumunu güncelleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Yeni Durum</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
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
              <label className="text-sm font-medium">Not (İsteğe bağlı)</label>
              <Textarea
                placeholder="Durum değişikliği hakkında not ekleyin..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleStatusUpdate} disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending ? 'Güncelleniyor...' : 'Güncelle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tracking Update Modal */}
      <Dialog open={isTrackingModalOpen} onOpenChange={setIsTrackingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kargo Takip Bilgisi Ekle</DialogTitle>
            <DialogDescription>
              Sipariş #{order.orderNumber} için kargo takip bilgilerini ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Takip Numarası</label>
              <Input
                placeholder="Takip numarasını girin"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Kargo Şirketi</label>
              <Input
                placeholder="Kargo şirketini girin"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsTrackingModalOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleTrackingUpdate} disabled={updateTrackingMutation.isPending}>
                {updateTrackingMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 