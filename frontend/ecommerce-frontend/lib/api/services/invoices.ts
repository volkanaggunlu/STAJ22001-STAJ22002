import { apiClient } from '../client'
import { API_ENDPOINTS } from '@/lib/utils/constants'
import { 
  ApiResponse,
  Invoice,
  InvoiceListResponse,
} from '../types'

export const invoicesApi = {
  // Get invoice detail for an order
  get: async (orderId: string): Promise<ApiResponse<Invoice>> => {
    const { data } = await apiClient.get(API_ENDPOINTS.INVOICES.DETAIL(orderId))
    return data as ApiResponse<Invoice>
  },

  // Admin: create/update manual invoice fields
  adminManual: async (orderId: string, payload: Partial<Invoice>): Promise<ApiResponse<Invoice>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.INVOICES.ADMIN_MANUAL(orderId), payload)
    return data as ApiResponse<Invoice>
  },

  // Admin: send invoice email to user
  adminSendEmail: async (orderId: string, body?: { pdfPath?: string }): Promise<ApiResponse<Invoice>> => {
    const { data } = await apiClient.post(API_ENDPOINTS.INVOICES.ADMIN_SEND_EMAIL(orderId), body || {})
    return data as ApiResponse<Invoice>
  },

  // Admin: list invoices
  list: async (
    params?: { status?: string; from?: string; to?: string; page?: number; limit?: number }
  ): Promise<ApiResponse<InvoiceListResponse>> => {
    const search = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) search.append(k, String(v))
      })
    }
    const { data } = await apiClient.get(`${API_ENDPOINTS.INVOICES.LIST}?${search.toString()}`)
    return data as ApiResponse<InvoiceListResponse>
  },

  // User/Admin: download invoice PDF (binary)
  downloadPdf: async (orderId: string): Promise<Blob> => {
    const url = API_ENDPOINTS.ORDERS.INVOICE_PDF(orderId)
    const resp = await apiClient.get(url, { responseType: 'arraybuffer' })
    const contentType: string = resp.headers?.['content-type'] || 'application/pdf'
    return new Blob([resp.data as ArrayBuffer], { type: contentType })
  },
}

export default invoicesApi 