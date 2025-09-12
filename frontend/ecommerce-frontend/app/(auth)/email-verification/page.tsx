'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useVerifyEmail, useResendVerification } from '@/lib/hooks/useAuth'

function EmailVerificationPageContent() {
  const [token, setToken] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading')
  const [resendEmail, setResendEmail] = useState('')
  const [showResendForm, setShowResendForm] = useState(false)
  
  const searchParams = useSearchParams()
  const verifyEmail = useVerifyEmail()
  const resendVerification = useResendVerification()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
      // Automatically verify when token is present
      verifyEmail.mutate(tokenParam, {
        onSuccess: () => {
          setVerificationStatus('success')
        },
        onError: () => {
          setVerificationStatus('error')
        }
      })
    } else {
      setTokenError(true)
      setVerificationStatus('resend')
    }
  }, [searchParams, verifyEmail])

  const handleResendVerification = () => {
    if (!resendEmail) return
    
    resendVerification.mutate(resendEmail, {
      onSuccess: () => {
        setShowResendForm(false)
        setVerificationStatus('success')
      }
    })
  }

  // Token error or resend state
  if (tokenError || verificationStatus === 'resend') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Doğrulama</h1>
          <p className="text-gray-600">
            Email adresinizi doğrulamak için yeni bir link gönderelim
          </p>
        </div>

        {/* Resend Form */}
        {showResendForm ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Adresi
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="kayitli@email.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={handleResendVerification}
              disabled={!resendEmail || resendVerification.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {resendVerification.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                'Doğrulama Emaili Gönder'
              )}
            </Button>

            {resendVerification.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {resendVerification.error?.response?.data?.message || 'Email gönderilemedi'}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => setShowResendForm(false)}
              variant="ghost"
              className="w-full"
            >
              İptal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Email doğrulama linki bulunamadı.</strong><br />
                Yeni bir doğrulama emaili gönderebiliriz.
              </p>
            </div>

            <Button
              onClick={() => setShowResendForm(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Yeni Doğrulama Emaili Gönder
            </Button>
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    )
  }

  // Loading state
  if (verificationStatus === 'loading') {
    return (
      <div className="space-y-6 text-center">
        {/* Loading Icon */}
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>

        {/* Loading Message */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Doğrulanıyor</h1>
          <p className="text-gray-600">Lütfen bekleyin...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (verificationStatus === 'success') {
    return (
      <div className="space-y-6 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        {/* Success Message */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Başarıyla Doğrulandı</h1>
          <p className="text-gray-600">
            Tebrikler! Email adresiniz doğrulandı. Artık hesabınızı tam olarak kullanabilirsiniz.
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-green-50 p-4 rounded-lg text-left">
          <p className="text-sm text-green-800 font-medium mb-2">Artık şunları yapabilirsiniz:</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Güvenli alışveriş yapabilirsiniz</li>
            <li>• Sipariş durumu bilgilendirmeleri alabilirsiniz</li>
            <li>• Özel kampanya ve indirimlerden haberdar olabilirsiniz</li>
            <li>• Hesabınızın tüm özelliklerine erişebilirsiniz</li>
          </ul>
        </div>

        {/* Action */}
        <Link href="/">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            Alışverişe Başla
          </Button>
        </Link>

        <Link href="/login" className="block">
          <Button variant="ghost" className="w-full">
            Giriş Yap
          </Button>
        </Link>
      </div>
    )
  }

  // Error state
  if (verificationStatus === 'error') {
    return (
      <div className="space-y-6 text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        {/* Error Message */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Doğrulama Başarısız</h1>
          <p className="text-gray-600">
            Email doğrulama linki geçersiz, süresi dolmuş ya da kullanılmış olabilir.
          </p>
        </div>

        {/* Error Info */}
        <div className="bg-yellow-50 p-4 rounded-lg text-left">
          <p className="text-sm text-yellow-800">
            <strong>Olası nedenler:</strong>
          </p>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• Link 24 saatlik süre sınırını aştı</li>
            <li>• Link daha önce kullanıldı</li>
            <li>• Email'deki link tam olarak kopyalanmadı</li>
            <li>• Hesap zaten doğrulanmış olabilir</li>
          </ul>
        </div>

        {/* Error Message from API */}
        {verifyEmail.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {verifyEmail.error?.response?.data?.message || 'Email doğrulanamadı'}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => setVerificationStatus('resend')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Yeni Doğrulama Emaili Gönder
          </Button>
          
          <Link href="/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Giriş sayfasına dön
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return null
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <EmailVerificationPageContent />
    </Suspense>
  )
} 