import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import invoiceAddressesApi, { InvoiceAddressPayload } from '@/lib/api/services/invoiceAddresses'

export function useInvoiceAddresses(isAuthenticated: boolean) {
  const [invoiceAddresses, setInvoiceAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    if (process.env.NODE_ENV === 'development') {
      console.log('[FETCH] /users/invoice-addresses endpointine istek atılıyor');
    }

    apiClient.get('/users/invoice-addresses')
      .then((response: any) => {
        const data = response.data;
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Fatura adresleri API yanıtı:', data);
        }
        if (data.success === false) {
          setError(data.error?.message || 'Fatura adresleri alınamadı');
          setInvoiceAddresses([]);
        } else {
          setInvoiceAddresses(data.data?.invoiceAddresses || []);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError('Fatura adresleri alınamadı');
        setInvoiceAddresses([]);
        setLoading(false);
      });
  }, [isAuthenticated]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const createAddress = async (payload: InvoiceAddressPayload) => {
    const res = await invoiceAddressesApi.create(payload)
    fetchList()
    return res
  }

  const updateAddress = async (id: string, payload: InvoiceAddressPayload) => {
    const res = await invoiceAddressesApi.update(id, payload)
    fetchList()
    return res
  }

  const removeAddress = async (id: string) => {
    const res = await invoiceAddressesApi.remove(id)
    fetchList()
    return res
  }

  return { invoiceAddresses, loading, error, reload: fetchList, createAddress, updateAddress, removeAddress };
} 