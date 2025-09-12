"use client"

import { useRouter } from "next/navigation"
import { toast } from 'sonner'
import { useCartStore } from '@/lib/store/cartStore'
import { PayTRIframe } from './components/payment/PayTRIframe';
import { CheckoutHeader } from './components/ui/CheckoutHeader';
import { ShippingInformation } from './components/forms/ShippingInformation';
import { PaymentInformation } from './components/forms/PaymentInformation';
import { OrderSummary } from './components/ui/OrderSummary';
import { OrderConfirmation } from './components/ui/OrderConfirmation';
import { useCheckoutState } from './components/state/CheckoutStateManager';
import { useCheckoutLogic } from './components/logic/CheckoutLogic';
import { useCheckoutValidation } from './components/validation/CheckoutValidation';

export default function CheckoutPage() {
  const router = useRouter()
  const clearCart = useCartStore(state => state.clearCart)
  
  // Checkout state hook'u kullan
  const {
    // State
    currentStep,
    setCurrentStep,
    paymentMethod,
    setPaymentMethod,
    useInvoiceAddress,
    setUseInvoiceAddress,
    selectedCity,
    setSelectedCity,
    selectedDistrict,
    setSelectedDistrict,
    agreeTerms,
    setAgreeTerms,
    agreeMarketing,
    setAgreeMarketing,
    customerType,
    setCustomerType,
    useNewShippingAddress,
    setUseNewShippingAddress,
    useNewInvoiceAddress,
    setUseNewInvoiceAddress,
    shippingForm,
    setShippingForm,
    invoiceForm,
    setInvoiceForm,
    paymentForm,
    setPaymentForm,
    selectedShippingAddressId,
    setSelectedShippingAddressId,
    selectedInvoiceAddressId,
    setSelectedInvoiceAddressId,
    isPlacingOrder,
    setIsPlacingOrder,
    orderError,
    setOrderError,
    showPayTR,
    setShowPayTR,
    payTRToken,
    setPayTRToken,
    currentOrderId,
    setCurrentOrderId,
    kvkkConsent,
    setKvkkConsent,
    distanceSalesConsent,
    setDistanceSalesConsent,
    customerNote,
    setCustomerNote,
    deliveryNote,
    setDeliveryNote,
    formErrors,
    setFormErrors,
    cardErrors,
    setCardErrors,
    inputCoupon,
    setInputCoupon,
    selectedCampaign,
    setSelectedCampaign,
    campaignDiscount,

    // Data
    cartItems,
    user,
    isAuthenticated,
    couponCode,
    couponDiscount,
    couponLoading,
    couponError,
    applyCoupon,
    removeCoupon,
    subtotal,
    shippingCost,
    total,
    applicableCampaigns,
    campaignsLoading,
    suggestedCampaign,
    suggestedCampaignLoading,
    paymentOptions,
    userAddresses,
    invoiceAddresses,
    legalLinks,
    legalLinksLoading,
    legalLinksError,
    kvkk,
    kvkkLoading,
    kvkkError,
    cities,
    districts,
    isCompany,

    // Handlers
    handleNextStep,
    handlePrevStep,
    validateForm,
    maskCardNumber,
    maskExpiry,
    handleApplyCoupon,
    handleRemoveCoupon,
  } = useCheckoutState()

  // Cart loading state'ini al
  const isCartLoaded = useCartStore(state => state.isLoaded)

  // Checkout logic hook'u kullan
  const {
    handlePlaceOrder: handlePlaceOrderLogic,
    initiatePayTRPayment: initiatePayTRPaymentLogic,
    handlePayTRSuccess: handlePayTRSuccessLogic,
    handlePayTRError: handlePayTRErrorLogic,
    PayTRContainer,
  } = useCheckoutLogic()

  // Checkout validation hook'u kullan
  const {
    validateAllSteps,
    validateCurrentStep,
    canNavigateToStep,
  } = useCheckoutValidation()

  // Tab navigasyon fonksiyonu
  const handleStepClick = (targetStep: number) => {
    // Sadece step değiştir, validasyon yapma
    setCurrentStep(targetStep)
  }

  // Tab navigasyon kontrolü - her zaman true döndür
  const canNavigateToStepHandler = (targetStep: number): boolean => {
    return true // Her zaman tıklanabilir
  }

  // PayTR başarılı ödeme
  const handlePayTRSuccess = () => {
    handlePayTRSuccessLogic({
      clearCart,
      removeCoupon,
      currentOrderId,
      total,
      paymentMethod,
      customerType
    })
  }

  // PayTR hatalı ödeme
  const handlePayTRError = (error: string) => {
    handlePayTRErrorLogic({
      error,
      setShowPayTR,
      setIsPlacingOrder
    })
  }

  // PayTR iframe gösteriliyorsa sadece iframe'i göster
  if (showPayTR) {
    return (
      <PayTRContainer
        showPayTR={showPayTR}
        setShowPayTR={setShowPayTR}
        payTRToken={payTRToken}
        handlePayTRSuccess={handlePayTRSuccess}
        handlePayTRError={handlePayTRError}
        PayTRIframe={PayTRIframe}
      />
    )
  }

  // Loading state - cart henüz yüklenmemişse loading göster
  if (!isCartLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Sepet Yükleniyor</h1>
          <p className="text-gray-600">Lütfen bekleyin...</p>
        </div>
      </div>
    )
  }

  // Sepet boş kontrolü - sayfa yüklendiğinde kontrol et (PayTR iframe gösterilmiyorsa)
  if (!showPayTR && (!cartItems || cartItems.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sepetiniz Boş</h1>
          <p className="text-gray-600 mb-8">Sipariş vermek için önce sepetinize ürün ekleyin.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Alışverişe Başla
          </button>
        </div>
      </div>
    )
  }

  // Gelişmiş validasyon ile sipariş oluşturma fonksiyonu
  const handlePlaceOrder = async () => {
    // Önce tüm adımları validate et
    const validationResult = validateAllSteps({
      currentStep,
      customerType,
      cartItems,
      shippingForm,
      selectedCity,
      selectedDistrict,
      useNewShippingAddress,
      selectedShippingAddressId,
      useInvoiceAddress,
      invoiceForm,
      useNewInvoiceAddress,
      selectedInvoiceAddressId,
      paymentMethod,
      paymentForm,
      agreeTerms,
      kvkkConsent,
      distanceSalesConsent
    })

    // Eğer validasyon başarısızsa, toast mesajı göster ve ilgili step'e yönlendir
    if (!validationResult.isValid) {
      const firstError = validationResult.firstError
      if (firstError) {
        // Sepet boşsa özel mesaj göster
        if (firstError.field === 'cart') {
          toast.error(firstError.message, {
            duration: 4000,
            action: {
              label: 'Alışverişe Başla',
              onClick: () => router.push('/')
            }
          })
      return
    }
    
        // İlgili step'e yönlendir
        setCurrentStep(firstError.step)
        
        // Toast mesajı göster
        toast.error(firstError.message, {
          duration: 4000,
          action: {
            label: 'Düzelt',
            onClick: () => {
              // Kısa bir süre sonra ilgili alana scroll yap
              setTimeout(() => {
                const element = document.getElementById(firstError.field)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  element.focus()
                }
              }, 100)
            }
          }
        })
        return
      }
    }

    // Validasyon başarılıysa sipariş oluştur
    await handlePlaceOrderLogic({
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
      initiatePayTRPayment: (orderId: string) => initiatePayTRPaymentLogic({
        orderId,
        setPayTRToken,
        setShowPayTR,
        setCurrentOrderId,
        setIsPlacingOrder
      })
    })
  }

  // Gelişmiş validasyon ile step geçişi
  const handleNextStepWithValidation = () => {
    // Mevcut step'i validate et
    const isValid = validateCurrentStep({
      currentStep,
        customerType,
      shippingForm,
      selectedCity,
      selectedDistrict,
      useNewShippingAddress,
      selectedShippingAddressId,
      useInvoiceAddress,
      invoiceForm,
      useNewInvoiceAddress,
      selectedInvoiceAddressId,
        paymentMethod,
      paymentForm,
      agreeTerms,
        kvkkConsent,
        distanceSalesConsent
    }, setCurrentStep)

    // Eğer validasyon başarılıysa bir sonraki step'e geç
    if (isValid && currentStep < 3) {
      handleNextStep()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <CheckoutHeader 
          currentStep={currentStep} 
          onStepClick={handleStepClick}
          canNavigateToStep={canNavigateToStepHandler}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Information */}
            <ShippingInformation
              currentStep={currentStep}
              customerType={customerType}
              setCustomerType={setCustomerType}
              subtotal={subtotal}
              useNewShippingAddress={useNewShippingAddress}
              setUseNewShippingAddress={setUseNewShippingAddress}
              shippingForm={shippingForm}
              setShippingForm={setShippingForm}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
              userAddresses={userAddresses}
              selectedShippingAddressId={selectedShippingAddressId}
              setSelectedShippingAddressId={setSelectedShippingAddressId}
              useInvoiceAddress={useInvoiceAddress}
              setUseInvoiceAddress={setUseInvoiceAddress}
              invoiceForm={invoiceForm}
              setInvoiceForm={setInvoiceForm}
              invoiceAddresses={invoiceAddresses}
              selectedInvoiceAddressId={selectedInvoiceAddressId}
              setSelectedInvoiceAddressId={setSelectedInvoiceAddressId}
              useNewInvoiceAddress={useNewInvoiceAddress}
              setUseNewInvoiceAddress={setUseNewInvoiceAddress}
              formErrors={formErrors}
              validateForm={validateForm}
              handleNextStep={handleNextStepWithValidation}
              cities={cities}
              districts={districts}
            />

            {/* Step 2: Payment Information */}
            {currentStep === 2 && (
              <PaymentInformation
                currentStep={currentStep}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                paymentOptions={paymentOptions}
                paymentForm={paymentForm}
                setPaymentForm={setPaymentForm}
                cardErrors={cardErrors}
                setCardErrors={setCardErrors}
                formErrors={formErrors}
                validateForm={validateForm}
                maskCardNumber={maskCardNumber}
                maskExpiry={maskExpiry}
                handleNextStep={handleNextStepWithValidation}
                handlePrevStep={handlePrevStep}
              />
            )}

            {/* Step 3: Order Summary */}
            {currentStep === 3 && (
              <OrderConfirmation
                currentStep={currentStep}
                cartItems={cartItems}
                subtotal={subtotal}
                shippingCost={shippingCost}
                couponDiscount={couponDiscount}
                campaignDiscount={campaignDiscount}
                total={total}
                agreeTerms={agreeTerms}
                setAgreeTerms={setAgreeTerms}
                kvkkConsent={kvkkConsent}
                setKvkkConsent={setKvkkConsent}
                distanceSalesConsent={distanceSalesConsent}
                setDistanceSalesConsent={setDistanceSalesConsent}
                agreeMarketing={agreeMarketing}
                setAgreeMarketing={setAgreeMarketing}
                isPlacingOrder={isPlacingOrder}
                orderError={orderError}
                handlePlaceOrder={handlePlaceOrder}
                handlePrevStep={handlePrevStep}
                legalLinks={legalLinks}
                legalLinksLoading={legalLinksLoading}
                legalLinksError={legalLinksError || undefined}
                kvkk={kvkk}
                kvkkLoading={kvkkLoading}
                kvkkError={kvkkError || undefined}
              />
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary
              cartItems={cartItems}
              subtotal={subtotal}
              shippingCost={shippingCost}
              couponDiscount={couponDiscount}
              campaignDiscount={campaignDiscount}
              total={total}
              inputCoupon={inputCoupon}
              setInputCoupon={setInputCoupon}
              handleApplyCoupon={handleApplyCoupon}
              handleRemoveCoupon={handleRemoveCoupon}
              couponCode={couponCode || undefined}
              couponLoading={couponLoading}
              couponError={couponError || undefined}
              applicableCampaigns={applicableCampaigns}
              campaignsLoading={campaignsLoading}
              selectedCampaign={selectedCampaign}
              setSelectedCampaign={setSelectedCampaign}
              suggestedCampaign={suggestedCampaign}
              suggestedCampaignLoading={suggestedCampaignLoading}
            />
                        </div>
                      </div>
      </div>
    </div>
  )
}
