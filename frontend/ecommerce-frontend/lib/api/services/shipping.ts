import { apiClient } from '../client'

// Shipping API Types
export interface ShippingData {
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

export interface CreateShipmentRequest {
  carrier: string
  service: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  insuranceValue?: number
  specialInstructions?: string
}

export interface CarrierInfo {
  code: string
  name: string
  isActive: boolean
  services: {
    code: string
    name: string
    description: string
  }[]
}

export interface TrackingEvent {
  date: string
  status: string
  location: string
  description?: string
}

export interface TrackingData {
  trackingNumber: string
  status: string
  lastUpdate: string
  estimatedDelivery?: string
  actualDelivery?: string
  events: TrackingEvent[]
}

export interface ShippingCostCalculation {
  carrier: string
  service: string
  cost: number
  estimatedDays: number
  currency: string
}

// Shipping API Service
export const shippingApi = {
  // Kargo şirketleri listesi
  getCarriers: async (): Promise<CarrierInfo[]> => {
    try {
      const response = await apiClient.get('/admin/shipping/carriers')
      return response.data.carriers || []
    } catch (error) {
      console.error('Get carriers error:', error)
      // Fallback to static data if API fails
      return [
        {
          code: 'aras',
          name: 'Aras Kargo',
          isActive: true,
          services: [
            { code: 'standard', name: 'Standart Teslimat', description: '2-3 iş günü' },
            { code: 'express', name: 'Hızlı Teslimat', description: '1-2 iş günü' }
          ]
        },
        {
          code: 'mng',
          name: 'MNG Kargo',
          isActive: true,
          services: [
            { code: 'standard', name: 'Standart Teslimat', description: '2-3 iş günü' },
            { code: 'express', name: 'Hızlı Teslimat', description: '1-2 iş günü' }
          ]
        },
        {
          code: 'yurtici',
          name: 'Yurtiçi Kargo',
          isActive: true,
          services: [
            { code: 'standard', name: 'Standart Teslimat', description: '2-3 iş günü' },
            { code: 'express', name: 'Hızlı Teslimat', description: '1-2 iş günü' },
            { code: 'nextday', name: 'Ertesi Gün Teslimat', description: '1 iş günü' }
          ]
        },
        {
          code: 'ptt',
          name: 'PTT Kargo',
          isActive: true,
          services: [
            { code: 'standard', name: 'Standart Teslimat', description: '3-4 iş günü' }
          ]
        }
      ]
    }
  },

  // Kargo siparişi oluşturma
  createShipment: async (orderId: string, data: CreateShipmentRequest): Promise<ShippingData> => {
    const response = await apiClient.post(`/admin/orders/${orderId}/shipping`, data)
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Kargo siparişi oluşturulamadı')
    }
    
    return response.data.data
  },

  // Sipariş kargo bilgilerini getirme
  getOrderShipping: async (orderId: string): Promise<ShippingData | null> => {
    try {
      const response = await apiClient.get(`/admin/orders/${orderId}/shipping`)
      return response.data.success ? response.data.data : null
    } catch (error) {
      console.error('Get order shipping error:', error)
      return null
    }
  },

  // Kargo takip bilgileri
  trackShipment: async (carrier: string, trackingNumber: string): Promise<TrackingData> => {
    // Test modunda mock data döndür
    if (process.env.NODE_ENV === 'development' && trackingNumber === 'TR123456789') {
      console.log('🚛 Mock tracking data döndürülüyor (test modu)')
      return {
        trackingNumber: trackingNumber,
        status: 'in_transit',
        lastUpdate: new Date().toISOString(),
        estimatedDelivery: '2025-02-01T12:00:00Z',
        events: [
          {
            date: '2025-01-30T08:00:00Z',
            status: 'created',
            location: 'İstanbul Depo',
            description: 'Kargo siparişi oluşturuldu'
          },
          {
            date: '2025-01-30T10:30:00Z',
            status: 'picked_up',
            location: 'İstanbul Şube',
            description: 'Kargo şubeden alındı'
          },
          {
            date: '2025-01-30T14:15:00Z',
            status: 'in_transit',
            location: 'Ankara Transfer Merkezi',
            description: 'Kargo yolda, transfer merkezinde'
          },
          {
            date: '2025-01-30T18:45:00Z',
            status: 'in_transit',
            location: 'Ankara Dağıtım Şubesi',
            description: 'Teslimat için hazırlanıyor'
          }
        ]
      }
    }

    const response = await apiClient.get(`/admin/shipping/track/${carrier}/${trackingNumber}`)
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Takip bilgileri alınamadı')
    }
    
    return response.data.data
  },

  // Kargo etiketi indirme
  downloadLabel: async (carrier: string, trackingNumber: string): Promise<Blob> => {
    // Test modunda hata atmayı engelle, mock PDF döndür
    if (process.env.NODE_ENV === 'development' && trackingNumber === 'TR123456789') {
      console.log('🏷️ Mock PDF blob döndürülüyor (test modu)')
      const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/MediaBox [0 0 612 792]
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length 200
>>
stream
BT
/F1 16 Tf
50 700 Td
(KARGO ETİKETİ - TEST MODE) Tj
50 680 Td
(Takip Numarası: ${trackingNumber}) Tj
50 660 Td
(Kargo Şirketi: ${carrier.toUpperCase()}) Tj
50 640 Td
(Oluşturma Tarihi: ${new Date().toLocaleDateString('tr-TR')}) Tj
50 620 Td
(Bu test modunda oluşturulmuş mock bir etikettir.) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000100 00000 n 
0000000244 00000 n 
0000000323 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
580
%%EOF`
      
      return new Blob([mockPdfContent], { type: 'application/pdf' })
    }

    const response = await apiClient.get(
      `/admin/shipping/label/${carrier}/${trackingNumber}`,
      { responseType: 'blob' }
    )
    
    if (!response.data) {
      throw new Error('Etiket indirilemedi')
    }
    
    return response.data
  },

  // Kargo ücreti hesaplama
  calculateShippingCost: async (data: {
    carrier: string
    service: string
    weight: number
    dimensions: {
      length: number
      width: number
      height: number
    }
    destinationCity: string
    destinationDistrict: string
    insuranceValue?: number
  }): Promise<ShippingCostCalculation> => {
    const response = await apiClient.post('/admin/shipping/calculate', data)
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Kargo ücreti hesaplanamadı')
    }
    
    return response.data.data
  },

  // Kargo durumu güncelleme (admin için)
  updateShippingStatus: async (orderId: string, data: {
    status: string
    estimatedDelivery?: string
    actualDelivery?: string
    notes?: string
  }): Promise<ShippingData> => {
    const response = await apiClient.put(`/admin/orders/${orderId}/shipping/status`, data)
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Kargo durumu güncellenemedi')
    }
    
    return response.data.data
  },

  // Toplu kargo takip güncelleme
  bulkUpdateTracking: async (trackingNumbers: string[]): Promise<{
    updated: number
    failed: number
    results: any[]
  }> => {
    const response = await apiClient.post('/admin/shipping/bulk-update', {
      trackingNumbers
    })
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Toplu güncelleme başarısız')
    }
    
    return response.data.data
  },

  // Kargo raporları
  getShippingReports: async (params: {
    startDate?: string
    endDate?: string
    carrier?: string
    status?: string
    page?: number
    limit?: number
  } = {}): Promise<{
    total: number
    data: ShippingData[]
    stats: {
      totalShipments: number
      pendingShipments: number
      inTransitShipments: number
      deliveredShipments: number
      failedShipments: number
    }
  }> => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/admin/shipping/reports?${searchParams.toString()}`)
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Rapor alınamadı')
    }
    
    return response.data.data
  },

  // Kargo şirketi test bağlantısı
  testCarrierConnection: async (carrier: string): Promise<{
    isConnected: boolean
    message: string
    responseTime?: number
  }> => {
    try {
      const startTime = Date.now()
      const response = await apiClient.post(`/admin/shipping/test-connection`, { carrier })
      const responseTime = Date.now() - startTime
      
      return {
        isConnected: response.data.success,
        message: response.data.message || 'Bağlantı başarılı',
        responseTime
      }
    } catch (error: any) {
      return {
        isConnected: false,
        message: error.message || 'Bağlantı başarısız'
      }
    }
  }
}

// Helper functions
export const formatTrackingUrl = (carrier: string, trackingNumber: string): string => {
  const trackingUrls: Record<string, string> = {
    aras: `https://www.araskargo.com.tr/tr/cargo-tracking?code=${trackingNumber}`,
    mng: `https://www.mngkargo.com.tr/tr/cargo-tracking?code=${trackingNumber}`,
    yurtici: `https://www.yurticikargo.com/tr/kargo-takip?code=${trackingNumber}`,
    ptt: `https://www.ptt.gov.tr/kargo-takip?code=${trackingNumber}`,
    ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    dhl: `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${trackingNumber}`
  }
  
  return trackingUrls[carrier] || `https://www.google.com/search?q=${carrier}+kargo+takip+${trackingNumber}`
}

export const getCarrierDisplayName = (carrierCode: string): string => {
  const displayNames: Record<string, string> = {
    aras: 'Aras Kargo',
    mng: 'MNG Kargo',
    yurtici: 'Yurtiçi Kargo',
    ptt: 'PTT Kargo',
    ups: 'UPS',
    dhl: 'DHL'
  }
  
  return displayNames[carrierCode] || carrierCode.toUpperCase()
}

export const getStatusDisplayInfo = (status: string): {
  label: string
  color: string
  icon: string
} => {
  const statusInfo: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Bekliyor', color: 'bg-gray-100 text-gray-800', icon: 'Clock' },
    created: { label: 'Oluşturuldu', color: 'bg-blue-100 text-blue-800', icon: 'Package' },
    picked_up: { label: 'Alındı', color: 'bg-yellow-100 text-yellow-800', icon: 'Truck' },
    in_transit: { label: 'Yolda', color: 'bg-orange-100 text-orange-800', icon: 'Navigation' },
    delivered: { label: 'Teslim Edildi', color: 'bg-green-100 text-green-800', icon: 'CheckCircle' },
    failed: { label: 'Başarısız', color: 'bg-red-100 text-red-800', icon: 'AlertTriangle' }
  }
  
  return statusInfo[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: 'Circle' }
}

export default shippingApi 