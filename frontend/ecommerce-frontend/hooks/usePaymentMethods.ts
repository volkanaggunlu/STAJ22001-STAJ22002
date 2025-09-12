import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export function usePaymentMethods() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    if (process.env.NODE_ENV === 'development') {
      console.log('[FETCH] /payments/methods endpointine istek atılıyor');
    }
    apiClient.get('/payments/methods')
      .then((response: any) => {
        const data = response.data;
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Ödeme yöntemleri API yanıtı:', data);
        }
        if (data.success === false) {
          setError(data.error?.message || 'Ödeme yöntemleri alınamadı');
          setMethods([]);
        } else {
          setMethods(data.methods || []);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError('Ödeme yöntemleri alınamadı');
        setMethods([]);
        setLoading(false);
      });
  }, []);

  return { methods, loading, error };
} 