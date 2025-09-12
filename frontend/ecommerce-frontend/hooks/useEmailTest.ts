import { useState } from 'react';

export function useEmailTest(apiUrl: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendTestEmail = async (email: string, type: 'order_confirmation' | 'welcome') => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${apiUrl}/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email, type })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setError(null);
      } else {
        setError(data.error?.message || 'Test e-postası gönderilemedi');
        setSuccess(false);
      }
    } catch (err: any) {
      setError('Test e-postası gönderilemedi');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return { sendTestEmail, loading, error, success };
} 