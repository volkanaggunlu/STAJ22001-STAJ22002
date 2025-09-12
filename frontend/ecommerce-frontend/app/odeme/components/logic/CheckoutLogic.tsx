"use client"

import { useRouter } from "next/navigation"
import { toast } from 'sonner'
import { useCartStore } from '@/lib/store/cartStore'
import { apiClient } from '@/lib/api/client';

export const useCheckoutLogic = () => {
  const router = useRouter()
  const clearCart = useCartStore(state => state.clearCart)

  // Sipariş oluşturma
  const handlePlaceOrder = async ({
    isAuthenticated,
    user,
    customerType,
    shippingForm,
    selectedCity,
    selectedDistrict,
    useInvoiceAddress,
    invoiceForm,
    cartItems,
    paymentMethod,
    couponCode,
    selectedCampaign,
    campaignDiscount,
    customerNote,
    deliveryNote,
    agreeTerms,
    kvkkConsent,
    distanceSalesConsent,
    setIsPlacingOrder,
    setOrderError,
    total,
    initiatePayTRPayment
  }: {
    isAuthenticated: boolean
    user: any
    customerType: 'bireysel' | 'firma'
    shippingForm: any
    selectedCity: string
    selectedDistrict: string
    useInvoiceAddress: boolean
    invoiceForm: any
    cartItems: any[]
    paymentMethod: string
    couponCode: string | null
    selectedCampaign: any
    campaignDiscount: number
    customerNote: string
    deliveryNote: string
    agreeTerms: boolean
    kvkkConsent: boolean
    distanceSalesConsent: boolean
    setIsPlacingOrder: (loading: boolean) => void
    setOrderError: (error: string) => void
    total: number
    initiatePayTRPayment: (orderId: string) => Promise<void>
  }) => {
    setOrderError('')
    
    // Sepet boş kontrolü
    if (!cartItems || cartItems.length === 0) {
      setOrderError('Sepetiniz boş. Sipariş vermek için önce ürün ekleyin.')
      toast.error('Sepetiniz boş. Lütfen önce ürün ekleyin.')
      router.push('/sepet')
      return
    }
    
    // Debug bilgileri
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 [DEBUG] Authentication Check:', {
        isAuthenticated,
        user: user ? { id: user.id, email: user.email } : null,
        hasToken: !!localStorage.getItem('auth-token')
      })
      
      console.log('🛒 [DEBUG] Cart Items:', {
        cartItemsCount: cartItems.length,
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      })
    }
    
    // Kullanıcı authentication kontrolü
    if (!isAuthenticated) {
      setOrderError('Sipariş vermek için giriş yapmanız gerekmektedir.')
      toast.error('Lütfen önce giriş yapın')
      router.push('/login?redirect=/odeme')
      return
    }
    
    // Firma ise validasyon
    if (customerType === 'firma' && (!invoiceForm.companyName || !invoiceForm.taxNumber)) {
      toast.error('Firma için şirket adı ve vergi numarası zorunludur!')
      return;
    }
    
    // Onay kutuları kontrolü
    if (process.env.NODE_ENV === 'development') {
      console.log('Debug - Onay kutuları durumu:', {
        agreeTerms,
        kvkkConsent,
        distanceSalesConsent
      });
    }
    if (!agreeTerms || !kvkkConsent || !distanceSalesConsent) {
      setOrderError('Tüm yasal onay kutularını işaretlemelisiniz.')
      return;
    }
    
    setIsPlacingOrder(true)
    try {
      const coupon = couponCode || undefined
      
      // Kampanya debug bilgileri
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 [DEBUG] Kampanya Bilgileri:', {
          selectedCampaign,
          campaignDiscount,
          selectedCampaignId: selectedCampaign?.id,
          selectedCampaignDiscountAmount: selectedCampaign?.discountAmount,
          selectedCampaignDiscountType: selectedCampaign?.discount?.type,
          selectedCampaignDiscountValue: selectedCampaign?.discount?.value,
          note: 'Kampanya bilgileri backend\'e gönderiliyor'
        })
      }
      
      const requestBody = {
        customerType,
        shippingAddress: {
          firstName: shippingForm.firstName,
          lastName: shippingForm.lastName,
          email: shippingForm.email,
          phone: shippingForm.phone,
          address: shippingForm.address,
          city: selectedCity,
          district: selectedDistrict,
          postalCode: shippingForm.postalCode
        },
        billingAddress: (customerType === 'firma' || !useInvoiceAddress) ? {
          firstName: invoiceForm.firstName,
          lastName: invoiceForm.lastName,
          email: invoiceForm.email,
          phone: invoiceForm.phone,
          address: invoiceForm.address,
          city: invoiceForm.city,
          district: invoiceForm.district,
          postalCode: invoiceForm.postalCode,
          companyName: invoiceForm.companyName,
          taxNumber: invoiceForm.taxNumber,
          taxOffice: invoiceForm.taxOffice,
          tckn: customerType === 'bireysel' ? invoiceForm.tckn : undefined,
          notes: invoiceForm.notes
        } : {
          // Fatura adresi teslimat ile aynı ise, shipping bilgilerini kopyala
          firstName: shippingForm.firstName,
          lastName: shippingForm.lastName,
          email: shippingForm.email,
          phone: shippingForm.phone,
          address: shippingForm.address,
          city: selectedCity,
          district: selectedDistrict,
          postalCode: shippingForm.postalCode,
          // Bireysel için TCKN yine gönderilsin
          tckn: customerType === 'bireysel' ? invoiceForm.tckn : undefined,
        },
        items: cartItems.map(item => {
          const p = item.product
          return {
            productId: item.productId,
            name: p?.name || 'Ürün',
            image: p?.images?.[0]?.url || '',
            price: item.price ?? p?.price ?? 0,
            originalPrice: item.originalPrice ?? p?.originalPrice,
            quantity: item.quantity,
            sku: p?.sku || String(item.productId),
            type: (p?.type === 'bundle' ? 'bundle' : 'product'),
            bundleItems: p?.type === 'bundle' && Array.isArray(p?.bundleItems)
              ? p.bundleItems.map((bi: any) => ({
                  productId: bi.productId,
                  name: bi.name,
                  quantity: bi.quantity,
                  price: bi.price,
                }))
              : undefined,
          }
        }),
        paymentMethod,
        couponCode: coupon,
        // Kampanya bilgilerini backend'e gönder
        campaign: selectedCampaign ? {
          id: selectedCampaign.id,
          name: selectedCampaign.name,
          type: selectedCampaign.type,
          discountType: selectedCampaign.discount?.type,
          discountValue: selectedCampaign.discount?.value,
          discountAmount: campaignDiscount
        } : undefined,
        notes: {
          customer: customerNote.trim() || undefined,
          delivery: deliveryNote.trim() || undefined
        },
        shippingType: "standart", // Sabit kargo tipi
        kvkkConsent,
        privacyPolicyConsent: agreeTerms, // agreeTerms hem kullanım şartları hem gizlilik politikası için
        distanceSalesConsent
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Debug - Request Body:', requestBody);
      }
      
      // Debug: API isteği öncesi token kontrolü
      if (process.env.NODE_ENV === 'development') {
        const token = localStorage.getItem('auth-token')
        console.log('🔐 [DEBUG] API Request Details:', {
          url: '/orders',
          method: 'POST',
          hasToken: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
          user: user ? { id: user.id, email: user.email } : null
        })
      }
      
      const { data } = await apiClient.post('/orders', requestBody);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('API Response:', data); // Debug için
      }
      
      // API yanıt yapısını kontrol et - hem data.data.order hem de data.order olabilir
      const order = data.data?.order || data.order;
      
      if (data.success && order) {
        const orderId = order._id

        // Eğer kredi kartı seçildiyse PayTR ile ödeme başlat
        if (paymentMethod === 'credit-card') {
          await initiatePayTRPayment(orderId)
        } else {
          // Havale/EFT için başarı sayfasına yönlendir
          toast.success('Sipariş başarıyla oluşturuldu!')
          clearCart() // Sepeti temizle
          router.push(`/odeme/basarili?orderNumber=${order.orderNumber}&orderId=${orderId}&totalAmount=${total}&paymentMethod=${paymentMethod}&customerType=${customerType}`)
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error Response:', data); // Debug için
        }
        setOrderError(data.error?.message || data.message || 'Sipariş oluşturulamadı')
      }
    } catch (err: any) {
      setOrderError(err.message || 'Sipariş oluşturulamadı')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // PayTR ödeme başlat
  const initiatePayTRPayment = async ({
    orderId,
    setPayTRToken,
    setShowPayTR,
    setCurrentOrderId,
    setIsPlacingOrder
  }: {
    orderId: string
    setPayTRToken: (token: string) => void
    setShowPayTR: (show: boolean) => void
    setCurrentOrderId: (id: string) => void
    setIsPlacingOrder: (loading: boolean) => void
  }) => {
    try {
      const { data } = await apiClient.post('/payments/paytr/init', { orderId });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('PayTR API Response:', data); // Debug için
      }
      
      if (data.success && data.data?.iframeToken) {
        setPayTRToken(data.data.iframeToken)
        setShowPayTR(true)
        setCurrentOrderId(orderId)
        
        // Test modu bilgisi
        if (process.env.NODE_ENV === 'development') {
          console.log('PayTR Test Mode Active - Token:', data.data.iframeToken);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('PayTR API Error Response:', data); // Debug için
        }
        throw new Error(data.error?.message || data.message || 'PayTR ödeme başlatılamadı')
      }
    } catch (error: any) {
      console.error('PayTR Error:', error);
      
      // Test modu hatası kontrolü
      if (error.message?.includes('Gecersiz token') || error.message?.includes('test')) {
        toast.error('PayTR test modu aktif. Gerçek ödeme bilgileri henüz yapılandırılmamış.')
      } else {
        toast.error(error.message || 'PayTR ödeme başlatılamadı')
      }
      setIsPlacingOrder(false)
    }
  }

  // PayTR başarılı ödeme
  const handlePayTRSuccess = ({
    clearCart,
    removeCoupon,
    currentOrderId,
    total,
    paymentMethod,
    customerType
  }: {
    clearCart: () => void
    removeCoupon: () => void
    currentOrderId: string
    total: number
    paymentMethod: string
    customerType: 'bireysel' | 'firma'
  }) => {
    toast.success('Ödeme başarıyla tamamlandı!')
    
    // Önce yönlendirme yap, sonra sepeti temizle
    const successUrl = `/odeme/basarili?orderId=${currentOrderId}&totalAmount=${total}&paymentMethod=${paymentMethod}&customerType=${customerType}`
    
    // Yönlendirmeyi hemen yap
    router.push(successUrl)
    
    // Kısa bir gecikme ile sepeti temizle (yönlendirme tamamlandıktan sonra)
    setTimeout(() => {
      clearCart()
      removeCoupon()
    }, 100)
  }

  // PayTR hatalı ödeme
  const handlePayTRError = ({
    error,
    setShowPayTR,
    setIsPlacingOrder
  }: {
    error: string
    setShowPayTR: (show: boolean) => void
    setIsPlacingOrder: (loading: boolean) => void
  }) => {
    console.error('PayTR Error:', error);
    if (error.includes('Gecersiz token') || error.includes('test')) {
      toast.error('PayTR test modu aktif. Gerçek ödeme bilgileri henüz yapılandırılmamış.')
    } else {
      toast.error(`Ödeme hatası: ${error}`)
    }
    setShowPayTR(false)
    setIsPlacingOrder(false)
  }

  // PayTR iframe container
  const PayTRContainer = ({
    showPayTR,
    setShowPayTR,
    payTRToken,
    handlePayTRSuccess,
    handlePayTRError,
    PayTRIframe
  }: {
    showPayTR: boolean
    setShowPayTR: (show: boolean) => void
    payTRToken: string
    handlePayTRSuccess: () => void
    handlePayTRError: (error: string) => void
    PayTRIframe: any
  }) => {
    if (!showPayTR) return null

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setShowPayTR(false)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Ödeme sayfasına dön
              </button>
            </div>
            
            <PayTRIframe
              iframeToken={payTRToken}
              onSuccess={handlePayTRSuccess}
              onError={handlePayTRError}
            />
          </div>
        </div>
      </div>
    )
  }

  return {
    handlePlaceOrder,
    initiatePayTRPayment,
    handlePayTRSuccess,
    handlePayTRError,
    PayTRContainer,
  }
} 