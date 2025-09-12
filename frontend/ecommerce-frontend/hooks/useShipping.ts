import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  shippingApi, 
  CreateShipmentRequest, 
  ShippingData,
  CarrierInfo,
  TrackingData,
  TrackingEvent,
  ShippingCostCalculation
} from '@/lib/api/services/shipping'

// Re-export types for convenience
export type { 
  ShippingData, 
  CreateShipmentRequest, 
  CarrierInfo, 
  TrackingData, 
  TrackingEvent, 
  ShippingCostCalculation 
} from '@/lib/api/services/shipping'

// Shipping Query Keys
export const SHIPPING_QUERY_KEYS = {
  all: ['shipping'] as const,
  carriers: () => [...SHIPPING_QUERY_KEYS.all, 'carriers'] as const,
  orderShipping: (orderId: string) => [...SHIPPING_QUERY_KEYS.all, 'order', orderId] as const,
  tracking: (carrier: string, trackingNumber: string) => 
    [...SHIPPING_QUERY_KEYS.all, 'tracking', carrier, trackingNumber] as const,
  reports: (params?: any) => [...SHIPPING_QUERY_KEYS.all, 'reports', { params }] as const,
} as const

// Shipping Hooks

/**
 * Kargo şirketleri listesi hook'u
 */
export const useCarriers = () => {
  return useQuery({
    queryKey: SHIPPING_QUERY_KEYS.carriers(),
    queryFn: () => shippingApi.getCarriers(),
    staleTime: 10 * 60 * 1000, // 10 minutes (carriers rarely change)
    gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime in v4)
    refetchOnWindowFocus: false,
  })
}

/**
 * Sipariş kargo bilgileri hook'u
 */
export const useOrderShipping = (orderId: string) => {
  return useQuery({
    queryKey: SHIPPING_QUERY_KEYS.orderShipping(orderId),
    queryFn: () => shippingApi.getOrderShipping(orderId),
    enabled: !!orderId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

/**
 * Kargo takip bilgileri hook'u
 */
export const useShippingTracking = (carrier: string, trackingNumber: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: SHIPPING_QUERY_KEYS.tracking(carrier, trackingNumber),
    queryFn: () => shippingApi.trackShipment(carrier, trackingNumber),
    enabled: enabled && !!carrier && !!trackingNumber,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
    refetchOnWindowFocus: true, // Refetch when user comes back to the tab
  })
}

/**
 * Kargo raporları hook'u
 */
export const useShippingReports = (params?: {
  startDate?: string
  endDate?: string
  carrier?: string
  status?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: SHIPPING_QUERY_KEYS.reports(params),
    queryFn: () => shippingApi.getShippingReports(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Shipping Mutations

/**
 * Kargo oluşturma mutation hook'u
 */
export const useCreateShipment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: CreateShipmentRequest }) =>
      shippingApi.createShipment(orderId, data),
    onSuccess: (data, variables) => {
      toast.success('Kargo siparişi başarıyla oluşturuldu!')
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: SHIPPING_QUERY_KEYS.orderShipping(variables.orderId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['admin', 'order', variables.orderId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: SHIPPING_QUERY_KEYS.reports() 
      })
    },
    onError: (error: any) => {
      const message = error?.message || 'Kargo siparişi oluşturulamadı'
      toast.error(message)
      console.error('Create shipment error:', error)
    }
  })
}

/**
 * Kargo durumu güncelleme mutation hook'u
 */
export const useUpdateShippingStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }: { 
      orderId: string; 
      data: {
        status: string
        estimatedDelivery?: string
        actualDelivery?: string
        notes?: string
      }
    }) => shippingApi.updateShippingStatus(orderId, data),
    onSuccess: (data, variables) => {
      toast.success('Kargo durumu güncellendi!')
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: SHIPPING_QUERY_KEYS.orderShipping(variables.orderId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['admin', 'order', variables.orderId] 
      })
    },
    onError: (error: any) => {
      const message = error?.message || 'Kargo durumu güncellenemedi'
      toast.error(message)
      console.error('Update shipping status error:', error)
    }
  })
}

/**
 * Kargo ücreti hesaplama mutation hook'u
 */
export const useCalculateShippingCost = () => {
  return useMutation({
    mutationFn: (data: {
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
    }) => shippingApi.calculateShippingCost(data),
    onError: (error: any) => {
      const message = error?.message || 'Kargo ücreti hesaplanamadı'
      toast.error(message)
      console.error('Calculate shipping cost error:', error)
    }
  })
}

/**
 * Toplu kargo takip güncelleme mutation hook'u
 */
export const useBulkUpdateTracking = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (trackingNumbers: string[]) => 
      shippingApi.bulkUpdateTracking(trackingNumbers),
    onSuccess: (result) => {
      const typedResult = result as { updated: number; failed: number; results: any[] }
      toast.success(`${typedResult.updated} kargo güncellendi, ${typedResult.failed} başarısız`)
      
      // Invalidate all shipping reports
      queryClient.invalidateQueries({ 
        queryKey: SHIPPING_QUERY_KEYS.reports() 
      })
    },
    onError: (error: any) => {
      const message = error?.message || 'Toplu güncelleme başarısız'
      toast.error(message)
      console.error('Bulk update tracking error:', error)
    }
  })
}

/**
 * Kargo şirketi bağlantı testi mutation hook'u
 */
export const useTestCarrierConnection = () => {
  return useMutation({
    mutationFn: (carrier: string) => shippingApi.testCarrierConnection(carrier),
    onSuccess: (result) => {
      const typedResult = result as { isConnected: boolean; message: string; responseTime?: number }
      if (typedResult.isConnected) {
        toast.success(`${typedResult.message} (${typedResult.responseTime}ms)`)
      } else {
        toast.error(typedResult.message)
      }
    },
    onError: (error: any) => {
      const message = error?.message || 'Bağlantı testi başarısız'
      toast.error(message)
      console.error('Test carrier connection error:', error)
    }
  })
}

/**
 * Kargo etiketi indirme helper hook'u
 */
export const useDownloadShippingLabel = () => {
  return useMutation({
    mutationFn: ({ carrier, trackingNumber }: { carrier: string; trackingNumber: string }) =>
      shippingApi.downloadLabel(carrier, trackingNumber),
    onSuccess: (blob, variables) => {
      const blobData = blob as Blob
      // Create download link
      const url = window.URL.createObjectURL(blobData)
      const a = document.createElement('a')
      a.href = url
      a.download = `kargo-etiket-${variables.trackingNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Etiket indiriliyor...')
    },
    onError: (error: any) => {
      const message = error?.message || 'Etiket indirilemedi'
      toast.error(message)
      console.error('Download label error:', error)
    }
  })
} 