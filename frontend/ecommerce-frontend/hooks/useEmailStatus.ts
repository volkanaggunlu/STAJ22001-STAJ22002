import { useEffect, useState } from 'react';

export function useEmailStatus(apiUrl: string) {
  const [emailStatus, setEmailStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}/email/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success === false) {
          setError(data.error?.message || 'E-posta durumu alınamadı');
          setEmailStatus(null);
        } else {
          setEmailStatus(data.data || null);
          setError(null);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('E-posta durumu alınamadı');
        setEmailStatus(null);
        setLoading(false);
      });
  }, [apiUrl]);

  return { emailStatus, loading, error };
} 