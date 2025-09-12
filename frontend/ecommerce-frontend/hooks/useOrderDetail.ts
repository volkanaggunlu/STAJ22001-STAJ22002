import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export function useOrderDetail(orderId: string) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    apiClient.get(`/orders/${orderId}`)
      .then((response: any) => {
        console.log('response', orderId);
        return response.data;
      })
      .then((data: any) => {
        console.log('data', data);
        if (data.success === false) {
          setError(data.error?.message || 'Sipariş detayı alınamadı');
          setOrder(null);
        } else {
          // API doğrudan order döndürüyor, data.data wrapper'ı yok
          const orderData = data.order || data.data?.order || null;
          setOrder(orderData);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError('Sipariş detayı alınamadı');
        setOrder(null);
        setLoading(false);
      });
  }, [orderId]);

  return { order, loading, error };
} 