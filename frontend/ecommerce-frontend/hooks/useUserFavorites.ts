import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export function useUserFavorites(isAuthenticated: boolean) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    if (process.env.NODE_ENV === 'development') {
      console.log('[FETCH] /users/favorites endpointine istek atılıyor');
    }
    apiClient.get('/users/favorites')
      .then((response: any) => {
        const data = response.data;
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Kullanıcı favorileri API yanıtı:', data);
        }
        if (data.success === false) {
          setError(data.error?.message || 'Favoriler alınamadı');
          setFavorites([]);
        } else {
          setFavorites(data.data?.favorites || []);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError('Favoriler alınamadı');
        setFavorites([]);
        setLoading(false);
      });
  }, [isAuthenticated]);

  return { favorites, loading, error };
} 