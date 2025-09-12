'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GuestOnlyRoute } from '@/app/components/ProtectedRoute'
import { useForgotPassword } from '@/lib/hooks/useAuth'
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations/auth'

function ForgotPasswordPageContent() {
  const [emailSent, setEmailSent] = useState(false)
  const forgotPassword = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    console.log('🔐 Forgot password request for:', data.email)
    forgotPassword.mutate(data.email, {
      onSuccess: () => {
        setEmailSent(true)
      }
    })
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Email Gönderildi</h1>
          <p className="text-gray-600">
            <strong>{getValues('email')}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Email gelmediyse spam klasörünüzü kontrol edin.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => setEmailSent(false)}
            variant="outline"
            className="w-full"
          >
            Farklı Email Adresi Dene
          </Button>
          
          <Link href="/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Giriş Sayfasına Dön
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Şifremi Unuttum</h1>
        <p className="text-gray-600 mt-2">
          Email adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="ornek@email.com"
              className={`pl-10 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-primary  text-black"
          disabled={isSubmitting || forgotPassword.isPending}
        >
          {isSubmitting || forgotPassword.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            'Şifre Sıfırlama Bağlantısı Gönder'
          )}
        </Button>
      </form>

      {/* Error Message */}
      {forgotPassword.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {forgotPassword.error?.response?.data?.message || 'Bir hata oluştu, lütfen tekrar deneyin'}
          </AlertDescription>
        </Alert>
      )}

      {/* Back to Login */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-primary2 hover:text-blue-500 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Giriş sayfasına dön
        </Link>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <GuestOnlyRoute>
      <ForgotPasswordPageContent />
    </GuestOnlyRoute>
  )
} 