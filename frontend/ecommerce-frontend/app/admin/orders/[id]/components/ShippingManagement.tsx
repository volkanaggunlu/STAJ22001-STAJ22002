"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Truck,
  Package,
  Download,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  Eye,
  ExternalLink,
  RefreshCw,
  Copy
} from 'lucide-react'
import { 
  useCarriers,
  useCreateShipment,
  useShippingTracking,
  useDownloadShippingLabel,
  type CarrierInfo
} from '@/hooks/useShipping'

interface ShippingData {
  trackingNumber?: string
  carrier?: string
  service?: string
  status?: string
  estimatedDelivery?: string
  actualDelivery?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  insuranceValue?: number
  shippingCost?: number
  labelUrl?: string
  specialInstructions?: string
  createdAt?: string
  updatedAt?: string
}

interface ShippingManagementProps {
  orderId: string
  currentShipping?: ShippingData
  onShippingUpdate?: (shipping: ShippingData) => void
}

// Kargo şirketleri (geçici static data)
const staticCarriers = [
  { code: 'aras', name: 'Aras Kargo', isActive: true },
  { code: 'mng', name: 'MNG Kargo', isActive: true },
  { code: 'yurtici', name: 'Yurtiçi Kargo', isActive: true },
  { code: 'ptt', name: 'PTT Kargo', isActive: true },
  { code: 'ups', name: 'UPS', isActive: true },
  { code: 'dhl', name: 'DHL', isActive: true }
]

// Servis tipleri
const serviceTypes = [
  { value: 'standard', label: 'Standart Teslimat' },
  { value: 'express', label: 'Hızlı Teslimat' },
  { value: 'nextday', label: 'Ertesi Gün Teslimat' }
]

// Kargo durumları
const shippingStatuses = [
  { value: 'pending', label: 'Bekliyor', color: 'bg-gray-100 text-gray-800' },
  { value: 'created', label: 'Oluşturuldu', color: 'bg-blue-100 text-blue-800' },
  { value: 'picked_up', label: 'Alındı', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'in_transit', label: 'Yolda', color: 'bg-orange-100 text-orange-800' },
  { value: 'delivered', label: 'Teslim Edildi', color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Başarısız', color: 'bg-red-100 text-red-800' }
]

export const ShippingManagement = ({ 
  orderId, 
  currentShipping,
  onShippingUpdate 
}: ShippingManagementProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    carrier: '',
    service: 'standard',
    weight: '',
    length: '',
    width: '',
    height: '',
    insuranceValue: '',
    specialInstructions: ''
  })

  // Hooks
  const { data: carrierData = [], isLoading: carriersLoading, isError: carriersError } = useCarriers()
  const createShipmentMutation = useCreateShipment()
  const downloadLabelMutation = useDownloadShippingLabel()
  
  // Fallback için carriers belirleme
  const carriers = carrierData.length > 0 ? carrierData : staticCarriers
  
  // Kargo durumu kontrolü
  const hasShipping = currentShipping?.trackingNumber
  
  // Debug logging
  console.log('🚛 ShippingManagement Debug:', {
    currentShipping,
    hasShipping,
    trackingNumber: currentShipping?.trackingNumber,
    carrier: currentShipping?.carrier
  })
  
  // TEST: Mock data ile test edelim
  const mockShipping = {
    trackingNumber: 'TR123456789',
    carrier: 'aras',
    service: 'standard',
    status: 'in_transit',
    weight: 1.5,
    shippingCost: 25,
    estimatedDelivery: '2025-02-01T00:00:00Z',
    createdAt: '2025-01-30T10:00:00Z'
  }
  
  // Test modunda mock data kullan
  const testShipping = process.env.NODE_ENV === 'development' && !currentShipping?.trackingNumber 
    ? mockShipping 
    : currentShipping
  const testHasShipping = testShipping?.trackingNumber

  // Tracking query (only enabled when we have tracking info and modal is open)
  const { 
    data: trackingData, 
    isLoading: trackingLoading,
    refetch: refetchTracking 
  } = useShippingTracking(
    testShipping?.carrier || '',
    testShipping?.trackingNumber || '',
    isViewModalOpen && !!testShipping?.carrier && !!testShipping?.trackingNumber
  )

  // Form temizleme
  const resetForm = () => {
    setFormData({
      carrier: '',
      service: 'standard',
      weight: '',
      length: '',
      width: '',
      height: '',
      insuranceValue: '',
      specialInstructions: ''
    })
  }

  // Kargo siparişi oluşturma
  const handleCreateShipping = async () => {
    if (!formData.carrier || !formData.weight) {
      // toast.error will be handled by the hook
      return
    }

    createShipmentMutation.mutate(
      {
        orderId,
        data: {
          carrier: formData.carrier,
          service: formData.service,
          weight: parseFloat(formData.weight),
          dimensions: {
            length: parseFloat(formData.length) || 0,
            width: parseFloat(formData.width) || 0,
            height: parseFloat(formData.height) || 0
          },
          insuranceValue: parseFloat(formData.insuranceValue) || 0,
          specialInstructions: formData.specialInstructions
        }
      },
      {
        onSuccess: (data) => {
          console.log('🚛 Kargo oluşturma başarılı:', data)
          setIsCreateModalOpen(false)
          resetForm()
          console.log('🚛 onShippingUpdate çağrılıyor...')
          onShippingUpdate?.(data)
        }
      }
    )
  }

  // Kargo takip bilgilerini getirme
  const handleTrackShipping = async () => {
    if (!testShipping?.trackingNumber || !testShipping?.carrier) {
      return
    }

    setIsViewModalOpen(true)
    // useShippingTracking hook automatically fetches when modal opens
  }

  // Kargo etiketi indirme
  const handleDownloadLabel = async () => {
    if (!testShipping?.trackingNumber || !testShipping?.carrier) {
      return
    }

    // API çağrısı (mock veya gerçek)
    downloadLabelMutation.mutate({
      carrier: testShipping.carrier,
      trackingNumber: testShipping.trackingNumber
    })
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = shippingStatuses.find(s => s.value === status)
    return (
      <Badge className={statusInfo?.color || 'bg-gray-100 text-gray-800'}>
        {statusInfo?.label || status}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <CardTitle>Kargo Yönetimi</CardTitle>
          </div>
          {!testHasShipping && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Kargo Oluştur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Yeni Kargo Siparişi</DialogTitle>
                  <DialogDescription>
                    Sipariş için kargo bilgilerini girin ve kargo siparişi oluşturun
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="carrier">Kargo Şirketi *</Label>
                      <Select 
                        value={formData.carrier} 
                        onValueChange={(value) => 
                          setFormData(prev => ({ ...prev, carrier: value }))
                        }
                        disabled={carriersLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={carriersLoading ? "Yükleniyor..." : "Kargo şirketi seçin"} />
                        </SelectTrigger>
                        <SelectContent>
                          {carriers.filter(c => c.isActive).map(carrier => (
                            <SelectItem key={carrier.code} value={carrier.code}>
                              {carrier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="service">Servis Tipi</Label>
                      <Select value={formData.service} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, service: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map(service => (
                            <SelectItem key={service.value} value={service.value}>
                              {service.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="weight">Ağırlık (kg) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        placeholder="1.5"
                        value={formData.weight}
                        onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="length">Uzunluk (cm)</Label>
                      <Input
                        id="length"
                        type="number"
                        placeholder="30"
                        value={formData.length}
                        onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="width">Genişlik (cm)</Label>
                      <Input
                        id="width"
                        type="number"
                        placeholder="20"
                        value={formData.width}
                        onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Yükseklik (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder="10"
                        value={formData.height}
                        onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="insurance">Sigorta Değeri (₺)</Label>
                    <Input
                      id="insurance"
                      type="number"
                      placeholder="0"
                      value={formData.insuranceValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, insuranceValue: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="instructions">Özel Talimatlar</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Dikkatli taşıyın, kırılabilir..."
                      value={formData.specialInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setIsCreateModalOpen(false)
                      resetForm()
                    }}>
                      İptal
                    </Button>
                    <Button 
                      onClick={handleCreateShipping} 
                      disabled={createShipmentMutation.isPending}
                    >
                      {createShipmentMutation.isPending ? 'Oluşturuluyor...' : 'Kargo Oluştur'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {testHasShipping ? (
          <div className="space-y-4">
            {/* Kargo Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Takip Numarası</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm">{testShipping.trackingNumber}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(testShipping.trackingNumber || '')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Kargo Şirketi</span>
                  <span className="text-sm">
                    {carriers.find(c => c.code === testShipping.carrier)?.name || testShipping.carrier}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Durum</span>
                  {getStatusBadge(testShipping.status || 'pending')}
                </div>

                {testShipping.estimatedDelivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tahmini Teslimat</span>
                    <span className="text-sm">{new Date(testShipping.estimatedDelivery).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {testShipping.weight && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ağırlık</span>
                    <span className="text-sm">{testShipping.weight} kg</span>
                  </div>
                )}

                {testShipping.shippingCost && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Kargo Ücreti</span>
                    <span className="text-sm">{testShipping.shippingCost}₺</span>
                  </div>
                )}

                {testShipping.service && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Servis Tipi</span>
                    <span className="text-sm">{serviceTypes.find(s => s.value === testShipping.service)?.label}</span>
                  </div>
                )}
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
                {trackingLoading ? 'Yükleniyor...' : 'Takip Bilgileri'}
              </Button>

              <Button 
                size="sm" 
                variant="outline"
                onClick={handleDownloadLabel}
                disabled={downloadLabelMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloadLabelMutation.isPending ? 'İndiriliyor...' : 'Etiket İndir'}
              </Button>

              {testShipping.trackingNumber && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(`https://www.google.com/search?q=${testShipping.carrier}+kargo+takip+${testShipping.trackingNumber}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Kargo Sitesinde Takip Et
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              Bu sipariş için henüz kargo oluşturulmamış. Kargo oluşturmak için yukarıdaki butona tıklayın.
            </AlertDescription>
          </Alert>
        )}

        {/* Takip Detayları Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Kargo Takip Detayları</DialogTitle>
              <DialogDescription>
                Takip Numarası: {testShipping?.trackingNumber}
              </DialogDescription>
            </DialogHeader>
            
            {trackingLoading ? (
              <div className="text-center py-4">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Takip bilgileri yükleniyor...</p>
              </div>
            ) : trackingData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Durum</Label>
                    <div className="mt-1">{getStatusBadge(trackingData.status)}</div>
                  </div>
                  <div>
                    <Label>Son Güncelleme</Label>
                    <p className="text-sm mt-1">{new Date(trackingData.lastUpdate).toLocaleString('tr-TR')}</p>
                  </div>
                </div>

                {trackingData.estimatedDelivery && (
                  <div>
                    <Label>Tahmini Teslimat</Label>
                    <p className="text-sm mt-1">{new Date(trackingData.estimatedDelivery).toLocaleDateString('tr-TR')}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Kargo Geçmişi</Label>
                    <Button size="sm" variant="outline" onClick={() => refetchTracking()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Yenile
                    </Button>
                  </div>
                  <div className="mt-2 space-y-3">
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
                          <p className="text-sm font-medium">{event.status}</p>
                          <p className="text-xs text-gray-600">{event.location}</p>
                          <p className="text-xs text-gray-500">{new Date(event.date).toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
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