import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export function useUserAddresses(isAuthenticated: boolean) {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    if (process.env.NODE_ENV === 'development') {
      console.log('[FETCH] /users/addresses endpointine istek atılıyor');
    }
    
    apiClient.get('/users/addresses')
      .then((response: any) => {
        const data = response.data;
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Kullanıcı adresleri API yanıtı:', data);
        }
        if (data.success === false) {
          setError(data.error?.message || 'Adresler alınamadı');
          setAddresses([]);
        } else {
          setAddresses(data.data?.addresses || []);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError('Adresler alınamadı');
        setAddresses([]);
        setLoading(false);
      });
  }, [isAuthenticated]);

  return { addresses, loading, error };
} 