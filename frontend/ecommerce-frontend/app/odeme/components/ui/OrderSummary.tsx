"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Truck, Shield, Package } from "lucide-react"
import Image from "next/image"

interface OrderSummaryProps {
  cartItems: any[]
  subtotal: number
  shippingCost: number
  couponDiscount: number
  campaignDiscount: number
  total: number
  inputCoupon: string
  setInputCoupon: (value: string) => void
  handleApplyCoupon: () => void
  handleRemoveCoupon: () => void
  couponCode?: string
  couponLoading: boolean
  couponError?: string
  applicableCampaigns: any[]
  campaignsLoading: boolean
  selectedCampaign: any
  setSelectedCampaign: (campaign: any) => void
  suggestedCampaign: any
  suggestedCampaignLoading: boolean
}

export const OrderSummary = ({
  cartItems,
  subtotal,
  shippingCost,
  couponDiscount,
  campaignDiscount,
  total,
  inputCoupon,
  setInputCoupon,
  handleApplyCoupon,
  handleRemoveCoupon,
  couponCode,
  couponLoading,
  couponError,
  applicableCampaigns,
  campaignsLoading,
  selectedCampaign,
  setSelectedCampaign,
  suggestedCampaign,
  suggestedCampaignLoading,
}: OrderSummaryProps) => {
  return (
    <>
      {/* Mobile Order Summary */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg p-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base">Sepet Toplamı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Items */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex items-center space-x-3">
                  <Image
                    src={item.product?.images?.[0]?.url || "/placeholder.svg"}
                    alt={item.product?.name || "Ürün"}
                    width={50}
                    height={50}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">{item.product?.name || "Ürün"}</p>
                    <p className="text-xs text-gray-600">Adet: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">₺{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Calculations */}
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input placeholder="Kupon kodu" value={inputCoupon} onChange={e => setInputCoupon(e.target.value)} />
                <Button onClick={handleApplyCoupon} disabled={couponLoading || !!couponCode}>Uygula</Button>
                <Button onClick={handleRemoveCoupon} disabled={!couponCode}>Kaldır</Button>
              </div>
              {couponError && <span className="text-red-600">{couponError}</span>}
              
              {/* Kampanya Önerileri */}
              {!campaignsLoading && applicableCampaigns.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Uygun Kampanyalar</h4>
                  <div className="space-y-2">
                    {applicableCampaigns.map((campaign, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{campaign.name}</p>
                          <p className="text-xs text-gray-600">{campaign.description}</p>
                          <p className="text-xs text-green-600 font-medium">
                            {campaign.discount.type === 'percentage' 
                              ? `%${campaign.discount.value} indirim` 
                              : `${campaign.discountAmount}₺ indirim`}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant={selectedCampaign?.id === campaign.id ? "default" : "outline"}
                          onClick={() => {
                            const newSelection = selectedCampaign?.id === campaign.id ? null : campaign;
                            setSelectedCampaign(newSelection);
                          }}
                        >
                          {selectedCampaign?.id === campaign.id ? 'Seçili' : 'Uygula'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* En İyi Kampanya Önerisi */}
              {!suggestedCampaignLoading && suggestedCampaign && !selectedCampaign && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">🎯 En İyi Öneri</h4>
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{suggestedCampaign.name}</p>
                      <p className="text-xs text-gray-600">{suggestedCampaign.description}</p>
                      <p className="text-xs text-green-600 font-medium">
                        {suggestedCampaign.discount.type === 'percentage' 
                          ? `%${suggestedCampaign.discount.value} indirim` 
                          : `${suggestedCampaign.discountAmount}₺ indirim`}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedCampaign(suggestedCampaign)}
                    >
                      Uygula
                    </Button>
                  </div>
                </div>
              )}
              
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
              {subtotal < 200 && (
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                  🚚 {(200 - subtotal).toFixed(2)}₺ daha ekleyin, kargo ücretsiz olsun!
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Toplam</span>
                <span>₺{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center space-x-2 text-sm">
                <Truck className="h-4 w-4 text-green-600" />
                <span>2-3 iş günü içinde teslimat</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Güvenli ödeme garantisi</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Package className="h-4 w-4 text-purple-600" />
                <span>Ücretsiz iade ve değişim</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop Order Summary */}
      <Card className="sticky top-4 hidden lg:block">
        <CardHeader>
          <CardTitle>Sepet Toplamı</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex items-center space-x-3">
                <Image
                  src={item.product?.images?.[0]?.url || "/placeholder.svg"}
                  alt={item.product?.name || "Ürün"}
                  width={50}
                  height={50}
                  className="rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">{item.product?.name || "Ürün"}</p>
                  <p className="text-xs text-gray-600">Adet: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">₺{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Calculations */}
          <div className="space-y-2">
            <div className="flex space-x-2">
             {/*  <Input placeholder="Kupon kodu" value={inputCoupon} onChange={e => setInputCoupon(e.target.value)} />
              <Button onClick={handleApplyCoupon} disabled={couponLoading || !!couponCode}>Uygula</Button>
              <Button onClick={handleRemoveCoupon} disabled={!couponCode}>Kaldır</Button>*/}
            </div>
            {couponError && <span className="text-red-600">{couponError}</span>}
            
            {/* Kampanya Önerileri */}
            {!campaignsLoading && applicableCampaigns.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Uygun Kampanyalar</h4>
                <div className="space-y-2">
                  {applicableCampaigns.map((campaign, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{campaign.name}</p>
                        <p className="text-xs text-gray-600">{campaign.description}</p>
                        <p className="text-xs text-green-600 font-medium">
                          {campaign.discount.type === 'percentage' 
                            ? `%${campaign.discount.value} indirim` 
                            : `${campaign.discountAmount}₺ indirim`}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant={selectedCampaign?.id === campaign.id ? "default" : "outline"}
                        onClick={() => {
                          const newSelection = selectedCampaign?.id === campaign.id ? null : campaign;
                          setSelectedCampaign(newSelection);
                        }}
                      >
                        {selectedCampaign?.id === campaign.id ? 'Seçili' : 'Uygula'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* En İyi Kampanya Önerisi */}
            {!suggestedCampaignLoading && suggestedCampaign && !selectedCampaign && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">🎯 En İyi Öneri</h4>
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{suggestedCampaign.name}</p>
                    <p className="text-xs text-gray-600">{suggestedCampaign.description}</p>
                    <p className="text-xs text-green-600 font-medium">
                      {suggestedCampaign.discount.type === 'percentage' 
                        ? `%${suggestedCampaign.discount.value} indirim` 
                        : `${suggestedCampaign.discountAmount}₺ indirim`}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedCampaign(suggestedCampaign)}
                  >
                    Uygula
                  </Button>
                </div>
              </div>
            )}
            
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
            {subtotal < 200 && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                🚚 {(200 - subtotal).toFixed(2)}₺ daha ekleyin, kargo ücretsiz olsun!
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Toplam</span>
              <span>₺{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm">
              <Truck className="h-4 w-4 text-green-600" />
              <span>2-3 iş günü içinde teslimat</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Güvenli ödeme garantisi</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Package className="h-4 w-4 text-purple-600" />
              <span>Ücretsiz iade ve değişim</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
} 