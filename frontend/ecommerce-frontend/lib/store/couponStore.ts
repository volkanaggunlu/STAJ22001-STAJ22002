import { create } from 'zustand'

interface CouponState {
  code: string | null
  discount: number
  isLoading: boolean
  error: string | null
  applyCoupon: (code: string) => Promise<void>
  removeCoupon: () => void
}

export const useCouponStore = create<CouponState>((set) => ({
  code: null,
  discount: 0,
  isLoading: false,
  error: null,
  applyCoupon: async (code: string) => {
    set({ isLoading: true, error: null })
    try {
      // Yeni API: /api/coupon/apply
      const res = await fetch('/api/coupon/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon: code })
      })
      const data = await res.json()
      if (data.coupon && typeof data.discountedTotal === 'number') {
        // İndirim miktarını hesapla (ör: eski toplam - yeni toplam)
        // Burada toplamı store'dan almak gerekebilir, şimdilik sadece indirimli toplamı alıyoruz
        set({ code, discount: (data.coupon.discountAmount || 0), isLoading: false, error: null })
      } else if (data.error) {
        set({ error: data.error.message || 'Kupon uygulanamadı', isLoading: false })
      } else {
        set({ error: data.message || 'Kupon uygulanamadı', isLoading: false })
      }
    } catch (err: any) {
      set({ error: err.message || 'Kupon uygulanamadı', isLoading: false })
    }
  },
  removeCoupon: () => set({ code: null, discount: 0, error: null })
})) 