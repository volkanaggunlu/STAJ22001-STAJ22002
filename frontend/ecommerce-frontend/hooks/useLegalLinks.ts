import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export function useLegalLinks() {
  const [links, setLinks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/legal/links')
      .then((response: any) => {
        const data = response.data;
        if (data.success === false) {
          setError(data.error?.message || 'Yasal linkler alınamadı');
          setLinks(null);
        } else {
          setLinks(data.data || null);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError('Yasal linkler alınamadı');
        setLinks(null);
        setLoading(false);
      });
  }, []);

  return { links, loading, error };
} 