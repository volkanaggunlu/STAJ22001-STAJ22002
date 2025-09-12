  'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api/client'

function SettingsPageClient() {

  type Settings = {
    storeName: string
    storeTagline?: string
    currency: string
    locale: string
    showOutOfStock: boolean
    payment: {
      paytrEnabled: boolean
      bankTransferEnabled: boolean
    }
    shipping: {
      freeShippingThreshold?: number
      defaultCarrier?: string
    }
    legal: {
      privacyUrl?: string
      termsUrl?: string
      kvkkUrl?: string
    }
    email: {
      fromName?: string
      fromEmail?: string
      orderNotification?: boolean
    }
  }

  const [settings, setSettings] = useState<Settings>({
    storeName: 'Açık Atölye',
    storeTagline: '',
    currency: 'TRY',
    locale: 'tr-TR',
    showOutOfStock: false,
    payment: { paytrEnabled: true, bankTransferEnabled: true },
    shipping: { freeShippingThreshold: undefined, defaultCarrier: '' },
    legal: { privacyUrl: '', termsUrl: '', kvkkUrl: '' },
    email: { fromName: 'Açık Atölye', fromEmail: '', orderNotification: true },
  })

  const [loading, setLoading] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await apiClient.get('/admin/settings')
        const data = res?.data?.data || res?.data
        if (data && mounted) {
          setSettings((prev: Settings) => ({ ...prev, ...data }))
        }
      } catch (_) {
        // optional endpoint; ignore if missing
      } finally {
        if (mounted) setInitialLoaded(true)
      }
    })()
    return () => { mounted = false }
  }, [])

  const saveSettings = async () => {
    setLoading(true)
    try {
      await apiClient.put('/admin/settings', settings)
    } catch (_) {
      // best-effort save; backend may not exist yet
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">Mağaza ve sistem ayarlarını yönetin</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="payments">Ödemeler</TabsTrigger>
          <TabsTrigger value="shipping">Kargo</TabsTrigger>
          <TabsTrigger value="legal">Hukuki</TabsTrigger>
          <TabsTrigger value="email">E-posta</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Mağaza Adı</label>
                  <Input value={settings.storeName} onChange={(e: any) => setSettings({ ...settings, storeName: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm">Slogan</label>
                  <Input value={settings.storeTagline} onChange={(e: any) => setSettings({ ...settings, storeTagline: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm">Para Birimi</label>
                  <Select value={settings.currency} onValueChange={(v: string) => setSettings({ ...settings, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">TRY</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm">Dil/Bölge</label>
                  <Select value={settings.locale} onValueChange={(v: string) => setSettings({ ...settings, locale: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr-TR">tr-TR</SelectItem>
                      <SelectItem value="en-US">en-US</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="showOut" checked={settings.showOutOfStock} onCheckedChange={(v: any) => setSettings({ ...settings, showOutOfStock: Boolean(v) })} />
                <label htmlFor="showOut" className="text-sm">Stokta olmayanları göster</label>
              </div>
              <div className="pt-2">
                <Button onClick={saveSettings} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Ödeme Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="paytr" checked={settings.payment.paytrEnabled} onCheckedChange={(v: any) => setSettings({ ...settings, payment: { ...settings.payment, paytrEnabled: Boolean(v) } })} />
                <label htmlFor="paytr" className="text-sm">PayTR aktif</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="bank" checked={settings.payment.bankTransferEnabled} onCheckedChange={(v: any) => setSettings({ ...settings, payment: { ...settings.payment, bankTransferEnabled: Boolean(v) } })} />
                <label htmlFor="bank" className="text-sm">Havale/EFT aktif</label>
              </div>
              <Button onClick={saveSettings} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Kargo Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Ücretsiz kargo alt limiti (₺)</label>
                  <Input
                    inputMode="numeric"
                    value={settings.shipping.freeShippingThreshold ?? ''}
                    onChange={(e: any) => setSettings({ ...settings, shipping: { ...settings.shipping, freeShippingThreshold: e.target.value ? parseInt(e.target.value.replace(/[^0-9]/g, '')) : undefined } })}
                  />
                </div>
                <div>
                  <label className="text-sm">Varsayılan kargo firması</label>
                  <Input value={settings.shipping.defaultCarrier || ''} onChange={(e: any) => setSettings({ ...settings, shipping: { ...settings.shipping, defaultCarrier: e.target.value } })} />
                </div>
              </div>
              <Button onClick={saveSettings} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Hukuki Sayfalar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Gizlilik Politikası URL</label>
                  <Input value={settings.legal.privacyUrl || ''} onChange={(e: any) => setSettings({ ...settings, legal: { ...settings.legal, privacyUrl: e.target.value } })} />
                </div>
                <div>
                  <label className="text-sm">Kullanım Şartları URL</label>
                  <Input value={settings.legal.termsUrl || ''} onChange={(e: any) => setSettings({ ...settings, legal: { ...settings.legal, termsUrl: e.target.value } })} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm">KVKK Aydınlatma Metni URL</label>
                  <Input value={settings.legal.kvkkUrl || ''} onChange={(e: any) => setSettings({ ...settings, legal: { ...settings.legal, kvkkUrl: e.target.value } })} />
                </div>
              </div>
              <Button onClick={saveSettings} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>E-posta Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Gönderen Adı</label>
                  <Input value={settings.email.fromName || ''} onChange={(e: any) => setSettings({ ...settings, email: { ...settings.email, fromName: e.target.value } })} />
                </div>
                <div>
                  <label className="text-sm">Gönderen E-posta</label>
                  <Input value={settings.email.fromEmail || ''} onChange={(e: any) => setSettings({ ...settings, email: { ...settings.email, fromEmail: e.target.value } })} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="orderNotify" checked={settings.email.orderNotification || false} onCheckedChange={(v: any) => setSettings({ ...settings, email: { ...settings.email, orderNotification: Boolean(v) } })} />
                <label htmlFor="orderNotify" className="text-sm">Yeni siparişte bilgilendirme maili gönder</label>
              </div>
              <div>
                <label className="text-sm">Test E-postası</label>
                <Textarea placeholder="Kendinize bir test e-postası gönderin" />
              </div>
              <Button onClick={saveSettings} disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="p-6">Yükleniyor...</div>}>
      <SettingsPageClient />
    </Suspense>
  )
}
