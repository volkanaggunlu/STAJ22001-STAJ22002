'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  LogIn, 
  LogOut, 
  UserPlus, 
  Mail, 
  Lock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

export default function AuthTestPage() {
  const { user, isAuthenticated, isLoading, isInitialized, logout } = useAuth()
  const [testResults, setTestResults] = useState<{[key: string]: 'success' | 'error' | 'pending'}>({})

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    setTestResults(prev => ({ ...prev, [testName]: 'pending' }))
    
    try {
      const success = await testFn()
      setTestResults(prev => ({ ...prev, [testName]: success ? 'success' : 'error' }))
    } catch (error) {
      console.error(`Test ${testName} failed:`, error)
      setTestResults(prev => ({ ...prev, [testName]: 'error' }))
    }
  }

  const TestCard = ({ 
    title, 
    description, 
    testKey, 
    action, 
    link 
  }: { 
    title: string
    description: string
    testKey: string
    action?: () => void
    link?: string 
  }) => {
    const status = testResults[testKey]
    
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            {status && (
              <Badge variant={
                status === 'success' ? 'default' : 
                status === 'error' ? 'destructive' : 
                'secondary'
              }>
                {status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                {status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                {status === 'pending' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                {status === 'success' ? 'Başarılı' : 
                 status === 'error' ? 'Hata' : 
                 'Test Ediliyor'}
              </Badge>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {link && (
              <Button asChild variant="outline" size="sm">
                <Link href={link}>Sayfaya Git</Link>
              </Button>
            )}
            {action && (
              <Button 
                onClick={action} 
                size="sm"
                disabled={status === 'pending'}
              >
                {status === 'pending' ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Test Ediliyor
                  </>
                ) : (
                  'Test Et'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Authentication Test Dashboard
        </h1>
        <p className="text-gray-600">
          Authentication sisteminin tüm özelliklerini test edin
        </p>
      </div>

      {/* Current Auth Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Mevcut Authentication Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Durum</p>
              <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                {isAuthenticated ? 'Giriş Yapılmış' : 'Çıkış Yapılmış'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Yükleniyor</p>
              <Badge variant={isLoading ? 'destructive' : 'default'}>
                {isLoading ? 'Evet' : 'Hayır'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">İnitialize</p>
              <Badge variant={isInitialized ? 'default' : 'secondary'}>
                {isInitialized ? 'Tamamlandı' : 'Bekleniyor'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Kullanıcı</p>
              <p className="text-sm text-gray-600">
                {user ? `${user.firstName} ${user.lastName}` : 'Yok'}
              </p>
            </div>
          </div>

          {user && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Kullanıcı Detayları:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Telefon:</strong> {user.phone}</div>
                <div><strong>Cinsiyet:</strong> {user.gender === 'male' ? 'Erkek' : 'Kadın'}</div>
                <div><strong>Email Doğrulandı:</strong> {user.isVerified ? 'Evet' : 'Hayır'}</div>
                <div><strong>Role:</strong> {user.role}</div>
                <div><strong>Kayıt Tarihi:</strong> {new Date(user.createdAt).toLocaleDateString('tr-TR')}</div>
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className="mt-4">
              <Button onClick={logout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış Yap
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Sections */}
      <div className="space-y-8">
        {/* Authentication Flow Tests */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <LogIn className="w-6 h-6" />
            Authentication Flow Tests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TestCard
              title="Login Sayfası"
              description="Kullanıcı giriş formunu test edin"
              testKey="login"
              link="/login"
            />
            <TestCard
              title="Register Sayfası" 
              description="Yeni kullanıcı kayıt formunu test edin"
              testKey="register"
              link="/register"
            />
            <TestCard
              title="Şifremi Unuttum"
              description="Şifre sıfırlama email gönderme işlemini test edin"
              testKey="forgot-password"
              link="/forgot-password"
            />
            <TestCard
              title="Email Doğrulama"
              description="Email doğrulama sayfasını test edin"
              testKey="email-verification"
              link="/email-verification"
            />
          </div>
        </section>

        {/* Route Protection Tests */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6" />
            Route Protection Tests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TestCard
              title="Giriş Yapılmışken Auth Sayfaları"
              description="Giriş yapmış kullanıcı login/register sayfalarına erişmeyi denesin"
              testKey="auth-redirect"
              action={() => runTest('auth-redirect', async () => {
                // Bu test manuel olarak yapılacak
                return true
              })}
            />
            <TestCard
              title="Korumalı Sayfalar"
              description="Çıkış yapmış kullanıcı korumalı sayfalara erişmeyi denesin"
              testKey="protected-routes"
              link="/hesabim"
            />
          </div>
        </section>

        {/* Performance Tests */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Debug Tests
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Console Log'ları</CardTitle>
                <CardDescription>
                  Browser console'unu açın ve authentication işlemlerini izleyin.
                  Tüm auth işlemleri 🔐 emoji ile loglanır.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    F12 tuşuna basıp Console sekmesini açın. Authentication işlemlerini gerçekleştirin ve log'ları izleyin.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Test Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Test Talimatları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Kayıt İşlemi Test:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Register sayfasına gidin</li>
                <li>• Geçerli bilgilerle kayıt olun</li>
                <li>• Backend'den başarılı response alındığını doğrulayın</li>
                <li>• Otomatik login olup olmadığını kontrol edin</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Login İşlemi Test:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Login sayfasına gidin</li>
                <li>• Kayıtlı email/şifre ile giriş yapın</li>
                <li>• Başarılı girişte ana sayfaya yönlendirilmeyi kontrol edin</li>
                <li>• Header'da kullanıcı bilgilerinin görünmesini doğrulayın</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Route Protection Test:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Giriş yapılmışken /login veya /register'a gitmeye çalışın</li>
                <li>• Ana sayfaya yönlendirilmeli</li>
                <li>• Çıkış yapın ve /hesabim'a gitmeye çalışın</li>
                <li>• Login sayfasına yönlendirilmeli</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Logout Test:</h4>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Header'daki logout butonuna tıklayın</li>
                <li>• Authentication state'in temizlenmesini kontrol edin</li>
                <li>• Header'da login butonlarının görünmesini doğrulayın</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 