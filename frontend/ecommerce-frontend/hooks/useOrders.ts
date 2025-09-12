import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export function useOrders(apiUrl: string, page: number = 1, limit: number = 10, status?: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🛒 [DEBUG] useOrders hook çalışıyor:', { apiUrl, page, limit, status });
    }

    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const url = `/orders?${params.toString()}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🛒 [DEBUG] Siparişler API isteği:', url);
    }

    apiClient.get(url)
      .then((response: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🛒 [DEBUG] Siparişler API yanıt durumu:', response.status);
        }
        return response.data;
      })
      .then((data: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🛒 [DEBUG] Siparişler API yanıtı:', data);
        }

        if (data.success === false) {
          const errorMessage = data.error?.message || 'Siparişler alınamadı';
          if (process.env.NODE_ENV === 'development') {
            console.log('🛒 [DEBUG] Siparişler API hatası:', errorMessage);
          }
          setError(errorMessage);
          setOrders([]);
          setPagination(null);
        } else {
          // API doğrudan orders ve pagination döndürüyor, data.data wrapper'ı yok
          const ordersData = data.orders || data.data?.orders || [];
          const paginationData = data.pagination || data.data?.pagination || null;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🛒 [DEBUG] Siparişler başarıyla alındı:', {
              ordersCount: ordersData.length,
              pagination: paginationData
            });
          }
          setOrders(ordersData);
          setPagination(paginationData);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🛒 [DEBUG] Siparişler API catch hatası:', err);
        }
        setError('Siparişler alınamadı');
        setOrders([]);
        setPagination(null);
        setLoading(false);
      });
  }, [apiUrl, page, limit, status]);

  return { orders, pagination, loading, error };
} 