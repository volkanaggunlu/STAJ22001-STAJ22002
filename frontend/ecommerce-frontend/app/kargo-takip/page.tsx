"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Truck,
  Package,
  Search,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react'
import { useShippingTracking } from '@/hooks/useShipping'

// Kargo şirketleri
const carriers = [
  { code: 'aras', name: 'Aras Kargo' },
  { code: 'mng', name: 'MNG Kargo' },
  { code: 'yurtici', name: 'Yurtiçi Kargo' },
  { code: 'ptt', name: 'PTT Kargo' },
  { code: 'ups', name: 'UPS' },
  { code: 'dhl', name: 'DHL' }
]

// Kargo durumları
const shippingStatuses = [
  { value: 'pending', label: 'Hazırlanıyor', color: 'bg-gray-100 text-gray-800' },
  { value: 'created', label: 'Kargo Oluşturuldu', color: 'bg-blue-100 text-blue-800' },
  { value: 'picked_up', label: 'Kargoya Verildi', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_transit', label: 'Yolda', color: 'bg-orange-100 text-orange-800' },
  { value: 'delivered', label: 'Teslim Edildi', color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Teslimat Başarısız', color: 'bg-red-100 text-red-800' }
]

export default function KargoTakipPage() {
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [isSearched, setIsSearched] = useState(false)

  // Tracking query (only enabled when search is performed)
  const { 
    data: trackingData, 
    isLoading: trackingLoading,
    error: trackingError,
    refetch: refetchTracking 
  } = useShippingTracking(
    carrier,
    trackingNumber,
    isSearched && !!carrier && !!trackingNumber
  )

  const handleSearch = () => {
    if (!carrier || !trackingNumber) {
      return
    }
    setIsSearched(true)
  }

  const handleReset = () => {
    setCarrier('')
    setTrackingNumber('')
    setIsSearched(false)
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = shippingStatuses.find(s => s.value === status)
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || status}
      </Badge>
    )
  }

  const getCarrierName = (carrierCode: string) => {
    return carriers.find(c => c.code === carrierCode)?.name || carrierCode
  }

  const copyTrackingNumber = () => {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber)
    }
  }

  const openCarrierWebsite = () => {
    if (carrier && trackingNumber) {
      const url = `https://www.google.com/search?q=${carrier}+kargo+takip+${trackingNumber}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Truck className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Kargo Takip</h1>
          </div>
          <p className="text-muted-foreground">
            Takip numaranızla kargonuzun durumunu öğrenin
          </p>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Kargo Sorgula
            </CardTitle>
            <CardDescription>
              Kargo şirketinizi seçin ve takip numaranızı girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="carrier">Kargo Şirketi</Label>
                  <Select value={carrier} onValueChange={setCarrier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kargo şirketi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {carriers.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="trackingNumber">Takip Numarası</Label>
                  <Input
                    id="trackingNumber"
                    placeholder="Takip numaranızı girin"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleSearch} 
                  disabled={!carrier || !trackingNumber || trackingLoading}
                  className="flex-1"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {trackingLoading ? 'Sorgulanıyor...' : 'Kargo Takip Et'}
                </Button>
                
                {isSearched && (
                  <Button variant="outline" onClick={handleReset}>
                    Temizle
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {isSearched && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Takip Sonuçları
                </CardTitle>
                {trackingData && (
                  <Button size="sm" variant="outline" onClick={() => refetchTracking()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Yenile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {trackingLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Takip bilgileri sorgulanıyor...</p>
                </div>
              ) : trackingError ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Takip bilgileri alınamadı. Lütfen takip numaranızı ve kargo şirketini kontrol edin.
                  </AlertDescription>
                </Alert>
              ) : trackingData ? (
                <div className="space-y-6">
                  {/* Özet Bilgiler */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <span className="text-sm font-medium">Takip No:</span>
                        <span className="font-mono text-sm">{trackingNumber}</span>
                        <Button size="sm" variant="ghost" onClick={copyTrackingNumber}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium mb-2">Kargo Şirketi</div>
                      <div className="text-sm">{getCarrierName(carrier)}</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium mb-2">Durum</div>
                      {getStatusBadge(trackingData.status)}
                    </div>
                  </div>

                  <Separator />

                  {/* Detaylı Bilgiler */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Teslimat Bilgileri</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Son Güncelleme:</span>{' '}
                          {new Date(trackingData.lastUpdate).toLocaleString('tr-TR')}
                        </div>
                        {trackingData.estimatedDelivery && (
                          <div>
                            <span className="font-medium">Tahmini Teslimat:</span>{' '}
                            {new Date(trackingData.estimatedDelivery).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Button variant="outline" onClick={openCarrierWebsite}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Kargo Sitesinde Takip Et
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Kargo Geçmişi */}
                  <div>
                    <h4 className="font-medium mb-4">Kargo Geçmişi</h4>
                    <div className="space-y-3">
                      {trackingData.events?.map((event: any, index: number) => (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
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
                            <div className="flex items-center justify-between">
                              <p className="font-medium">
                                {shippingStatuses.find(s => s.value === event.status)?.label || event.status}
                              </p>
                              <span className="text-xs text-gray-500">
                                {new Date(event.date).toLocaleString('tr-TR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </p>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    Takip bilgisi bulunamadı. Lütfen bilgilerinizi kontrol edin.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Yardım */}
        <Card>
          <CardHeader>
            <CardTitle>Kargo Takip Hakkında</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                • Takip numaranızı sipariş teyid mailinizde veya hesabınızdaki sipariş detayında bulabilirsiniz.
              </p>
              <p>
                • Kargo bilgileri gerçek zamanlı güncellenmeyebilir, lütfen birkaç saat sonra tekrar kontrol edin.
              </p>
              <p>
                • Sorun yaşıyorsanız müşteri hizmetlerimizle iletişime geçebilirsiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 