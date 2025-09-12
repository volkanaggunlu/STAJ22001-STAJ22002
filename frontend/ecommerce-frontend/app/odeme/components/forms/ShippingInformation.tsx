"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Truck } from "lucide-react"
import React from "react"
import { useInvoiceAddresses as useInvoiceAddressesHook } from '@/hooks/useInvoiceAddresses'
import { useAuthStore } from '@/lib/store/authStore'
import { toast } from 'sonner'

interface ShippingInformationProps {
  currentStep: number
  customerType: 'bireysel' | 'firma'
  setCustomerType: (type: 'bireysel' | 'firma') => void
  subtotal: number
  useNewShippingAddress: boolean
  setUseNewShippingAddress: (use: boolean) => void
  shippingForm: any
  setShippingForm: (form: any) => void
  selectedCity: string
  setSelectedCity: (city: string) => void
  selectedDistrict: string
  setSelectedDistrict: (district: string) => void
  userAddresses: any[]
  selectedShippingAddressId: string | null
  setSelectedShippingAddressId: (id: string | null) => void
  useInvoiceAddress: boolean
  setUseInvoiceAddress: (use: boolean) => void
  invoiceForm: any
  setInvoiceForm: (form: any) => void
  invoiceAddresses: any[]
  selectedInvoiceAddressId: string | null
  setSelectedInvoiceAddressId: (id: string | null) => void
  useNewInvoiceAddress: boolean
  setUseNewInvoiceAddress: (use: boolean) => void
  formErrors: any
  validateForm: () => void
  handleNextStep: () => void
  cities: string[]
  districts: any
}

export const ShippingInformation = ({
  currentStep,
  customerType,
  setCustomerType,
  subtotal,
  useNewShippingAddress,
  setUseNewShippingAddress,
  shippingForm,
  setShippingForm,
  selectedCity,
  setSelectedCity,
  selectedDistrict,
  setSelectedDistrict,
  userAddresses,
  selectedShippingAddressId,
  setSelectedShippingAddressId,
  useInvoiceAddress,
  setUseInvoiceAddress,
  invoiceForm,
  setInvoiceForm,
  invoiceAddresses,
  selectedInvoiceAddressId,
  setSelectedInvoiceAddressId,
  useNewInvoiceAddress,
  setUseNewInvoiceAddress,
  formErrors,
  validateForm,
  handleNextStep,
  cities,
  districts
}: ShippingInformationProps) => {
  const isCompany = customerType === 'firma'

  if (currentStep !== 1) return null

  const isAuthenticated = useAuthStore.getState().isAuthenticated
  const { createAddress, reload } = useInvoiceAddressesHook(isAuthenticated)
  const [saveInvoiceAddress, setSaveInvoiceAddress] = React.useState<boolean>(false)

  async function handleSaveInvoiceAddress() {
    try {
      const payload = {
        title: `${isCompany ? 'Firma' : 'Bireysel'} Fatura Adresi` as const,
        firstName: invoiceForm.firstName,
        lastName: invoiceForm.lastName,
        email: invoiceForm.email,
        phone: invoiceForm.phone,
        address: invoiceForm.address,
        city: invoiceForm.city,
        district: invoiceForm.district,
        postalCode: invoiceForm.postalCode,
        companyName: isCompany ? invoiceForm.companyName : undefined,
        taxNumber: isCompany ? invoiceForm.taxNumber : undefined,
        taxOffice: isCompany ? invoiceForm.taxOffice : undefined,
        tckn: !isCompany ? invoiceForm.tckn : undefined,
        notes: invoiceForm.notes,
      }
      await createAddress(payload as any)
      toast.success('Fatura adresi kaydedildi')
      reload()
    } catch (e: any) {
      toast.error('Fatura adresi kaydedilemedi')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Truck className="h-5 w-5 mr-2" />
          Teslimat Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Kullanıcı Tipi Seçimi */}
        <div>
          <Label className="text-base font-medium mb-2 block">Kullanıcı Tipi</Label>
          <RadioGroup value={customerType} onValueChange={v => setCustomerType(v as 'bireysel' | 'firma')} className="flex space-x-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bireysel" id="bireysel" />
              <Label htmlFor="bireysel">Bireysel</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="firma" id="firma" />
              <Label htmlFor="firma">Firma</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Kargo Bilgilendirme Mesajı */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Truck className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h4 className="font-medium text-blue-900">Kargo Bilgisi</h4>
              <p className="text-sm text-blue-700 mt-1">
                {subtotal >= 200 
                  ? "🎉 Kargo ücretsiz! Siparişiniz ücretsiz kargo limitini aştı."
                  : `${(200 - subtotal).toFixed(2)}₺ daha alışveriş yapın, kargo ücretsiz olsun!`
                }
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Kargo şirketi siparişiniz onaylandıktan sonra belirlenir.
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div>
          <Label className="text-base font-medium mb-4 block">Teslimat Adresi</Label>
          
          {/* Kayıtlı Adres Seçimi */}
          {userAddresses.length > 0 && (
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Kayıtlı adres seçin</Label>
              <Select 
                value={selectedShippingAddressId || ''} 
                onValueChange={setSelectedShippingAddressId}
                disabled={useNewShippingAddress}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kayıtlı adres seçin" />
                </SelectTrigger>
                <SelectContent>
                  {userAddresses.map((addr: any) => (
                    <SelectItem key={addr._id} value={addr._id}>
                      {addr.title} - {addr.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Yeni Adres Girişi Seçeneği */}
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useNewShippingAddress"
                checked={useNewShippingAddress}
                onCheckedChange={(checked) => setUseNewShippingAddress(checked as boolean)}
              />
              <Label htmlFor="useNewShippingAddress" className="text-sm">
                Yeni Teslimat Adresi Gir
              </Label>
            </div>
          </div>

          {/* Yeni Adres Formu */}
          {useNewShippingAddress && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Ad *</Label>
                  <Input
                    id="firstName"
                    value={shippingForm.firstName}
                    onChange={(e) => setShippingForm({ ...shippingForm, firstName: e.target.value })}
                    onBlur={validateForm}
                    required
                  />
                  {formErrors.firstName && <span className="text-red-600 text-xs">{formErrors.firstName}</span>}
                </div>
                <div>
                  <Label htmlFor="lastName">Soyad *</Label>
                  <Input
                    id="lastName"
                    value={shippingForm.lastName}
                    onChange={(e) => setShippingForm({ ...shippingForm, lastName: e.target.value })}
                    onBlur={validateForm}
                    required
                  />
                  {formErrors.lastName && <span className="text-red-600 text-xs">{formErrors.lastName}</span>}
                </div>
                <div>
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingForm.email}
                    onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                    onBlur={validateForm}
                    required
                  />
                  {formErrors.email && <span className="text-red-600 text-xs">{formErrors.email}</span>}
                </div>
                <div>
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    onBlur={validateForm}
                    placeholder="0555 123 45 67"
                    required
                  />
                  {formErrors.phone && <span className="text-red-600 text-xs">{formErrors.phone}</span>}
                </div>
                <div>
                  <Label htmlFor="city">İl *</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="İl seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.city && <span className="text-red-600 text-xs">{formErrors.city}</span>}
                </div>
                <div>
                  <Label htmlFor="district">İlçe *</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedCity}>
                    <SelectTrigger id="district">
                      <SelectValue placeholder="İlçe seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCity &&
                        districts[selectedCity as keyof typeof districts]?.map((district: string) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {formErrors.district && <span className="text-red-600 text-xs">{formErrors.district}</span>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Adres *</Label>
                  <Textarea
                    id="address"
                    value={shippingForm.address}
                    onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                    onBlur={validateForm}
                    placeholder="Mahalle, sokak, bina no, daire no"
                    required
                  />
                  {formErrors.address && <span className="text-red-600 text-xs">{formErrors.address}</span>}
                </div>
                <div>
                  <Label htmlFor="newShippingPostalCode">Posta Kodu</Label>
                  <Input
                    id="newShippingPostalCode"
                    value={shippingForm.postalCode}
                    onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                    placeholder="34000"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="newShippingNotes">Teslimat Notu (Opsiyonel)</Label>
                  <Textarea
                    id="newShippingNotes"
                    value={shippingForm.notes}
                    onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}
                    placeholder="Kapıcıya teslim edilebilir, 3. kat..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Firma ise şirket adı ve vergi no ana formda */}
        {isCompany && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Şirket Adı *</Label>
              <Input
                id="companyName"
                value={invoiceForm.companyName}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, companyName: e.target.value })}
                onBlur={validateForm}
                required={isCompany}
              />
              {formErrors.companyName && <span className="text-red-600 text-xs">{formErrors.companyName}</span>}
            </div>
            <div>
              <Label htmlFor="taxNumber">Vergi Numarası *</Label>
              <Input
                id="taxNumber"
                value={invoiceForm.taxNumber}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, taxNumber: e.target.value })}
                onBlur={validateForm}
                required={isCompany}
              />
              {formErrors.taxNumber && <span className="text-red-600 text-xs">{formErrors.taxNumber}</span>}
            </div>
            <div>
              <Label htmlFor="taxOffice">Vergi Dairesi *</Label>
              <Input
                id="taxOffice"
                value={invoiceForm.taxOffice}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, taxOffice: e.target.value })}
                onBlur={validateForm}
                required={isCompany}
              />
              {formErrors.taxOffice && <span className="text-red-600 text-xs">{formErrors.taxOffice}</span>}
            </div>
          </div>
        )}

        {/* Bireysel için TCKN alanı */}
        {!isCompany && (
          <div>
            <Label htmlFor="tckn">TCKN *</Label>
            <Input
              id="tckn"
              value={invoiceForm.tckn}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, tckn: e.target.value })}
              onBlur={validateForm}
              required
            />
            {formErrors.tckn && <span className="text-red-600 text-xs">{formErrors.tckn}</span>}
          </div>
        )}

        {/* Invoice Address */}
        <div>
          <Label className="text-base font-medium mb-4 block">Fatura Adresi</Label>
          
          {/* Fatura adresi teslimat adresi ile aynı seçeneği */}
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useInvoiceAddress"
                checked={useInvoiceAddress}
                onCheckedChange={(checked) => setUseInvoiceAddress(checked as boolean)}
              />
              <Label htmlFor="useInvoiceAddress">Fatura adresi teslimat adresi ile aynı</Label>
            </div>
          </div>

          {!useInvoiceAddress && (
            <>
              {/* Kayıtlı Fatura Adresi Seçimi */}
              {invoiceAddresses.length > 0 && (
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Kayıtlı Fatura Adresi Seç</Label>
                  <Select 
                    value={selectedInvoiceAddressId || ''} 
                    onValueChange={setSelectedInvoiceAddressId}
                    disabled={useNewInvoiceAddress}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kayıtlı fatura adresi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoiceAddresses.map((addr: any) => (
                        <SelectItem key={addr._id} value={addr._id}>
                          {addr.title} - {addr.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Yeni Fatura Adresi Girişi Seçeneği */}
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useNewInvoiceAddress"
                    checked={useNewInvoiceAddress}
                    onCheckedChange={(checked) => setUseNewInvoiceAddress(checked as boolean)}
                  />
                  <Label htmlFor="useNewInvoiceAddress" className="text-sm">
                    Yeni Fatura Adresi Gir
                  </Label>
                </div>
              </div>

              {/* Yeni Fatura Adresi Formu */}
              {useNewInvoiceAddress && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <Label className="text-base font-medium">Fatura Adresi Bilgileri</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceFirstName">Ad *</Label>
                      <Input
                        id="invoiceFirstName"
                        value={invoiceForm.firstName}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, firstName: e.target.value })}
                        onBlur={validateForm}
                        required
                      />
                      {formErrors.invoiceFirstName && <span className="text-red-600 text-xs">{formErrors.invoiceFirstName}</span>}
                    </div>
                    <div>
                      <Label htmlFor="invoiceLastName">Soyad *</Label>
                      <Input
                        id="invoiceLastName"
                        value={invoiceForm.lastName}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, lastName: e.target.value })}
                        onBlur={validateForm}
                        required
                      />
                      {formErrors.invoiceLastName && <span className="text-red-600 text-xs">{formErrors.invoiceLastName}</span>}
                    </div>
                    <div>
                      <Label htmlFor="invoiceEmail">E-posta *</Label>
                      <Input
                        id="invoiceEmail"
                        type="email"
                        value={invoiceForm.email}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, email: e.target.value })}
                        onBlur={validateForm}
                        required
                      />
                      {formErrors.email && <span className="text-red-600 text-xs">{formErrors.email}</span>}
                    </div>
                    <div>
                      <Label htmlFor="invoicePhone">Telefon *</Label>
                      <Input
                        id="invoicePhone"
                        value={invoiceForm.phone}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, phone: e.target.value })}
                        onBlur={validateForm}
                        placeholder="0555 123 45 67"
                        required
                      />
                      {formErrors.phone && <span className="text-red-600 text-xs">{formErrors.phone}</span>}
                    </div>
                    <div>
                      <Label htmlFor="invoiceCity">İl *</Label>
                      <Select value={invoiceForm.city} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, city: value })}>
                        <SelectTrigger id="invoiceCity">
                          <SelectValue placeholder="İl seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.invoiceCity && <span className="text-red-600 text-xs">{formErrors.invoiceCity}</span>}
                    </div>
                    <div>
                      <Label htmlFor="invoiceDistrict">İlçe *</Label>
                      <Select value={invoiceForm.district} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, district: value })}>
                        <SelectTrigger id="invoiceDistrict">
                          <SelectValue placeholder="İlçe seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {invoiceForm.city && districts[invoiceForm.city as keyof typeof districts]?.map((district: string) => (
                            <SelectItem key={district} value={district}>{district}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.invoiceDistrict && <span className="text-red-600 text-xs">{formErrors.invoiceDistrict}</span>}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="invoiceAddress">Adres *</Label>
                      <Textarea
                        id="invoiceAddress"
                        value={invoiceForm.address}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, address: e.target.value })}
                        onBlur={validateForm}
                        placeholder="Mahalle, sokak, bina no"
                        required
                      />
                      {formErrors.invoiceAddress && <span className="text-red-600 text-xs">{formErrors.invoiceAddress}</span>}
                    </div>
                    <div>
                      <Label htmlFor="newInvoicePostalCode">Posta Kodu</Label>
                      <Input
                        id="newInvoicePostalCode"
                        value={invoiceForm.postalCode}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, postalCode: e.target.value })}
                        placeholder="34000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="newInvoiceNotes">Fatura Notu (Opsiyonel)</Label>
                      <Textarea
                        id="newInvoiceNotes"
                        value={invoiceForm.notes}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                        placeholder="Fatura detayları..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="saveInvoiceAddress" checked={saveInvoiceAddress} onCheckedChange={(v) => setSaveInvoiceAddress(Boolean(v))} />
                      <Label htmlFor="saveInvoiceAddress">Bu adresi kaydet</Label>
                    </div>
                    <Button type="button" variant="secondary" disabled={!saveInvoiceAddress} onClick={handleSaveInvoiceAddress}>
                      Kaydet
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Button onClick={handleNextStep} className="w-full" size="lg">
          Ödeme Bilgilerine Geç
        </Button>
      </CardContent>
    </Card>
  )
} 