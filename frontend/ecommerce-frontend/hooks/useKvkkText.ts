import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export function useKvkkText() {
  const [kvkk, setKvkk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/legal/kvkk-text')
      .then((response: any) => {
        const data = response.data;
        if (data.success === false) {
          setError(data.error?.message || 'KVKK metni alınamadı');
          setKvkk(null);
        } else {
          setKvkk(data.data || null);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError('KVKK metni alınamadı');
        setKvkk(null);
        setLoading(false);
      });
  }, []);

  return { kvkk, loading, error };
} 