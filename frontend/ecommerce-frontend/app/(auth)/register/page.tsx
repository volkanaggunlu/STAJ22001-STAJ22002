'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, User, Mail, Lock, Phone, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { GuestOnlyRoute } from '@/app/components/ProtectedRoute'
import { useRegister } from '@/lib/hooks/useAuth'
import { registerSchema, RegisterFormData } from '@/lib/validations/auth'
import { formatPhoneNumber } from '@/lib/utils/format'

function RegisterPageContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const register = useRegister()

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    console.log('🔐 Register attempt for:', data.email)
    
    // Backend'in beklediği formatı hazırla
    const registerData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      gender: data.gender
    }

    console.log('🔐 Sending register data:', registerData)
    register.mutate(registerData)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setValue('phone', formatted)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Hesap Oluşturun</h1>
        <p className="text-gray-600 mt-2">Açık Atölye ailesine katılın</p>
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Fields Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
              Ad
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                id="firstName"
                type="text"
                placeholder="Adınız"
                className={`pl-10 ${errors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
                {...registerField('firstName')}
              />
            </div>
            {errors.firstName && (
              <p className="text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
              Soyad
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Soyadınız"
              className={`${errors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
              {...registerField('lastName')}
            />
            {errors.lastName && (
              <p className="text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email Field */}
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
              {...registerField('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Telefon Numarası
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="+90 555 123 45 67"
              className={`pl-10 ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
              {...registerField('phone', {
                onChange: handlePhoneChange
              })}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Gender Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Cinsiyet
          </Label>
          <div className={`space-y-2 ${errors.gender ? 'border border-red-500 rounded-md p-3' : ''}`}>
            <RadioGroup
              onValueChange={(value) => setValue('gender', value as 'male' | 'female')}
              className="flex flex-row space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="cursor-pointer">Erkek</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="cursor-pointer">Kadın</Label>
              </div>
            </RadioGroup>
          </div>
          {errors.gender && (
            <p className="text-sm text-red-600">{errors.gender.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Şifre
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
              {...registerField('password')}
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
          
          {/* Password Strength Indicator */}
          {password && password.length > 0 && (
            <div className="mt-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-2 w-full rounded ${
                      getPasswordStrength(password) >= level
                        ? level <= 2 ? 'bg-red-500' : level === 3 ? 'bg-yellow-500' : 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {getPasswordStrengthText(password)}
              </p>
            </div>
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
              {...registerField('confirmPassword')}
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

        {/* Terms and Privacy */}
        <div className="text-sm text-gray-600">
          Kaydolarak{' '}
          <Link href="/kullanim-kosullari" className="text-primary hover:underline">
            Kullanım Koşulları
          </Link>
          'nı ve{' '}
          <Link href="/gizlilik-politikasi" className="text-primary hover:underline">
            Gizlilik Politikası
          </Link>
          'nı kabul etmiş olursunuz.
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-blue-700 text-black py-2 px-4 rounded-lg transition-colors"
          disabled={isSubmitting || register.isPending}
        >
          {isSubmitting || register.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Hesap oluşturuluyor...
            </>
          ) : (
            'Hesap Oluştur'
          )}
        </Button>
      </form>

      {/* Error Message */}
      {register.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {register.error?.response?.data?.message || 'Kayıt olurken bir hata oluştu'}
          </AlertDescription>
        </Alert>
      )}

      {/* Login Link */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Zaten hesabınız var mı?{' '}
          <Link
            href="/login"
            className="font-medium text-primary2 hover:text-blue-500 transition-colors"
          >
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  )
}

// Password strength helper functions
function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[a-z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return Math.min(strength, 4)
}

function getPasswordStrengthText(password: string): string {
  const strength = getPasswordStrength(password)
  switch (strength) {
    case 1:
      return 'Çok zayıf'
    case 2:
      return 'Zayıf'
    case 3:
      return 'Orta'
    case 4:
      return 'Güçlü'
    default:
      return 'Çok zayıf'
  }
} 

export default function RegisterPage() {
  return (
    <GuestOnlyRoute>
      <RegisterPageContent />
    </GuestOnlyRoute>
  )
} 