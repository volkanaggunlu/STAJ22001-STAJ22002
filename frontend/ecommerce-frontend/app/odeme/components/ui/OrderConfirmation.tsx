"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Lock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface OrderConfirmationProps {
  currentStep: number
  cartItems: any[]
  subtotal: number
  shippingCost: number
  couponDiscount: number
  campaignDiscount: number
  total: number
  agreeTerms: boolean
  setAgreeTerms: (value: boolean) => void
  kvkkConsent: boolean
  setKvkkConsent: (value: boolean) => void
  distanceSalesConsent: boolean
  setDistanceSalesConsent: (value: boolean) => void
  agreeMarketing: boolean
  setAgreeMarketing: (value: boolean) => void
  isPlacingOrder: boolean
  orderError: string
  handlePlaceOrder: () => void
  handlePrevStep: () => void
  legalLinks: any
  legalLinksLoading: boolean
  legalLinksError?: string
  kvkk: any
  kvkkLoading: boolean
  kvkkError?: string
}

export const OrderConfirmation = ({
  currentStep,
  cartItems,
  subtotal,
  shippingCost,
  couponDiscount,
  campaignDiscount,
  total,
  agreeTerms,
  setAgreeTerms,
  kvkkConsent,
  setKvkkConsent,
  distanceSalesConsent,
  setDistanceSalesConsent,
  agreeMarketing,
  setAgreeMarketing,
  isPlacingOrder,
  orderError,
  handlePlaceOrder,
  handlePrevStep,
  legalLinks,
  legalLinksLoading,
  legalLinksError,
  kvkk,
  kvkkLoading,
  kvkkError
}: OrderConfirmationProps) => {
  if (currentStep !== 3) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Sipariş Özeti
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Items */}
        <div>
          <h4 className="font-medium mb-4">Sipariş Detayları</h4>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <Image
                  src={item.product?.images?.[0]?.url || "/placeholder.svg"}
                  alt={item.product?.name || "Ürün"}
                  width={60}
                  height={60}
                  className="rounded"
                />
                <div className="flex-1">
                  <h5 className="font-medium">{item.product?.name || "Ürün"}</h5>
                  <p className="text-sm text-gray-600">Adet: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₺{(item.price * item.quantity).toFixed(2)}</p>
                  {item.originalPrice && (
                    <p className="text-sm text-gray-500 line-through">₺{(item.originalPrice * item.quantity).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hesaplamalar ve toplamlar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Ara Toplam</span>
            <span>₺{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Kargo</span>
            <span>{shippingCost === 0 ? "Ücretsiz" : `₺${shippingCost.toFixed(2)}`}</span>
          </div>
          {/*
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Kupon İndirimi</span>
              <span>-₺{couponDiscount.toFixed(2)}</span>
            </div>
          )}
          */}
          {campaignDiscount > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Kampanya İndirimi</span>
              <span>-₺{campaignDiscount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Toplam</span>
            <span>₺{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Yasal Onaylar */}
        <div className="space-y-3">
          {/* Kullanım Şartları ve Gizlilik Politikası */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeTerms"
              checked={agreeTerms}
              onCheckedChange={(checked: boolean | string) => setAgreeTerms(!!checked)}
              required
            />
            <Label htmlFor="agreeTerms" className="text-sm leading-relaxed">
              {/* Her zaman dahili rotalara yönlendir */}
              <>
                <Link href="/kullanim-kosullari" className="text-blue-600 hover:underline">Kullanım Koşulları</Link>
                'nı ve{' '}
                <Link href="/gizlilik-politikasi" className="text-blue-600 hover:underline">Gizlilik Politikası</Link>
                'nı okudum, kabul ediyorum. *
              </>
            </Label>
          </div>

          {/* KVKK */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="kvkkConsent"
              checked={kvkkConsent}
              onCheckedChange={(checked: boolean | string) => setKvkkConsent(!!checked)}
              required
            />
            <Label htmlFor="kvkkConsent" className="text-sm leading-relaxed">
              {kvkkLoading ? (
                <span>KVKK metni yükleniyor...</span>
              ) : kvkkError ? (
                <span className="text-red-600">{kvkkError}</span>
              ) : kvkk ? (
                <>
                  <Link href="/kvkk-aydinlatma-metni" className="text-blue-600 hover:underline">KVKK Aydınlatma Metni</Link>
                  'ni okudum, {kvkk.consentText || 'kişisel verilerimin işlenmesine onay veriyorum.'}
                </>
              ) : (
                <>KVKK Aydınlatma Metni'ni okudum, kişisel verilerimin işlenmesine onay veriyorum.*</>
              )}
            </Label>
          </div>

          {/* Mesafeli Satış Sözleşmesi */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="distanceSalesConsent"
              checked={distanceSalesConsent}
              onCheckedChange={(checked: boolean | string) => setDistanceSalesConsent(!!checked)}
              required
            />
            <Label htmlFor="distanceSalesConsent" className="text-sm leading-relaxed">
              {/* Her zaman dahili rotaya yönlendir */}
              <>
                <Link href="/mesafeli-satis-sozlesmesi" className="text-blue-600 hover:underline">Mesafeli Satış Sözleşmesi</Link>
                'ni okudum, kabul ediyorum. *
              </>
            </Label>
          </div>

          {/* Pazarlama izni */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeMarketing"
              checked={agreeMarketing}
              onCheckedChange={(checked: boolean | string) => setAgreeMarketing(!!checked)}
            />
            <Label htmlFor="agreeMarketing" className="text-sm leading-relaxed">
              Kampanya, promosyon ve yeni ürün bilgilerinden haberdar olmak istiyorum.
            </Label>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex space-x-4">
          <Button variant="outline" onClick={handlePrevStep} className="flex-1 bg-transparent">
            Geri Dön
          </Button>
          <Button onClick={handlePlaceOrder} className="flex-1" disabled={!agreeTerms || isPlacingOrder} size="lg">
            {isPlacingOrder ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            Siparişi Tamamla
          </Button>
        </div>
        {orderError && <span className="text-red-600">{orderError}</span>}
      </CardContent>
    </Card>
  )
} 