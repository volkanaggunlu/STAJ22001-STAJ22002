"use client"

import { toast } from 'sonner'

export interface ValidationError {
  field: string
  message: string
  step: number
  tab?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  firstError?: ValidationError
}

export const useCheckoutValidation = () => {
  // Sepet validasyonu
  const validateCart = (cartItems: any[]): ValidationResult => {
    const errors: ValidationError[] = []

    if (!cartItems || cartItems.length === 0) {
      errors.push({
        field: 'cart',
        message: 'Sepetiniz boş. Sipariş vermek için önce ürün ekleyin.',
        step: 0,
        tab: 'cart'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      firstError: errors[0]
    }
  }

  // Step 1: Shipping Information validasyonu
  const validateShippingStep = (data: {
    customerType: 'bireysel' | 'firma'
    shippingForm: any
    selectedCity: string
    selectedDistrict: string
    useNewShippingAddress: boolean
    selectedShippingAddressId: string | null
    useInvoiceAddress: boolean
    invoiceForm: any
    useNewInvoiceAddress: boolean
    selectedInvoiceAddressId: string | null
  }): ValidationResult => {
    const errors: ValidationError[] = []

    // Teslimat adresi validasyonu
    if (data.useNewShippingAddress) {
      if (!data.shippingForm.firstName?.trim()) {
        errors.push({
          field: 'firstName',
          message: 'Teslimat adresi için ad bilgisi zorunludur',
          step: 1,
          tab: 'shipping'
        })
      }

      if (!data.shippingForm.lastName?.trim()) {
        errors.push({
          field: 'lastName',
          message: 'Teslimat adresi için soyad bilgisi zorunludur',
          step: 1,
          tab: 'shipping'
        })
      }

      if (!data.shippingForm.email?.trim() || !data.shippingForm.email.includes('@')) {
        errors.push({
          field: 'email',
          message: 'Geçerli bir e-posta adresi giriniz',
          step: 1,
          tab: 'shipping'
        })
      }

      if (!data.shippingForm.phone?.trim()) {
        errors.push({
          field: 'phone',
          message: 'Telefon numarası zorunludur',
          step: 1,
          tab: 'shipping'
        })
      }

      if (!data.selectedCity) {
        errors.push({
          field: 'city',
          message: 'İl seçimi zorunludur',
          step: 1,
          tab: 'shipping'
        })
      }

      if (!data.selectedDistrict) {
        errors.push({
          field: 'district',
          message: 'İlçe seçimi zorunludur',
          step: 1,
          tab: 'shipping'
        })
      }

      if (!data.shippingForm.address?.trim()) {
        errors.push({
          field: 'address',
          message: 'Adres bilgisi zorunludur',
          step: 1,
          tab: 'shipping'
        })
      }
    } else {
      // Kayıtlı adres seçimi kontrolü
      if (!data.selectedShippingAddressId) {
        errors.push({
          field: 'shippingAddress',
          message: 'Teslimat adresi seçimi zorunludur',
          step: 1,
          tab: 'shipping'
        })
      }
    }

    // Firma validasyonu
    if (data.customerType === 'firma') {
      if (!data.invoiceForm.companyName?.trim()) {
        errors.push({
          field: 'companyName',
          message: 'Şirket adı zorunludur',
          step: 1,
          tab: 'invoice'
        })
      }

      if (!data.invoiceForm.taxNumber?.trim()) {
        errors.push({
          field: 'taxNumber',
          message: 'Vergi numarası zorunludur',
          step: 1,
          tab: 'invoice'
        })
      }
    }

    // Fatura adresi validasyonu (eğer teslimat adresi ile aynı değilse)
    if (!data.useInvoiceAddress) {
      if (data.useNewInvoiceAddress) {
        if (!data.invoiceForm.firstName?.trim()) {
          errors.push({
            field: 'invoiceFirstName',
            message: 'Fatura adresi için ad bilgisi zorunludur',
            step: 1,
            tab: 'invoice'
          })
        }

        if (!data.invoiceForm.lastName?.trim()) {
          errors.push({
            field: 'invoiceLastName',
            message: 'Fatura adresi için soyad bilgisi zorunludur',
            step: 1,
            tab: 'invoice'
          })
        }

        if (!data.invoiceForm.email?.trim() || !data.invoiceForm.email.includes('@')) {
          errors.push({
            field: 'invoiceEmail',
            message: 'Fatura adresi için geçerli bir e-posta adresi giriniz',
            step: 1,
            tab: 'invoice'
          })
        }

        if (!data.invoiceForm.phone?.trim()) {
          errors.push({
            field: 'invoicePhone',
            message: 'Fatura adresi için telefon numarası zorunludur',
            step: 1,
            tab: 'invoice'
          })
        }

        if (!data.invoiceForm.city?.trim()) {
          errors.push({
            field: 'invoiceCity',
            message: 'Fatura adresi için il seçimi zorunludur',
            step: 1,
            tab: 'invoice'
          })
        }

        if (!data.invoiceForm.district?.trim()) {
          errors.push({
            field: 'invoiceDistrict',
            message: 'Fatura adresi için ilçe seçimi zorunludur',
            step: 1,
            tab: 'invoice'
          })
        }

        if (!data.invoiceForm.address?.trim()) {
          errors.push({
            field: 'invoiceAddress',
            message: 'Fatura adresi bilgisi zorunludur',
            step: 1,
            tab: 'invoice'
          })
        }
      } else {
        // Kayıtlı fatura adresi seçimi kontrolü
        if (!data.selectedInvoiceAddressId) {
          errors.push({
            field: 'invoiceAddress',
            message: 'Fatura adresi seçimi zorunludur',
            step: 1,
            tab: 'invoice'
          })
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      firstError: errors[0]
    }
  }

  // Step 2: Payment Information validasyonu
  const validatePaymentStep = (data: {
    paymentMethod: string
    paymentForm: any
  }): ValidationResult => {
    const errors: ValidationError[] = []

    if (data.paymentMethod === 'credit-card') {
      if (!data.paymentForm.cardName?.trim()) {
        errors.push({
          field: 'cardName',
          message: 'Kart üzerindeki isim zorunludur',
          step: 2,
          tab: 'payment'
        })
      }

      if (!data.paymentForm.cardNumber?.replace(/\s/g, '') || data.paymentForm.cardNumber.replace(/\s/g, '').length !== 16) {
        errors.push({
          field: 'cardNumber',
          message: 'Geçerli bir kart numarası giriniz',
          step: 2,
          tab: 'payment'
        })
      }

      if (!data.paymentForm.expiryDate || !/^\d{2}\/\d{2}$/.test(data.paymentForm.expiryDate)) {
        errors.push({
          field: 'expiryDate',
          message: 'Geçerli bir son kullanma tarihi giriniz (MM/YY)',
          step: 2,
          tab: 'payment'
        })
      }

      if (!data.paymentForm.cvv || data.paymentForm.cvv.length < 3) {
        errors.push({
          field: 'cvv',
          message: 'Geçerli bir CVV giriniz',
          step: 2,
          tab: 'payment'
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      firstError: errors[0]
    }
  }

  // Step 3: Order Confirmation validasyonu
  const validateOrderStep = (data: {
    agreeTerms: boolean
    kvkkConsent: boolean
    distanceSalesConsent: boolean
  }): ValidationResult => {
    const errors: ValidationError[] = []

    if (!data.agreeTerms) {
      errors.push({
        field: 'agreeTerms',
        message: 'Kullanım şartları ve gizlilik politikasını kabul etmelisiniz',
        step: 3,
        tab: 'consent'
      })
    }

    if (!data.kvkkConsent) {
      errors.push({
        field: 'kvkkConsent',
        message: 'KVKK aydınlatma metnini kabul etmelisiniz',
        step: 3,
        tab: 'consent'
      })
    }

    if (!data.distanceSalesConsent) {
      errors.push({
        field: 'distanceSalesConsent',
        message: 'Mesafeli satış sözleşmesini kabul etmelisiniz',
        step: 3,
        tab: 'consent'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      firstError: errors[0]
    }
  }

  // Genel validasyon fonksiyonu
  const validateAllSteps = (data: {
    currentStep: number
    customerType: 'bireysel' | 'firma'
    cartItems: any[]
    shippingForm: any
    selectedCity: string
    selectedDistrict: string
    useNewShippingAddress: boolean
    selectedShippingAddressId: string | null
    useInvoiceAddress: boolean
    invoiceForm: any
    useNewInvoiceAddress: boolean
    selectedInvoiceAddressId: string | null
    paymentMethod: string
    paymentForm: any
    agreeTerms: boolean
    kvkkConsent: boolean
    distanceSalesConsent: boolean
  }): ValidationResult => {
    const allErrors: ValidationError[] = []

    // Sepet validasyonu
    const cartResult = validateCart(data.cartItems)
    allErrors.push(...cartResult.errors)

    // Step 1 validasyonu
    const step1Result = validateShippingStep({
      customerType: data.customerType,
      shippingForm: data.shippingForm,
      selectedCity: data.selectedCity,
      selectedDistrict: data.selectedDistrict,
      useNewShippingAddress: data.useNewShippingAddress,
      selectedShippingAddressId: data.selectedShippingAddressId,
      useInvoiceAddress: data.useInvoiceAddress,
      invoiceForm: data.invoiceForm,
      useNewInvoiceAddress: data.useNewInvoiceAddress,
      selectedInvoiceAddressId: data.selectedInvoiceAddressId
    })
    allErrors.push(...step1Result.errors)

    // Step 2 validasyonu
    const step2Result = validatePaymentStep({
      paymentMethod: data.paymentMethod,
      paymentForm: data.paymentForm
    })
    allErrors.push(...step2Result.errors)

    // Step 3 validasyonu
    const step3Result = validateOrderStep({
      agreeTerms: data.agreeTerms,
      kvkkConsent: data.kvkkConsent,
      distanceSalesConsent: data.distanceSalesConsent
    })
    allErrors.push(...step3Result.errors)

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      firstError: allErrors[0]
    }
  }

  // Toast mesajları ile validasyon ve tab yönlendirme
  const validateWithToast = (validationResult: ValidationResult, setCurrentStep: (step: number) => void): boolean => {
    if (validationResult.isValid) {
      return true
    }

    // İlk hatayı göster
    const firstError = validationResult.firstError
    if (firstError) {
      // Toast mesajı göster
      toast.error(firstError.message, {
        duration: 4000,
        action: {
          label: 'Düzelt',
          onClick: () => {
            // İlgili step'e yönlendir
            setCurrentStep(firstError.step)
            
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

      // İlgili step'e yönlendir
      setCurrentStep(firstError.step)
    }

    return false
  }

  // Step bazlı validasyon ve tab yönlendirme
  const validateCurrentStep = (data: {
    currentStep: number
    customerType: 'bireysel' | 'firma'
    shippingForm: any
    selectedCity: string
    selectedDistrict: string
    useNewShippingAddress: boolean
    selectedShippingAddressId: string | null
    useInvoiceAddress: boolean
    invoiceForm: any
    useNewInvoiceAddress: boolean
    selectedInvoiceAddressId: string | null
    paymentMethod: string
    paymentForm: any
    agreeTerms: boolean
    kvkkConsent: boolean
    distanceSalesConsent: boolean
  }, setCurrentStep: (step: number) => void): boolean => {
    let validationResult: ValidationResult

    switch (data.currentStep) {
      case 1:
        validationResult = validateShippingStep({
          customerType: data.customerType,
          shippingForm: data.shippingForm,
          selectedCity: data.selectedCity,
          selectedDistrict: data.selectedDistrict,
          useNewShippingAddress: data.useNewShippingAddress,
          selectedShippingAddressId: data.selectedShippingAddressId,
          useInvoiceAddress: data.useInvoiceAddress,
          invoiceForm: data.invoiceForm,
          useNewInvoiceAddress: data.useNewInvoiceAddress,
          selectedInvoiceAddressId: data.selectedInvoiceAddressId
        })
        break
      case 2:
        validationResult = validatePaymentStep({
          paymentMethod: data.paymentMethod,
          paymentForm: data.paymentForm
        })
        break
      case 3:
        validationResult = validateOrderStep({
          agreeTerms: data.agreeTerms,
          kvkkConsent: data.kvkkConsent,
          distanceSalesConsent: data.distanceSalesConsent
        })
        break
      default:
        return true
    }

    return validateWithToast(validationResult, setCurrentStep)
  }

  // Tab navigasyon kontrolü - hangi step'lere gidilebilir
  const canNavigateToStep = (data: {
    currentStep: number
    customerType: 'bireysel' | 'firma'
    shippingForm: any
    selectedCity: string
    selectedDistrict: string
    useNewShippingAddress: boolean
    selectedShippingAddressId: string | null
    useInvoiceAddress: boolean
    invoiceForm: any
    useNewInvoiceAddress: boolean
    selectedInvoiceAddressId: string | null
    paymentMethod: string
    paymentForm: any
    agreeTerms: boolean
    kvkkConsent: boolean
    distanceSalesConsent: boolean
  }, targetStep: number): boolean => {
    // Mevcut step'ten geriye gidebilir
    if (targetStep < data.currentStep) {
      return true
    }

    // İleri gitmek için önceki step'lerin tamamlanmış olması gerekir
    for (let step = 1; step < targetStep; step++) {
      let stepValidationResult: ValidationResult

      switch (step) {
        case 1:
          stepValidationResult = validateShippingStep({
            customerType: data.customerType,
            shippingForm: data.shippingForm,
            selectedCity: data.selectedCity,
            selectedDistrict: data.selectedDistrict,
            useNewShippingAddress: data.useNewShippingAddress,
            selectedShippingAddressId: data.selectedShippingAddressId,
            useInvoiceAddress: data.useInvoiceAddress,
            invoiceForm: data.invoiceForm,
            useNewInvoiceAddress: data.useNewInvoiceAddress,
            selectedInvoiceAddressId: data.selectedInvoiceAddressId
          })
          break
        case 2:
          stepValidationResult = validatePaymentStep({
            paymentMethod: data.paymentMethod,
            paymentForm: data.paymentForm
          })
          break
        default:
          stepValidationResult = { isValid: true, errors: [] }
      }

      if (!stepValidationResult.isValid) {
        return false
      }
    }

    return true
  }

  return {
    validateCart,
    validateShippingStep,
    validatePaymentStep,
    validateOrderStep,
    validateAllSteps,
    validateCurrentStep,
    validateWithToast,
    canNavigateToStep
  }
} 