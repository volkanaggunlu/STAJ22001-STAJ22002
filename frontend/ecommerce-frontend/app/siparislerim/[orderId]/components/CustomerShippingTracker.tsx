"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  ExternalLink,
  RefreshCw,
  Copy
} from 'lucide-react'
import { 
  useShippingTracking,
  type ShippingData
} from '@/hooks/useShipping'

interface CustomerShippingTrackerProps {
  orderId: string
  shippingData?: ShippingData
}

// Kargo durumları (müşteri dostu)
const shippingStatuses = [
  { value: 'pending', label: 'Hazırlanıyor', color: 'bg-gray-100 text-gray-800', description: 'Siparişiniz kargo için hazırlanıyor' },
  { value: 'created', label: 'Kargo Oluşturuldu', color: 'bg-blue-100 text-blue-800', description: 'Kargo siparişi oluşturuldu' },
  { value: 'picked_up', label: 'Kargoya Verildi', color: 'bg-yellow-100 text-yellow-800', description: 'Paketiniz kargo şirketine teslim edildi' },
  { value: 'in_transit', label: 'Yolda', color: 'bg-orange-100 text-orange-800', description: 'Paketiniz size doğru yolda' },
  { value: 'delivered', label: 'Teslim Edildi', color: 'bg-green-100 text-green-800', description: 'Paketiniz başarıyla teslim edildi' },
  { value: 'failed', label: 'Teslimat Başarısız', color: 'bg-red-100 text-red-800', description: 'Teslimat başarısız, tekrar denenecek' }
]

// Kargo şirketleri
const carriers = [
  { code: 'aras', name: 'Aras Kargo' },
  { code: 'mng', name: 'MNG Kargo' },
  { code: 'yurtici', name: 'Yurtiçi Kargo' },
  { code: 'ptt', name: 'PTT Kargo' },
  { code: 'ups', name: 'UPS' },
  { code: 'dhl', name: 'DHL' }
]

export const CustomerShippingTracker = ({ 
  orderId, 
  shippingData 
}: CustomerShippingTrackerProps) => {
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false)

  // DEBUG: Gelen veriyi logla
  console.log('🚛 [CustomerShippingTracker] Gelen shippingData:', shippingData)
  console.log('🚛 [CustomerShippingTracker] OrderId:', orderId)

  // Kargo var mı kontrolü
  const hasShipping = shippingData?.trackingNumber

  // Tracking query (only enabled when we have tracking info and modal is open)
  const { 
    data: trackingData, 
    isLoading: trackingLoading,
    refetch: refetchTracking 
  } = useShippingTracking(
    shippingData?.carrier || '',
    shippingData?.trackingNumber || '',
    isTrackingModalOpen && !!shippingData?.carrier && !!shippingData?.trackingNumber
  )

  // Kargo takip bilgilerini getirme
  const handleTrackShipping = () => {
    if (!shippingData?.trackingNumber || !shippingData?.carrier) {
      return
    }
    setIsTrackingModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = shippingStatuses.find(s => s.value === status)
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || status}
      </Badge>
    )
  }

  const getStatusDescription = (status: string) => {
    const statusInfo = shippingStatuses.find(s => s.value === status)
    return statusInfo?.description || ''
  }

  const getCarrierName = (carrierCode: string) => {
    return carriers.find(c => c.code === carrierCode)?.name || carrierCode
  }

  const copyTrackingNumber = () => {
    if (shippingData?.trackingNumber) {
      navigator.clipboard.writeText(shippingData.trackingNumber)
      // Toast notification olabilir burada
    }
  }

  const openCarrierWebsite = () => {
    if (shippingData?.carrier && shippingData?.trackingNumber) {
      const url = `https://www.google.com/search?q=${shippingData.carrier}+kargo+takip+${shippingData.trackingNumber}`
      window.open(url, '_blank')
    }
  }

  if (!hasShipping) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <CardTitle>Kargo Bilgileri</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              Siparişiniz henüz kargoya verilmemiş. Kargoya verildiğinde buradan takip edebileceksiniz.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <CardTitle>Kargo Takip</CardTitle>
        </div>
        <CardDescription>
          Paketinizin teslim durumunu takip edebilirsiniz
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Kargo Özet Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Takip Numarası</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-semibold">
                    {shippingData.trackingNumber}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyTrackingNumber}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kargo Şirketi</span>
                <span className="text-sm">{getCarrierName(shippingData.carrier || '')}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Durum</span>
                {getStatusBadge(shippingData.status || 'pending')}
              </div>
            </div>

            <div className="space-y-3">
              {shippingData.estimatedDelivery && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tahmini Teslimat</span>
                  <span className="text-sm">
                    {new Date(shippingData.estimatedDelivery).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}

              {shippingData.weight && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ağırlık</span>
                  <span className="text-sm">{shippingData.weight} kg</span>
                </div>
              )}
            </div>
          </div>

          {/* Durum Açıklaması */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {getStatusDescription(shippingData.status || 'pending')}
                </p>
                {shippingData.status === 'delivered' && (
                  <p className="text-xs text-blue-700 mt-1">
                    Paketinizi teslim aldığınızda lütfen kontrol ediniz.
                  </p>
                )}
                {shippingData.status === 'in_transit' && (
                  <p className="text-xs text-blue-700 mt-1">
                    Tahmini teslimat süresini yukarıda görebilirsiniz.
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Aksiyon Butonları */}
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleTrackShipping}
              disabled={trackingLoading}
            >
              <Eye className="h-4 w-4 mr-2" />
              {trackingLoading ? 'Yükleniyor...' : 'Detaylı Takip'}
            </Button>

            <Button 
              size="sm" 
              variant="outline"
              onClick={openCarrierWebsite}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Kargo Sitesinde Takip Et
            </Button>
          </div>
        </div>

        {/* Detaylı Takip Modal */}
        <Dialog open={isTrackingModalOpen} onOpenChange={setIsTrackingModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detaylı Kargo Takip</DialogTitle>
              <DialogDescription>
                Takip Numarası: {shippingData?.trackingNumber}
              </DialogDescription>
            </DialogHeader>
            
            {trackingLoading ? (
              <div className="text-center py-6">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Takip bilgileri yükleniyor...</p>
              </div>
            ) : trackingData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Durum</span>
                    <div className="mt-1">{getStatusBadge(trackingData.status)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Son Güncelleme</span>
                    <p className="text-sm mt-1">
                      {new Date(trackingData.lastUpdate).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>

                {trackingData.estimatedDelivery && (
                  <div>
                    <span className="text-sm font-medium">Tahmini Teslimat</span>
                    <p className="text-sm mt-1">
                      {new Date(trackingData.estimatedDelivery).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Kargo Geçmişi</span>
                    <Button size="sm" variant="outline" onClick={() => refetchTracking()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Yenile
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {trackingData.events?.map((event: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="mt-1">
                          {event.status === 'delivered' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : event.status === 'failed' ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {shippingStatuses.find(s => s.value === event.status)?.label || event.status}
                          </p>
                          <p className="text-xs text-gray-600">{event.location}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleString('tr-TR')}
                          </p>
                          {event.description && (
                            <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p>Takip bilgileri alınamadı</p>
                <Button size="sm" variant="outline" onClick={() => refetchTracking()} className="mt-2">
                  Tekrar Dene
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
} 