import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export function useApplicableCampaigns(orderAmount: number, items: any[]) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (orderAmount) params.append('orderAmount', orderAmount.toString());
    // items parametresi opsiyonel, gerekirse eklenebilir
    apiClient.get(`/campaigns/applicable?${params.toString()}`)
      .then((response: any) => {
        const data = response.data;
        if (data.success === false) {
          setError(data.error?.message || 'Kampanyalar alınamadı');
          setCampaigns([]);
        } else {
          setCampaigns(data.data?.campaigns || []);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError('Kampanyalar alınamadı');
        setCampaigns([]);
        setLoading(false);
      });
  }, [orderAmount]);

  return { campaigns, loading, error };
}

export function useSuggestedCampaign(orderAmount: number, items: any[]) {
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (orderAmount) params.append('orderAmount', orderAmount.toString());
    // items parametresi opsiyonel, gerekirse eklenebilir
    apiClient.get(`/campaigns/suggest?${params.toString()}`)
      .then((response: any) => {
        const data = response.data;
        if (data.success === false) {
          setError(data.error?.message || 'Kampanya önerisi alınamadı');
          setCampaign(null);
        } else {
          setCampaign(data.data?.campaign || null);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setError('Kampanya önerisi alınamadı');
        setCampaign(null);
        setLoading(false);
      });
  }, [orderAmount]);

  return { campaign, loading, error };
} 