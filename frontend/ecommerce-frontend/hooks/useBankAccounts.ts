import { useEffect, useState } from 'react';

export function useBankAccounts(apiUrl: string) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}/payments/bank-accounts`)
      .then(res => res.json())
      .then(data => {
        if (data.success === false) {
          setError(data.error?.message || 'Banka hesap bilgileri alınamadı');
          setAccounts([]);
        } else {
          setAccounts(data.data?.accounts || []);
          setError(null);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Banka hesap bilgileri alınamadı');
        setAccounts([]);
        setLoading(false);
      });
  }, [apiUrl]);

  return { accounts, loading, error };
} 