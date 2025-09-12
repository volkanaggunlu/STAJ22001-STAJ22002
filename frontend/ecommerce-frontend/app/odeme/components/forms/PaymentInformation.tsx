"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { CreditCard, Lock, AlertCircle } from "lucide-react"

interface PaymentInformationProps {
  currentStep: number
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  paymentOptions: any[]
  paymentForm: any
  setPaymentForm: (form: any) => void
  cardErrors: any
  setCardErrors: (errors: any) => void
  formErrors: any
  validateForm: () => void
  maskCardNumber: (value: string) => string
  maskExpiry: (value: string) => string
  handleNextStep: () => void
  handlePrevStep: () => void
}

export const PaymentInformation = ({
  currentStep,
  paymentMethod,
  setPaymentMethod,
  paymentOptions,
  paymentForm,
  setPaymentForm,
  cardErrors,
  setCardErrors,
  formErrors,
  validateForm,
  maskCardNumber,
  maskExpiry,
  handleNextStep,
  handlePrevStep
}: PaymentInformationProps) => {
  if (currentStep !== 2) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Ödeme Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Method */}
        <div className="space-y-4">
          <Label className="text-base font-medium mb-4 block">Ödeme Yöntemi</Label>
          
          {/* Radio Button Sistemi */}
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
            {paymentOptions.map(opt => (
              <div key={opt.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value={opt.value} id={opt.value} />
                <div className="flex-1">
                  <Label htmlFor={opt.value} className="font-medium cursor-pointer">
                    {opt.label}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {opt.value === "credit-card" && (
                    <>
                      <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">VISA</div>
                      <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">MC</div>
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">AMEX</div>
                    </>
                  )}
                  {opt.value === "bank-transfer" && (
                    <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">HAVALE</div>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>

          {/* Seçili Ödeme Yöntemi Detayları */}
          {paymentMethod === "credit-card" && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-800">Kredi Kartı ile Ödeme</h4>
              </div>
              <div className="flex items-center text-sm text-green-600 mb-4">
                <Lock className="h-4 w-4 mr-1" />
                256-bit SSL Güvenlik ile korunuyor
              </div>
              <form autoComplete="on">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="cardName">Kart Üzerindeki İsim *</Label>
                    <Input
                      id="cardName"
                      name="cardName"
                      value={paymentForm.cardName}
                      onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                      onBlur={validateForm}
                      placeholder="AHMET YILMAZ"
                      autoComplete="cc-name"
                      required
                    />
                    {formErrors.cardName && <span className="text-red-600 text-xs">{formErrors.cardName}</span>}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="cardNumber">Kart Numarası *</Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      value={paymentForm.cardNumber}
                      onChange={e => {
                        const masked = maskCardNumber(e.target.value)
                        setPaymentForm({ ...paymentForm, cardNumber: masked })
                        setCardErrors({ ...cardErrors, cardNumber: "" })
                      }}
                      onBlur={() => {
                        const value = paymentForm.cardNumber.replace(/\s/g, "")
                        if (value.length !== 16) setCardErrors(err => ({ ...err, cardNumber: "Geçerli bir kart numarası girin" }))
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      autoComplete="cc-number"
                      required
                      className={cardErrors.cardNumber ? "border-red-500" : ""}
                    />
                    {cardErrors.cardNumber && <p className="text-xs text-red-600 mt-1">{cardErrors.cardNumber}</p>}
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">Son Kullanma Tarihi *</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      value={paymentForm.expiryDate}
                      onChange={e => {
                        const masked = maskExpiry(e.target.value)
                        setPaymentForm({ ...paymentForm, expiryDate: masked })
                        setCardErrors({ ...cardErrors, expiryDate: "" })
                      }}
                      onBlur={() => {
                        if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiryDate)) setCardErrors(err => ({ ...err, expiryDate: "MM/YY formatında girin" }))
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      autoComplete="cc-exp"
                      required
                      className={cardErrors.expiryDate ? "border-red-500" : ""}
                    />
                    {cardErrors.expiryDate && <p className="text-xs text-red-600 mt-1">{cardErrors.expiryDate}</p>}
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      value={paymentForm.cvv}
                      onChange={e => {
                        setPaymentForm({ ...paymentForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })
                        setCardErrors({ ...cardErrors, cvv: "" })
                      }}
                      onBlur={() => {
                        if (paymentForm.cvv.length < 3) setCardErrors(err => ({ ...err, cvv: "Geçerli bir CVV girin" }))
                      }}
                      placeholder="123"
                      maxLength={4}
                      autoComplete="cc-csc"
                      required
                      className={cardErrors.cvv ? "border-red-500" : ""}
                    />
                    {cardErrors.cvv && <p className="text-xs text-red-600 mt-1">{cardErrors.cvv}</p>}
                  </div>
                </div>
              </form>
            </div>
          )}

          {paymentMethod === "bank-transfer" && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-3">
                <CreditCard className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800">Havale/EFT ile Ödeme</h4>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <h5 className="font-medium mb-3">Banka Bilgileri</h5>
                <div className="space-y-2 text-sm">
                  {paymentOptions.find(opt => opt.value === "bank-transfer")?.bankInfo ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Banka:</span>
                        <span>{paymentOptions.find(opt => opt.value === "bank-transfer")?.bankInfo?.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Hesap Sahibi:</span>
                        <span>{paymentOptions.find(opt => opt.value === "bank-transfer")?.bankInfo?.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">IBAN:</span>
                        <span className="font-mono">{paymentOptions.find(opt => opt.value === "bank-transfer")?.bankInfo?.iban}</span>
                      </div>
                      {paymentOptions.find(opt => opt.value === "bank-transfer")?.bankInfo?.branchCode && (
                        <div className="flex justify-between">
                          <span className="font-medium">Şube Kodu:</span>
                          <span>{paymentOptions.find(opt => opt.value === "bank-transfer")?.bankInfo?.branchCode}</span>
                        </div>
                      )}
                      <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                        <p className="text-sm text-yellow-800">
                          <strong>Açıklama:</strong> Sipariş No: #SIPARIS123
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <p>Banka bilgileri yükleniyor...</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg mt-4">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Önemli Bilgi</p>
                  <p className="text-yellow-700">
                    Havale/EFT ile yapılan ödemelerde siparişiniz ödeme onaylandıktan sonra hazırlanacaktır.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <Button variant="outline" onClick={handlePrevStep} className="flex-1 bg-transparent">
            Geri Dön
          </Button>
          <Button onClick={handleNextStep} className="flex-1">
            Sipariş Özetine Geç
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 