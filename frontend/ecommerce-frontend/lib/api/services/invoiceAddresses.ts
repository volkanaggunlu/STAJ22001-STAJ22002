import { apiClient } from '../client'

export interface InvoiceAddressPayload {
  title?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  district: string
  postalCode?: string
  companyName?: string
  taxNumber?: string
  taxOffice?: string
  tckn?: string
  notes?: string
  isDefault?: boolean
}

export const invoiceAddressesApi = {
  create: async (payload: InvoiceAddressPayload) => {
    const { data } = await apiClient.post('/users/invoice-addresses', payload)
    return data
  },
  update: async (id: string, payload: InvoiceAddressPayload) => {
    const { data } = await apiClient.put(`/users/invoice-addresses/${id}`, payload)
    return data
  },
  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/users/invoice-addresses/${id}`)
    return data
  },
}

export default invoiceAddressesApi 