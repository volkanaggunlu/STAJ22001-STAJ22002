'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  MapPin, 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Home,
  Briefcase,
  Star
} from "lucide-react"
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/authStore'
import { useUserAddresses } from '@/hooks/useUserAddresses'
import { useInvoiceAddresses } from '@/hooks/useInvoiceAddresses'
import { useAuth } from '@/lib/hooks/useAuth'
import { apiClient } from '@/lib/api/client'
import { toast } from 'sonner'

const cities = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Mersin", "Diyarbakır"
]

const districts = {
  İstanbul: ["Kadıköy", "Beşiktaş", "Şişli", "Beyoğlu", "Fatih", "Üsküdar", "Bakırköy"],
  Ankara: ["Çankaya", "Keçiören", "Yenimahalle", "Mamak", "Sincan", "Altındağ"],
  İzmir: ["Konak", "Bornova", "Karşıyaka", "Buca", "Bayraklı", "Gaziemir"],
}

interface AddressForm {
  title: string
  address: string
  city: string
  district: string
  postalCode: string
  phone: string
  isDefault: boolean
  companyName?: string
  taxNumber?: string
}

export default function AddressesPage() {
  const { isAuthenticated } = useAuthStore()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('shipping')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState<AddressForm>({
    title: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    phone: '',
    isDefault: false,
    companyName: '',
    taxNumber: ''
  })

  // Hooks
  const { addresses: shippingAddresses, loading: shippingLoading, error: shippingError } = useUserAddresses(isAuthenticated)
  const { invoiceAddresses, loading: invoiceLoading, error: invoiceError } = useInvoiceAddresses(isAuthenticated)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Form validasyonu
    if (!formData.title || !formData.address || !formData.city || !formData.district || !formData.postalCode || !formData.phone) {
      toast.error('Lütfen tüm zorunlu alanları doldurun')
      setIsLoading(false)
      return
    }

    // Fatura adresi için şirket bilgileri kontrolü
    if (activeTab === 'invoice' && (!formData.companyName || !formData.taxNumber)) {
      toast.error('Fatura adresi için şirket adı ve vergi numarası zorunludur')
      setIsLoading(false)
      return
    }

    try {
      const endpoint = activeTab === 'shipping' ? '/users/addresses' : '/users/invoice-addresses'
      const method = editingAddress ? 'PUT' : 'POST'
      const url = editingAddress ? `${endpoint}/${editingAddress._id}` : endpoint

      // Backend'in beklediği format ile uyumlu veri hazırla
      const addressData = {
        title: formData.title,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        postalCode: formData.postalCode,
        phone: formData.phone,
        isDefault: formData.isDefault,
        ...(activeTab === 'invoice' ? {
          companyName: formData.companyName || '',
          taxNumber: formData.taxNumber || ''
        } : {})
      }

      // Debug: Gönderilen veriyi logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Gönderilen adres verisi:', addressData)
        console.log('[DEBUG] Endpoint:', url)
        console.log('[DEBUG] Method:', method)
        console.log('[DEBUG] Active Tab:', activeTab)
      }

      const response = await apiClient.request({
        url,
        method,
        data: addressData
      })

      const data = response.data

      if (data.success) {
        toast.success(editingAddress ? 'Adres güncellendi' : 'Adres eklendi')
        setIsDialogOpen(false)
        setEditingAddress(null)
        resetForm()
        // Sayfayı yenile
        window.location.reload()
      } else {
        toast.error(data.error?.message || 'Bir hata oluştu')
      }
    } catch (error: any) {
      // Debug: Hata detaylarını logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Adres ekleme hatası:', error)
        console.log('[DEBUG] Hata response:', error.response?.data)
        console.log('[DEBUG] Hata status:', error.response?.status)
        console.log('[DEBUG] Hata message:', error.response?.data?.error)
      }
      toast.error('Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (address: any) => {
    setEditingAddress(address)
    setFormData({
      title: address.title || '',
      address: address.address || '',
      city: address.city || '',
      district: address.district || '',
      postalCode: address.postalCode || '',
      phone: address.phone || '',
      isDefault: address.isDefault || false,
      companyName: address.companyName || '',
      taxNumber: address.taxNumber || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) return

    try {
      const endpoint = activeTab === 'shipping' ? '/users/addresses' : '/users/invoice-addresses'
      const response = await apiClient.request({
        url: `${endpoint}/${addressId}`,
        method: 'DELETE'
      })

      const data = response.data

      if (data.success) {
        toast.success('Adres silindi')
        // Sayfayı yenile
        window.location.reload()
      } else {
        toast.error(data.error?.message || 'Bir hata oluştu')
      }
    } catch (error) {
      toast.error('Bir hata oluştu')
    }
  }

  const handleAddNew = () => {
    setEditingAddress(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      address: '',
      city: '',
      district: '',
      postalCode: '',
      phone: '',
      isDefault: false,
      companyName: '',
      taxNumber: ''
    })
  }

  const getAddressIcon = (title: string) => {
    if (title.toLowerCase().includes('ev') || title.toLowerCase().includes('home')) return <Home className="h-4 w-4" />
    if (title.toLowerCase().includes('iş') || title.toLowerCase().includes('work')) return <Briefcase className="h-4 w-4" />
    return <MapPin className="h-4 w-4" />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/hesabim">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Adreslerim</h1>
              <p className="text-gray-600 mt-1">Teslimat ve fatura adreslerinizi yönetin</p>
            </div>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Adres Ekle
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shipping" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Teslimat Adresleri</span>
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Fatura Adresleri</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shipping" className="space-y-4">
            {shippingLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Adresler yükleniyor...</p>
              </div>
            ) : shippingError ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-red-600">
                    <p>{shippingError}</p>
                  </div>
                </CardContent>
              </Card>
            ) : shippingAddresses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz teslimat adresi eklenmemiş</h3>
                    <p className="text-gray-600 mb-4">İlk teslimat adresinizi ekleyerek alışverişe başlayabilirsiniz</p>
                    <Button onClick={handleAddNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      İlk Adresi Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shippingAddresses.map((address: any) => (
                  <Card key={address._id} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 mb-3">
                          {getAddressIcon(address.title)}
                          <h3 className="font-medium">{address.title}</h3>
                          {address.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Varsayılan
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(address._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                        <p className="text-gray-600">{address.address}</p>
                        <p className="text-gray-600">{address.district}, {address.city} {address.postalCode}</p>
                        <p className="text-gray-600">{address.phone}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoice" className="space-y-4">
            {invoiceLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Adresler yükleniyor...</p>
              </div>
            ) : invoiceError ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-red-600">
                    <p>{invoiceError}</p>
                  </div>
                </CardContent>
              </Card>
            ) : invoiceAddresses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz fatura adresi eklenmemiş</h3>
                    <p className="text-gray-600 mb-4">İlk fatura adresinizi ekleyerek alışverişe başlayabilirsiniz</p>
                    <Button onClick={handleAddNew}>
                      <Plus className="h-4 w-4 mr-2" />
                      İlk Adresi Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoiceAddresses.map((address: any) => (
                  <Card key={address._id} className="relative">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 mb-3">
                          {getAddressIcon(address.title)}
                          <h3 className="font-medium">{address.title}</h3>
                          {address.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Varsayılan
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(address._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                        {address.companyName && (
                          <p className="text-gray-600">{address.companyName}</p>
                        )}
                        {address.taxNumber && (
                          <p className="text-gray-600">Vergi No: {address.taxNumber}</p>
                        )}
                        <p className="text-gray-600">{address.address}</p>
                        <p className="text-gray-600">{address.district}, {address.city} {address.postalCode}</p>
                        <p className="text-gray-600">{address.phone}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Address Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Adres Başlığı *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ev, İş, vb."
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => handleInputChange('isDefault', !!checked)}
                  />
                  <Label htmlFor="isDefault">Varsayılan adres</Label>
                </div>
              </div>

              {activeTab === 'invoice' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Şirket Adı *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxNumber">Vergi Numarası *</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber}
                      onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="address">Adres *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Sokak, mahalle, bina no"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">İl *</Label>
                  <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="İl seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="district">İlçe *</Label>
                  <Select value={formData.district} onValueChange={(value) => handleInputChange('district', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="İlçe seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.city && districts[formData.city as keyof typeof districts]?.map(district => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postalCode">Posta Kodu *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    placeholder="34000"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+90 555 123 4567"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Kaydediliyor...' : (editingAddress ? 'Güncelle' : 'Kaydet')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 