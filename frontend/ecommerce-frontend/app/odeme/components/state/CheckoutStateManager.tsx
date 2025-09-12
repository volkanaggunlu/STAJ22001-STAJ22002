"use client"

import { useState, useEffect } from "react"
import { useCartStore } from '@/lib/store/cartStore'
import { useAuthStore } from '@/lib/store/authStore'
import { useCouponStore } from '@/lib/store/couponStore'
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { useInvoiceAddresses } from '@/hooks/useInvoiceAddresses';
import { useLegalLinks } from '@/hooks/useLegalLinks';
import { useKvkkText } from '@/hooks/useKvkkText';
import { useApplicableCampaigns, useSuggestedCampaign } from '@/hooks/useCampaigns';
import { validateInvoiceFormWithZod } from '@/lib/validations/invoice'

const cities = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Gaziantep",
  "Mersin",
  "Diyarbakır",
]

const districts = {
  İstanbul: ["Kadıköy", "Beşiktaş", "Şişli", "Beyoğlu", "Fatih", "Üsküdar", "Bakırköy"],
  Ankara: ["Çankaya", "Keçiören", "Yenimahalle", "Mamak", "Sincan", "Altındağ"],
  İzmir: ["Konak", "Bornova", "Karşıyaka", "Buca", "Bayraklı", "Gaziemir"],
}

export const useCheckoutState = () => {
  const cartItems = useCartStore(state => state.items)
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const { code: couponCode, discount: couponDiscount, isLoading: couponLoading, error: couponError, applyCoupon, removeCoupon } = useCouponStore()

  // Step state
  const [currentStep, setCurrentStep] = useState(1)

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("credit-card")

  // Address state
  const [useInvoiceAddress, setUseInvoiceAddress] = useState(true)
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [invoiceCity, setInvoiceCity] = useState("")
  const [invoiceDistrict, setInvoiceDistrict] = useState("")
  const [useNewShippingAddress, setUseNewShippingAddress] = useState(false)
  const [useNewInvoiceAddress, setUseNewInvoiceAddress] = useState(false)
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string | null>(null)
  const [selectedInvoiceAddressId, setSelectedInvoiceAddressId] = useState<string | null>(null)

  // Customer type
  const [customerType, setCustomerType] = useState<'bireysel' | 'firma'>('bireysel')

  // Form states
  const [shippingForm, setShippingForm] = useState({
    firstName: user?.firstName || user?.name || "",
    lastName: user?.lastName || user?.surname || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.addresses?.[0]?.address || "",
    city: user?.addresses?.[0]?.city || "",
    district: user?.addresses?.[0]?.district || "",
    postalCode: "",
    notes: "",
  })

  const [invoiceForm, setInvoiceForm] = useState({
    firstName: user?.firstName || user?.name || "",
    lastName: user?.lastName || user?.surname || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.addresses?.[0]?.address || "",
    city: user?.addresses?.[0]?.city || "",
    district: user?.addresses?.[0]?.district || "",
    postalCode: "",
    companyName: "",
    taxNumber: "",
    taxOffice: "",
    tckn: "",
    notes: "",
  })

  const [paymentForm, setPaymentForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
  })

  // Legacy state (kullanılmayan)
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('')
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedInvoiceAddress, setSelectedInvoiceAddress] = useState('')
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [couponInput, setCouponInput] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  // Order state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')

  // PayTR state
  const [showPayTR, setShowPayTR] = useState(false)
  const [payTRToken, setPayTRToken] = useState('')
  const [currentOrderId, setCurrentOrderId] = useState('')

  // Consent state
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [kvkkConsent, setKvkkConsent] = useState(false)
  const [distanceSalesConsent, setDistanceSalesConsent] = useState(false)

  // Notes state
  const [customerNote, setCustomerNote] = useState("")
  const [deliveryNote, setDeliveryNote] = useState("")

  // Form errors
  const [formErrors, setFormErrors] = useState<any>({})
  const [cardErrors, setCardErrors] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
  })

  // Coupon input
  const [inputCoupon, setInputCoupon] = useState('')

  // Campaign state
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaignDiscount, setCampaignDiscount] = useState(0);

  // API hooks
  const { methods: paymentOptions, loading: paymentLoading, error: paymentError } = usePaymentMethods();
  const { addresses: userAddresses, loading: addressesLoading, error: addressesError } = useUserAddresses(isAuthenticated);
  const { invoiceAddresses, loading: invoiceLoading, error: invoiceError } = useInvoiceAddresses(isAuthenticated);
  const { links: legalLinks, loading: legalLinksLoading, error: legalLinksError } = useLegalLinks();
  const { kvkk, loading: kvkkLoading, error: kvkkError } = useKvkkText();

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = subtotal >= 200 ? 0 : 25; // 200₺ üzeri ücretsiz, altı 25₺

  // Campaign hooks
  const { campaigns: applicableCampaigns, loading: campaignsLoading, error: campaignsError } = useApplicableCampaigns(subtotal, cartItems);
  const { campaign: suggestedCampaign, loading: suggestedCampaignLoading, error: suggestedCampaignError } = useSuggestedCampaign(subtotal, cartItems);

  // Total calculation
  const total = subtotal + shippingCost - couponDiscount - campaignDiscount;

  // Steps
  const steps = [
    { id: 1, title: "Teslimat Bilgileri", icon: "Truck" },
    { id: 2, title: "Ödeme Bilgileri", icon: "CreditCard" },
    { id: 3, title: "Sipariş Özeti", icon: "CheckCircle" },
  ]

  // Step handlers
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Form validation
  const validateForm = () => {
    const errors: any = {}
    if (!shippingForm.firstName) errors.firstName = 'Ad zorunlu'
    if (!shippingForm.lastName) errors.lastName = 'Soyad zorunlu'
    if (!shippingForm.email || !shippingForm.email.includes('@')) errors.email = 'Geçerli e-posta girin'
    if (!shippingForm.phone) errors.phone = 'Telefon zorunlu'
    if (!shippingForm.address) errors.address = 'Adres zorunlu'
    if (!selectedCity) errors.city = 'İl seçin'
    if (!selectedDistrict) errors.district = 'İlçe seçin'

    // Invoice tarafı zod doğrulaması
    const invoiceErrors = validateInvoiceFormWithZod({
      customerType,
      useInvoiceAddress,
      invoiceForm,
    })
    Object.assign(errors, invoiceErrors)

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Card mask functions
  const maskCardNumber = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim()
      .slice(0, 19)
  }

  const maskExpiry = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d{1,2})/, "$1/$2")
      .slice(0, 5)
  }

  // Coupon handlers
  const handleApplyCoupon = async () => {
    if (!inputCoupon) return alert('Lütfen bir kupon kodu girin')
    await applyCoupon(inputCoupon)
    setInputCoupon('')
  }

  const handleRemoveCoupon = () => {
    removeCoupon()
  }

  // Company check
  const isCompany = customerType === 'firma'

  // useEffect hooks
  useEffect(() => {
    if (userAddresses.length > 0) {
      // Shipping method is now fixed, so we don't need to set it here.
    }
  }, [userAddresses]);

  useEffect(() => {
    if (selectedShippingAddressId && !useNewShippingAddress) {
      const addr = userAddresses.find((a: any) => a._id === selectedShippingAddressId);
      if (addr) {
        setShippingForm({
          firstName: addr.firstName || "",
          lastName: addr.lastName || "",
          email: user?.email || "",
          phone: addr.phone || "",
          address: addr.address || "",
          city: addr.city || "",
          district: addr.district || "",
          postalCode: addr.postalCode || "",
          notes: addr.notes || ""
        });
        setSelectedCity(addr.city || "");
        setSelectedDistrict(addr.district || "");
      }
    }
  }, [selectedShippingAddressId, userAddresses, useNewShippingAddress, user]);

  useEffect(() => {
    if (selectedInvoiceAddressId && !useNewInvoiceAddress) {
      const addr = invoiceAddresses.find((a: any) => a._id === selectedInvoiceAddressId);
      if (addr) {
        setInvoiceForm({
          ...invoiceForm,
          firstName: addr.firstName || "",
          lastName: addr.lastName || "",
          email: user?.email || "",
          phone: addr.phone || "",
          address: addr.address || "",
          city: addr.city || "",
          district: addr.district || "",
          postalCode: addr.postalCode || "",
          companyName: addr.companyName || "",
          taxNumber: addr.taxNumber || "",
          notes: addr.notes || ""
        });
      }
    }
  }, [selectedInvoiceAddressId, invoiceAddresses, useNewInvoiceAddress, user, invoiceForm]);

  useEffect(() => {
    if (useNewShippingAddress) {
      setSelectedShippingAddressId(null);
      setShippingForm({
        firstName: user?.firstName || user?.name || "",
        lastName: user?.lastName || user?.surname || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: "",
        city: "",
        district: "",
        postalCode: "",
        notes: "",
      });
      setSelectedCity("");
      setSelectedDistrict("");
    }
  }, [useNewShippingAddress, user]);

  useEffect(() => {
    if (useNewInvoiceAddress) {
      setSelectedInvoiceAddressId(null);
      setInvoiceForm({
        firstName: user?.firstName || user?.name || "",
        lastName: user?.lastName || user?.surname || "",
        email: user?.email || "",
        phone: user?.phone || "",
        address: "",
        city: "",
        district: "",
        postalCode: "",
        companyName: "",
        taxNumber: "",
        notes: "",
      });
    }
  }, [useNewInvoiceAddress, user]);

  useEffect(() => {
    if (selectedCampaign) {
      let discount = 0;
      
      if (selectedCampaign.discount?.type === 'percentage') {
        discount = (subtotal * selectedCampaign.discount.value) / 100;
      } else if (selectedCampaign.discount?.type === 'fixed') {
        discount = selectedCampaign.discount.value;
      } else if (selectedCampaign.discountAmount) {
        discount = selectedCampaign.discountAmount;
      }
      
      setCampaignDiscount(discount);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 [DEBUG] Kampanya İndirimi Hesaplama:', {
          selectedCampaign: selectedCampaign.name,
          discountType: selectedCampaign.discount?.type,
          discountValue: selectedCampaign.discount?.value,
          subtotal,
          calculatedDiscount: discount
        })
      }
    } else {
      setCampaignDiscount(0);
    }
  }, [selectedCampaign, subtotal]);

  return {
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
    invoiceCity,
    setInvoiceCity,
    invoiceDistrict,
    setInvoiceDistrict,
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
    setCampaignDiscount,

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
    paymentLoading,
    paymentError,
    userAddresses,
    addressesLoading,
    addressesError,
    invoiceAddresses,
    invoiceLoading,
    invoiceError,
    legalLinks,
    legalLinksLoading,
    legalLinksError,
    kvkk,
    kvkkLoading,
    kvkkError,
    cities,
    districts,
    steps,
    isCompany,

    // Handlers
    handleNextStep,
    handlePrevStep,
    validateForm,
    maskCardNumber,
    maskExpiry,
    handleApplyCoupon,
    handleRemoveCoupon,
  }
} 