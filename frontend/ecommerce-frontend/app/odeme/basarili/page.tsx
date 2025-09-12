"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Package, Truck, Mail, Phone, Download, ArrowRight, Clock, MapPin, CreditCard, AlertCircle } from "lucide-react"
import { useOrderDetail } from "@/hooks/useOrderDetail"
import { toast } from "sonner"
import { useInvoice } from "@/lib/hooks/useInvoices"
// TODO: Eski send/status/files akışları kaldırılacak; `useInvoice` ve `invoicesApi.downloadPdf` kullanılacak
import { getInvoiceStatusBadgeClass, getInvoiceStatusLabel } from '@/lib/utils/invoiceUi'
import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/utils/constants'

// SearchParams kullanan component'i ayrı bir component olarak çıkar
function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL parametrelerinden sipariş bilgilerini al
  const orderNumber = searchParams.get('orderNumber')
  const orderId = searchParams.get('orderId')
  const totalAmount = searchParams.get('totalAmount')
  const paymentMethod = searchParams.get('paymentMethod')
  const customerType = searchParams.get('customerType')
  
  // Teslimat bilgileri için state'ler
  const [deliveryInfo, setDeliveryInfo] = useState({
    estimatedDelivery: '',
    shippingAddress: {
      firstName: '',
      lastName: '',
      address: '',
      city: '',
      district: '',
      postalCode: ''
    }
  })
  
  const [estimatedDelivery] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 3)
    return date.toLocaleDateString("tr-TR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  })

  // Eğer gerekli parametreler yoksa ana sayfaya yönlendir
  useEffect(() => {
    if (!orderNumber && !orderId) {
      router.push('/')
    }
  }, [orderNumber, orderId, router])

  // OrderId varsa sipariş detaylarını çek
  const { order, loading: orderLoading, error: orderError } = useOrderDetail(orderId || '')

  const { data: invoiceResp } = useInvoice(orderId || '', { refetchIntervalMs: 5000 })
  const status = invoiceResp?.data?.status

  // Fatura hazır mı? (görüntüleme/indirme için)
  const isInvoiceReady = (() => {
    const key = String(status || '').toLowerCase()
    return ['sent', 'approved'].includes(key)
  })()

  // Fatura gönderim tetiklemesi kaldırıldı; status polling ile takip ediliyor

  // Header'dan filename yakala
  const parseFilename = (disposition?: string): string | undefined => {
    if (!disposition) return undefined
    const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition)
    const raw = decodeURIComponent((match?.[1] || match?.[2] || '').trim())
    return raw || undefined
  }

  // PDF/XML'i JSON-base64 ya da BLOB olarak getir
  const fetchInvoiceFile = async (): Promise<{ blob: Blob; filename?: string }> => {
    const path = API_ENDPOINTS.ORDERS.INVOICE_PDF(orderId || '')
    const binaryResp = await apiClient.get(path, { responseType: 'arraybuffer' })
    const contentType: string = binaryResp.headers?.['content-type'] || 'application/pdf'
    const disposition: string | undefined = binaryResp.headers?.['content-disposition']
    const filename = parseFilename(disposition) || `fatura-${orderNumber || orderId}.pdf`
    const blob = new Blob([binaryResp.data as ArrayBuffer], { type: contentType })
    return { blob, filename }
  }
 
  const viewInvoice = async () => {
    if (!orderId) return
    try {
      const { blob } = await fetchInvoiceFile()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (e) {
      toast.error('Fatura henüz hazır değil veya indirilemiyor')
    }
  }

  const downloadInvoice = async () => {
    if (!orderId) return
    try {
      const { blob, filename } = await fetchInvoiceFile()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `fatura-${orderNumber || orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('Fatura henüz hazır değil veya indirilemiyor')
    }
  }

  // Sipariş bilgileri yoksa loading göster
  if (!orderNumber && !orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Sipariş bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    // Confetti animasyonu veya başka kutlama efektleri eklenebilir
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Siparişiniz Alındı!</h1>
            <p className="text-gray-600">
              Teşekkür ederiz! Siparişiniz başarıyla oluşturuldu ve en kısa sürede hazırlanacak.
            </p>
          </div>

          {/* Debug Bilgisi - Sadece Development'ta */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="mb-6 bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-800">Debug Bilgisi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p><strong>Order Number:</strong> {orderNumber || 'Yok'}</p>
                  <p><strong>Order ID:</strong> {orderId || 'Yok'}</p>
                  <p><strong>Total Amount:</strong> {totalAmount || 'Yok'}</p>
                  <p><strong>Payment Method:</strong> {paymentMethod || 'Yok'}</p>
                  <p><strong>Customer Type:</strong> {customerType || 'Yok'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fatura Durumu */}
          {orderId && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Fatura Durumu</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge className={getInvoiceStatusBadgeClass(status)}>
                    {getInvoiceStatusLabel(status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                 <Button asChild variant="outline" size="sm" disabled={!isInvoiceReady}>
                   <Link href={`/fatura/${orderId}`}>Faturayı Görüntüle</Link>
                 </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Sipariş Detayları</span>
                <Badge className="bg-green-100 text-green-800">Beklemede</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Sipariş Numarası</p>
                  <p className="font-bold text-lg">{orderNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sipariş Tarihi</p>
                  <p className="font-medium">
                    {new Date().toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ödeme Yöntemi</p>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span className="font-medium">
                      {paymentMethod === 'credit-card' ? 'Kredi Kartı' : 
                       paymentMethod === 'bank-transfer' ? 'Havale/EFT' : 
                       paymentMethod || 'Kredi Kartı'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Toplam Tutar</p>
                  <p className="font-bold text-lg text-blue-600">
                    ₺{totalAmount ? parseFloat(totalAmount).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Teslimat Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Tahmini Teslimat Tarihi</p>
                  <p className="text-gray-600">{estimatedDelivery}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Teslimat Adresi</p>
                  <p className="text-gray-600">
                    {orderId ? (
                      orderLoading ? (
                        <span>Yükleniyor...</span>
                      ) : orderError ? (
                        <span className="text-red-600">Teslimat adresi yüklenemedi</span>
                      ) : order?.shippingAddress ? (
                        <>
                          {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                          <br />
                          {order.shippingAddress.address}
                          <br />
                          {order.shippingAddress.district}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
                        </>
                      ) : (
                        <span>Teslimat adresi bulunamadı</span>
                      )
                    ) : (
                      <>
                        Ahmet Yılmaz
                        <br />
                        Kadıköy Mahallesi, Bağdat Caddesi No:123
                        <br />
                        Kadıköy, İstanbul 34710
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Fatura Adresi - Eğer teslimat adresi ile farklıysa göster */}
              {orderId && !orderLoading && !orderError && order?.invoiceAddress && 
               JSON.stringify(order.shippingAddress) !== JSON.stringify(order.invoiceAddress) && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Fatura Adresi</p>
                    <p className="text-gray-600">
                      {order.invoiceAddress.firstName} {order.invoiceAddress.lastName}
                      <br />
                      {order.invoiceAddress.address}
                      <br />
                      {order.invoiceAddress.district}, {order.invoiceAddress.city} {order.invoiceAddress.postalCode}
                      {order.invoiceAddress.companyName && (
                        <>
                          <br />
                          <strong>Şirket:</strong> {order.invoiceAddress.companyName}
                        </>
                      )}
                      {order.invoiceAddress.taxNumber && (
                        <>
                          <br />
                          <strong>Vergi No:</strong> {order.invoiceAddress.taxNumber}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sırada Ne Var?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Sipariş Hazırlanıyor</p>
                    <p className="text-sm text-gray-600">Ürünleriniz depomuzda hazırlanıyor</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Kargoya Verildi</p>
                    <p className="text-sm text-gray-600">Kargo takip numaranız SMS ile gönderilecek</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Teslim Edildi</p>
                    <p className="text-sm text-gray-600">Siparişiniz adresinize teslim edilecek</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Actions */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">İletişim</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">info@acikatolye.com.tr</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">+90 530 607 0166</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Faydalı Linkler</h3>
                <div className="space-y-2">
                  <Link href="/siparislerim" className="flex items-center text-sm text-blue-600 hover:underline">
                    <Package className="h-4 w-4 mr-2" />
                    Siparişlerimi Görüntüle
                  </Link>
                  {orderId && (
                    <Link href={`/siparislerim/${orderId}`} className="flex items-center text-sm text-blue-600 hover:underline">
                      <Package className="h-4 w-4 mr-2" />
                      Bu Siparişin Detayları
                    </Link>
                  )}
                  <button
                    onClick={downloadInvoice}
                    disabled={!isInvoiceReady}
                    title={isInvoiceReady ? 'Faturayı indir' : 'Fatura henüz hazır değil'}
                    className={`flex items-center text-sm ${isInvoiceReady ? 'text-blue-600 hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Faturayı İndir
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="flex-1" size="lg">
              <Link href="/">
                Ana Sayfaya Dön
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 bg-transparent" size="lg">
              <Link href="/urunler">Alışverişe Devam Et</Link>
            </Button>
          </div>

          {/* Email Confirmation Notice */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">E-posta Onayı</p>
                <p className="text-sm text-blue-700">
                  Sipariş detaylarınız e-posta adresinize gönderildi. Spam klasörünüzü de kontrol etmeyi unutmayın.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component
function OrderSuccessLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Sipariş bilgileri yükleniyor...</p>
      </div>
    </div>
  )
}

// Ana component - Suspense ile sarılmış
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<OrderSuccessLoading />}>
      <OrderSuccessContent />
    </Suspense>
  )
}
