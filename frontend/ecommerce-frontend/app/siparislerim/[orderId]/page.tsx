'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Package, 
  Calendar, 
  DollarSign, 
  Truck, 
  MapPin, 
  CreditCard, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Building,
  Download
} from "lucide-react"
import { useOrderDetail } from '@/hooks/useOrderDetail'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CustomerShippingTracker } from './components/CustomerShippingTracker'
import { useInvoice } from '@/lib/hooks/useInvoices'
import invoicesApi from '@/lib/api/services/invoices'
import { toast } from 'sonner'
import { getInvoiceStatusBadgeClass, getInvoiceStatusLabel } from '@/lib/utils/invoiceUi'

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'paid': return 'bg-blue-100 text-blue-800'
    case 'shipped': return 'bg-purple-100 text-purple-800'
    case 'delivered': return 'bg-green-100 text-green-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="h-4 w-4" />
    case 'paid': return <CheckCircle className="h-4 w-4" />
    case 'shipped': return <Truck className="h-4 w-4" />
    case 'delivered': return <Package className="h-4 w-4" />
    case 'cancelled': return <AlertCircle className="h-4 w-4" />
    default: return <Package className="h-4 w-4" />
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'Beklemede'
    case 'paid': return 'Ödendi'
    case 'shipped': return 'Kargoda'
    case 'delivered': return 'Teslim Edildi'
    case 'cancelled': return 'İptal Edildi'
    default: return status
  }
}

// Güvenli string dönüşümü için yardımcı fonksiyon
const safeString = (value: any, fieldName?: string): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'object') {
    // Belirli alanlar için özel işlemler
    if (fieldName === 'paymentMethod' && value.name) {
      return value.name
    }
    if (fieldName === 'shippingType' && value.name) {
      return value.name
    }
    if (fieldName === 'status' && value.status) {
      return value.status
    }
    if (fieldName === 'customerType' && value.type) {
      return value.type
    }
    
    // Diğer objeler için sadece debug log
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [DEBUG] Object field "${fieldName}":`, value)
    }
    return ''
  }
  return String(value)
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.orderId as string

  const { order, loading, error } = useOrderDetail(orderId)
  const { data: invoiceResp } = useInvoice(orderId, { refetchIntervalMs: 10000 })
  const invoiceStatus = invoiceResp?.data?.status
  const invoicePdfPath = invoiceResp?.data?.pdfPath as string | undefined

  async function handleDownload() {
    try {
      if (invoicePdfPath && typeof invoicePdfPath === 'string') {
        // Mutlak veya göreli yol olabilir; tarayıcı indirimi tetikle
        const a = document.createElement('a')
        a.href = invoicePdfPath.startsWith('http') ? invoicePdfPath : `${API_URL?.replace(/\/$/, '')}/${invoicePdfPath.replace(/^\//, '')}`
        a.download = `invoice-${orderId}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        return
      }
      toast.info('Fatura PDF dosyanız henüz hazırlanmadı')
    } catch (e: any) {
      toast.error('Dosya indirilemedi')
    }
  }

  // Debug için order verisini logla
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && order) {
      console.log('📋 [DEBUG] Sipariş detayı:', order)
    }
  }, [order])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 p-4 bg-red-50 text-red-700 rounded">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <div className="mt-4">
            <Link href="/siparislerim">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Siparişlerime Dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş bulunamadı</h3>
            <p className="text-gray-600 mb-4">Aradığınız sipariş mevcut değil veya erişim izniniz yok</p>
            <Link href="/siparislerim">
              <Button>Siparişlerime Dön</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/siparislerim">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sipariş Detayı</h1>
              <p className="text-gray-600 mt-1">Sipariş #{safeString(order.orderNumber, 'orderNumber')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(safeString(order.status, 'status'))}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(safeString(order.status, 'status'))}
                <span>{getStatusText(safeString(order.status, 'status'))}</span>
              </div>
            </Badge>
            {invoiceStatus && (
              <Badge className={getInvoiceStatusBadgeClass(invoiceStatus)}>
                e-Fatura: {getInvoiceStatusLabel(invoiceStatus)}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ana İçerik */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sipariş Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Sipariş Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sipariş Numarası</label>
                    <p className="text-gray-900 font-mono">{safeString(order.orderNumber, 'orderNumber')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sipariş Tarihi</label>
                    <p className="text-gray-900">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Tarih bilgisi yok'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Müşteri Tipi</label>
                    <p className="text-gray-900 flex items-center">
                      {safeString(order.customerType, 'customerType') === 'firma' ? (
                        <>
                          <Building className="h-4 w-4 mr-1" />
                          Firma
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 mr-1" />
                          Bireysel
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ödeme Yöntemi</label>
                    <p className="text-gray-900 flex items-center">
                      <CreditCard className="h-4 w-4 mr-1" />
                      {safeString(order.paymentMethod, 'paymentMethod')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ürün Listesi */}
            <Card>
              <CardHeader>
                <CardTitle>Ürünler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{safeString(item.productName, 'productName')}</h4>
                        <p className="text-sm text-gray-600">Adet: {item.quantity || 0}</p>
                        {item.bundledProducts && item.bundledProducts.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Paket İçeriği:</p>
                            <ul className="text-xs text-gray-600 ml-2">
                              {item.bundledProducts.map((bundled: any, idx: number) => (
                                <li key={idx}>• {safeString(bundled.productName, 'bundledProductName')} (x{bundled.quantity || 0})</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₺{(item.price || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">₺{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Adres Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Teslimat Adresi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{safeString(order.shippingAddress?.firstName, 'firstName')} {safeString(order.shippingAddress?.lastName, 'lastName')}</p>
                    <p className="text-gray-600">{safeString(order.shippingAddress?.address, 'address')}</p>
                    <p className="text-gray-600">{safeString(order.shippingAddress?.district, 'district')}, {safeString(order.shippingAddress?.city, 'city')}</p>
                    <p className="text-gray-600">{safeString(order.shippingAddress?.postalCode, 'postalCode')}</p>
                    <p className="text-gray-600">{safeString(order.shippingAddress?.phone, 'phone')}</p>
                  </div>
                </CardContent>
              </Card>

              {order.invoiceAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Fatura Adresi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{safeString(order.invoiceAddress?.firstName, 'firstName')} {safeString(order.invoiceAddress?.lastName, 'lastName')}</p>
                      {order.invoiceAddress?.companyName && (
                        <p className="text-gray-600">{safeString(order.invoiceAddress.companyName, 'companyName')}</p>
                      )}
                      {order.invoiceAddress?.taxNumber && (
                        <p className="text-gray-600">Vergi No: {safeString(order.invoiceAddress.taxNumber, 'taxNumber')}</p>
                      )}
                      <p className="text-gray-600">{safeString(order.invoiceAddress?.address, 'address')}</p>
                      <p className="text-gray-600">{safeString(order.invoiceAddress?.district, 'district')}, {safeString(order.invoiceAddress?.city, 'city')}</p>
                      <p className="text-gray-600">{safeString(order.invoiceAddress?.postalCode, 'postalCode')}</p>
                      <p className="text-gray-600">{safeString(order.invoiceAddress?.phone, 'phone')}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Yan Panel - Özet */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fiyat Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Ara Toplam</span>
                  <span>₺{(order.subtotal || 0).toFixed(2)}</span>
                </div>
                
                {order.shippingCost !== undefined && (
                  <div className="flex justify-between">
                    <span>Kargo</span>
                    <span>{order.shippingCost === 0 ? "Ücretsiz" : `₺${(order.shippingCost || 0).toFixed(2)}`}</span>
                  </div>
                )}
                {/*
                {order.couponDiscount !== undefined && (
                  <div className="flex justify-between">
                    <span>Kupon İndirimi</span>
                    <span className={order.couponDiscount > 0 ? "text-green-600" : "text-gray-500"}>
                      {order.couponDiscount > 0 ? `-₺${(order.couponDiscount || 0).toFixed(2)}` : "Uygulanmadı"}
                    </span>
                  </div>
                )}
                */}
                
                {order.campaignDiscount !== undefined && (
                  <div className="flex justify-between">
                    <span>Kampanya İndirimi</span>
                    <span className={order.campaignDiscount > 0 ? "text-green-600" : "text-gray-500"}>
                      {order.campaignDiscount > 0 ? `-₺${(order.campaignDiscount || 0).toFixed(2)}` : "İndirim Yok"}
                    </span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>Toplam</span>
                  <span>₺{(order.totalAmount || 0).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Sipariş Notları */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Sipariş Notu</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{safeString(order.notes, 'notes')}</p>
                </CardContent>
              </Card>
            )}

            {/* Fatura İşlemleri */}
            <Card>
              <CardHeader>
                <CardTitle>Fatura</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getInvoiceStatusBadgeClass(invoiceStatus)}>
                    {getInvoiceStatusLabel(invoiceStatus)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" /> PDF İndir
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Kargo Bilgileri */}
            <CustomerShippingTracker 
              orderId={orderId} 
              shippingData={order?.tracking}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 