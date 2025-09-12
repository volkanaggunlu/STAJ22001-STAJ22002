import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import invoicesApi from '@/lib/api/services/invoices'
import { QUERY_KEYS } from '@/lib/utils/constants'
import { ApiResponse, Invoice, InvoiceListResponse } from '@/lib/api/types'

export function useInvoice(orderId: string, options?: { refetchIntervalMs?: number; enabled?: boolean }) {
  return useQuery<ApiResponse<Invoice>>({
    queryKey: [...QUERY_KEYS.INVOICE, orderId],
    queryFn: () => invoicesApi.get(orderId),
    enabled: Boolean(orderId) && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const last = (query as any)?.state?.data as ApiResponse<Invoice> | undefined
      if (!last) return false
      const status = String(last?.data?.status || '').toLowerCase()
      const isPending = ['pending', 'processing'].includes(status)
      return isPending ? (options?.refetchIntervalMs ?? 10000) : false
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

export function useInvoicesAdminList(params?: { status?: string; from?: string; to?: string; page?: number; limit?: number }) {
  return useQuery<ApiResponse<InvoiceListResponse>>({
    queryKey: [ ...QUERY_KEYS.INVOICES, params ],
    queryFn: () => invoicesApi.list(params),
    staleTime: 2 * 60 * 1000,
  })
}

export function useAdminManualInvoice(orderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Invoice>) => invoicesApi.adminManual(orderId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEYS.INVOICE, orderId] })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES })
    }
  })
}

export function useAdminSendInvoiceEmail(orderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body?: { pdfPath?: string }) => invoicesApi.adminSendEmail(orderId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEYS.INVOICE, orderId] })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES })
    }
  })
} 