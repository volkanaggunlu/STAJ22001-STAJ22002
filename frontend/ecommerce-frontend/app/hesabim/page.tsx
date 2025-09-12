'use client'

import { AuthGuard } from '@/app/components/ProtectedRoute'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye,EyeOff,Lock} from 'lucide-react'
import { changePasswordSchema } from '@/lib/validations/auth';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Settings,
  Edit,
  Package,
  Heart,
  CreditCard,
  Save,
  X,
  MapPin
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { useOrders } from '@/hooks/useOrders'
import { useUserFavorites } from '@/hooks/useUserFavorites'
import { useCart } from '@/lib/store/cartStore'

function HesabimPageContent() {
  const { user, logout, isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const API_URL = process.env.NEXT_PUBLIC_API_URL!

  // Summary data hooks
  const { orders, pagination } = useOrders(API_URL, 1, 1)
  const { favorites } = useUserFavorites(!!isAuthenticated)
  const { totalItems: cartItemCount } = useCart()
  
  // Düzenleme için kullanılacak state
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    gender: user?.gender || 'male'
  })

  const handleInputChange = (field:string, value:any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError('')
      
      // API çağrısı
      const response = await fetch('http://localhost:8080/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firstName: editData.firstName,
          lastName: editData.lastName,
          phone: editData.phone,
          gender: editData.gender
        })
      })
      console.log('Sunucudan dönen status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Sunucudan hata cevabı:', errorData);
        throw new Error(errorData.message ||'Profil güncelleme başarısız')
      }

      const result = await response.json()
      console.log('yanıt:', result);
      
      // Başarılı güncelleme sonrası user state'ini güncelle
      
      setIsEditing(false)
      setSuccess('Profil başarıyla güncellendi')
      
      // Başarı mesajını 3 saniye sonra temizle
      setTimeout(() => setSuccess(''), 3000)
      
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      gender: user?.gender || 'male'
    })
    setIsEditing(false)
    setError('')
  }

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
    setSuccess('')
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Kullanıcı bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Şifre değiştirme bölümü

    const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
    })

    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);


    const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
    setPasswordError('')
    }



    const handlePasswordSubmit = async () => {
      try {
        setLoading(true);
        setPasswordError('');
        setPasswordSuccess('');

        // Frontend validasyonu
        const validationResult = changePasswordSchema.safeParse(passwordData);
        if (!validationResult.success) {
          const firstError = validationResult.error.errors[0];
          setPasswordError(firstError.message);
          setLoading(false);
          return;
        }

        // API isteği
        const response = await fetch('http://localhost:8080/api/users/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.details && errorData.details.length > 0) {
            const messages = errorData.details.map((d: any) => d.message).join(' ');
            setPasswordError(messages);
          } else {
            setPasswordError(errorData.message || 'Şifre değiştirme başarısız');
          }
          setLoading(false);
          return;
        }

        setPasswordSuccess('Şifre başarıyla değiştirildi');
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setTimeout(() => setPasswordSuccess(''), 3000);
      } catch (err: any) {
        setPasswordError(err.message || 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Hesabım
        </h1>
        <p className="text-gray-600">
          Hesap bilgilerinizi görüntüleyin ve yönetin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Profile Card */}
        <div className="lg:col-span-2 space y-8">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profil Bilgileri
              </CardTitle>
              <CardDescription>
                Kişisel bilgilerinizi görüntüleyin ve düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Success/Error Messages */}
                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">{success}</p>
                  </div>
                )}
                
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* User Avatar and Name */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {(isEditing ? editData.firstName : user.firstName)?.charAt(0)}
                      {(isEditing ? editData.lastName : user.lastName)?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {isEditing ? `${editData.firstName} ${editData.lastName}` : `${user.firstName} ${user.lastName}`}
                    </h3>
                    <p className="text-gray-600">{user.email}</p>
                    <Badge variant={user.isVerified ? 'default' : 'destructive'} className="mt-1">
                      {user.isVerified ? 'Email Doğrulandı' : 'Email Doğrulanmadı'}
                    </Badge>
                  </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* İsim */}
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">İsim</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="İsminizi girin"
                          />
                        ) : (
                          <p className="text-gray-600">{user.firstName}</p>
                        )}
                      </div>
                    </div>

                    {/* Soyisim */}
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Soyisim</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Soyisminizi girin"
                          />
                        ) : (
                          <p className="text-gray-600">{user.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Email Adresi</p>
                        <p className="text-gray-600">{user.email}</p>
                      </div>
                    </div>

                    {/* Telefon */}
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Telefon</p>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Telefon numaranızı giriniz."
                          />
                        ) : (
                          <p className="text-gray-600">{user.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Cinsiyet */}
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Cinsiyet</p>
                        {isEditing ? (
                          <select
                            value={editData.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="male">Erkek</option>
                            <option value="female">Kadın</option>
                            <option value="other">Diğer</option>
                          </select>
                        ) : (
                          <p className="text-gray-600">
                            {user.gender === 'male' ? 'Erkek' : user.gender === 'female' ? 'Kadın' : 'Diğer'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Kayıt Tarihi */}
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Kayıt Tarihi</p>
                        <p className="text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role and Permissions */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Hesap Türü</p>
                      <Badge variant="outline">
                        {user.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t pt-4 flex space-x-3">
                  {isEditing ? (
                    <>
                      <Button 
                        onClick={handleCancel}
                        variant="outline" 
                        size="sm"
                        disabled={loading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        İptal
                      </Button>
                      <Button 
                        onClick={handleSave}
                        size="sm"
                        disabled={loading}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={handleEdit}
                        variant="outline" 
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Bilgileri Düzenle
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        <div className="lg:col-span-2 mt-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Şifreyi Değiştir
              </CardTitle>
            <CardDescription>Güvenliğiniz için güçlü bir şifre kullanın</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Success/Error mesajları */}
              {passwordSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">{passwordSuccess}</p>
                </div>
              )}
              {passwordError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{passwordError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Mevcut Şifre */}
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Mevcut Şifre"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showCurrentPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Yeni Şifre */}
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Yeni Şifre"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showNewPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Yeni Şifre (Tekrar) */}
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="Yeni Şifre (Tekrar)"
                    value={passwordData.confirmNewPassword}
                    onChange={(e) => handlePasswordChange('confirmNewPassword', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    aria-label={showConfirmNewPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  >
                    {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <Button onClick={handlePasswordSubmit} disabled={loading}>
                  {loading ? 'Gönderiliyor...' : 'Şifreyi Güncelle'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                  <Link href="/siparislerim">
                    <Package className="w-4 h-4 mr-2" />
                    Siparişlerim
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                  <Link href="/favorilerim">
                     <Heart className="w-4 h-4 mr-2" />
                      Favorilerim
                  </Link> 
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm" asChild>
                  <Link href="/hesabim/adreslerim">
                    <MapPin className="w-4 h-4 mr-2" />
                    Adreslerim
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Ödeme Yöntemlerim
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Hesap Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Toplam Sipariş</span>
                  <Badge variant="outline">{pagination?.total ?? orders.length ?? 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Favori Ürün</span>
                  <Badge variant="outline">{favorites?.length || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sepette</span>
                  <Badge variant="outline">{cartItemCount || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info (Development) */}
          {process.env.NODE_ENV === 'development' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Debug Info</CardTitle>
                <CardDescription>
                  Bu bölüm sadece geliştirme ortamında görünür
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div><strong>User ID:</strong> {user.id}</div>
                  <div><strong>Role:</strong> {user.role}</div>
                  <div><strong>Is Verified:</strong> {user.isVerified.toString()}</div>
                  <div><strong>Created:</strong> {user.createdAt}</div>
                  <div><strong>Updated:</strong> {user.updatedAt}</div>
                </div>
                <Button 
                  onClick={logout} 
                  variant="destructive" 
                  size="sm" 
                  className="w-full mt-3"
                >
                  Çıkış Yap (Debug)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HesabimPage() {
  return (
    <AuthGuard>
      <HesabimPageContent />
    </AuthGuard>
  )
}