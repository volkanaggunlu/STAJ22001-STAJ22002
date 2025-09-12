'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useResetPassword } from '@/lib/hooks/useAuth'
import { resetPasswordSchema, ResetPasswordFormData } from '@/lib/validations/auth'

function ResetPasswordPageContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetPassword = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      console.log('🔐 No reset token found, redirecting to forgot password')
      router.replace('/forgot-password')
      return
    }
    setToken(tokenParam)
    console.log('🔐 Reset password token found')
  }, [searchParams, router])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      console.error('🔐 No token available for reset')
      return
    }

    console.log('🔐 Password reset attempt with token')
    resetPassword.mutate(
      { 
        token, 
        newPassword: data.password 
      },
      {
        onSuccess: () => {
          setSuccess(true)
          console.log('🔐 Password reset successful')
        }
      }
    )
  }

  // Token eksikse yönlendirme bekleniyor
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Yönlendiriliyor...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Şifre Sıfırlandı</h1>
          <p className="text-gray-600">
            Şifreniz başarıyla güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz.
          </p>
        </div>

        <Button
          onClick={() => router.push('/login')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Giriş Sayfasına Git
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Şifre Oluşturun</h1>
        <p className="text-gray-600 mt-2">
          Hesabınız için güçlü bir şifre belirleyin
        </p>
      </div>

      {/* Reset Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Yeni Şifre
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Güçlü bir şifre oluşturun"
              className={`pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Şifre Tekrarı
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Şifrenizi tekrar giriniz"
              className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Password Strength Indicator */}
        {password && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Şifre Güçlendirici:</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {password.length >= 8 ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-xs ${password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                  En az 8 karakter
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {/[A-Z]/.test(password) ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-xs ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                  Bir büyük harf
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {/[a-z]/.test(password) ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-xs ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                  Bir küçük harf
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {/\d/.test(password) ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full border-2 border-gray-300" />
                )}
                <span className={`text-xs ${/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                  Bir rakam
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSubmitting || resetPassword.isPending}
        >
          {isSubmitting || resetPassword.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Şifre sıfırlanıyor...
            </>
          ) : (
            'Şifreyi Sıfırla'
          )}
        </Button>
      </form>

      {/* Error Message */}
      {resetPassword.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {resetPassword.error?.response?.data?.message || 'Şifre sıfırlanırken bir hata oluştu'}
          </AlertDescription>
        </Alert>
      )}

      {/* Back to Login */}
      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
        >
          Giriş sayfasına dön
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  // Reset password sayfası hem authenticated hem unauthenticated kullanıcılar için olmalı
  // Çünkü kullanıcı giriş yapmış olsa bile şifresini değiştirmek isteyebilir
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  )
} 